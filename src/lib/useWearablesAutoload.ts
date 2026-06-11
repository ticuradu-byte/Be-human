// src/lib/useWearablesAutoload.ts
// Hook care încarcă automat datele din wearables și profil
// Folosit în pagina de analiză pentru pre-completare automată

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase'

const API = process.env.NEXT_PUBLIC_WEARABLES_API_URL || 'http://localhost:8001'

export interface DateAutomate {
  // Din wearables
  hrv?: number
  ore_somn?: number
  calitate_somn?: number
  pasi?: number
  stres_garmin?: number
  calorii_total?: number
  spo2_medie?: number
  hr_repaus?: number
  vo2max?: number
  body_battery?: number
  temperatura_delta?: number
  // Din profil
  analize_text?: string
  medicamente?: string
  conditii_medicale?: string[]
  profil_text?: string
  // Status
  surse_active: string[]
  ultima_sync?: string
  data_zi: string
}

export function useWearablesAutoload() {
  const supabase = createBrowserClient()
  const [date, setDate]       = useState<DateAutomate | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId]   = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setUserId(user.id)

      const ieri = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
      const rezultat: DateAutomate = { surse_active: [], data_zi: ieri }

      // 1. Date din cache Supabase (wearables de ieri)
      const { data: wData } = await supabase
        .from('wearable_date_zilnice')
        .select('provider, date_norm')
        .eq('user_id', user.id)
        .eq('data_zi', ieri)

      if (wData?.length) {
        const oura   = wData.find(d => d.provider === 'oura')?.date_norm || {}
        const garmin = wData.find(d => d.provider === 'garmin')?.date_norm || {}
        const hc     = wData.find(d => d.provider === 'health_connect')?.date_norm || {}

        // Combină — preferă Oura pentru somn/HRV, Garmin pentru activitate
        if (oura.hrv_mediu_noapte || garmin.hrv_last_night || hc.hrv) {
          rezultat.hrv = oura.hrv_mediu_noapte || garmin.hrv_last_night || hc.hrv
          rezultat.surse_active.push('HRV')
        }
        if (oura.ore_somn || garmin.ore_somn || hc.ore_somn) {
          rezultat.ore_somn = oura.ore_somn || garmin.ore_somn || hc.ore_somn
          rezultat.calitate_somn = oura.calitate_somn || garmin.calitate_somn
          rezultat.surse_active.push('Somn')
        }
        if (garmin.pasi || oura.steps || hc.pasi) {
          rezultat.pasi = garmin.pasi || oura.steps || hc.pasi
          rezultat.surse_active.push('Pași')
        }
        if (garmin.stress_mediu) {
          rezultat.stres_garmin = garmin.stress_mediu
          rezultat.surse_active.push('Stres')
        }
        if (garmin.calorii_total || oura.calorii_total) {
          rezultat.calorii_total = garmin.calorii_total || oura.calorii_total
        }
        if (garmin.spo2_medie || oura.spo2_medie || hc.spo2_medie) {
          rezultat.spo2_medie = garmin.spo2_medie || oura.spo2_medie || hc.spo2_medie
          rezultat.surse_active.push('SpO2')
        }
        if (garmin.hr_repaus || oura.hr_minim || hc.hr_repaus) {
          rezultat.hr_repaus = garmin.hr_repaus || oura.hr_minim || hc.hr_repaus
        }
        if (garmin.vo2max) rezultat.vo2max = garmin.vo2max
        if (garmin.body_battery_max) rezultat.body_battery = garmin.body_battery_max
        if (oura.temperatura_delta) rezultat.temperatura_delta = oura.temperatura_delta
      }

      // Dacă nu e în cache — încearcă să tragă live
      if (rezultat.surse_active.length === 0) {
        try {
          const res = await fetch(`${API}/wearables/date-complete/${user.id}?data=${ieri}`)
          if (res.ok) {
            const liveData = await res.json()
            const c = liveData.combinat || {}
            if (c.hrv) { rezultat.hrv = c.hrv; rezultat.surse_active.push('HRV') }
            if (c.ore_somn) { rezultat.ore_somn = c.ore_somn; rezultat.calitate_somn = c.calitate_somn; rezultat.surse_active.push('Somn') }
            if (c.pasi) { rezultat.pasi = c.pasi; rezultat.surse_active.push('Pași') }
            if (c.stres_garmin) { rezultat.stres_garmin = c.stres_garmin; rezultat.surse_active.push('Stres') }
            if (c.spo2_medie) { rezultat.spo2_medie = c.spo2_medie; rezultat.surse_active.push('SpO2') }
            if (c.hr_minim) rezultat.hr_repaus = c.hr_minim
            if (c.calorii_total) rezultat.calorii_total = c.calorii_total
            if (c.vo2max) rezultat.vo2max = c.vo2max
          }
        } catch {}
      }

      // 2. Profil utilizator (analize + medicație)
      const { data: util } = await supabase
        .from('utilizatori')
        .select('profil_complet, plan')
        .eq('id', user.id)
        .single()

      if (util?.profil_complet) {
        const p = util.profil_complet
        if (p.analize_text) rezultat.analize_text = p.analize_text
        if (p.medicamente)  rezultat.medicamente  = p.medicamente
        if (p.conditii_medicale?.length) rezultat.conditii_medicale = p.conditii_medicale

        // Construiește text profil pentru AI
        const parti = []
        if (p.prenume && p.data_nastere) {
          const varsta = new Date().getFullYear() - new Date(p.data_nastere).getFullYear()
          parti.push(`${varsta} ani, ${p.sex === 'M' ? 'bărbat' : 'femeie'}`)
        }
        if (p.inaltime_cm && p.greutate_kg) {
          parti.push(`${p.greutate_kg}kg, ${p.inaltime_cm}cm (BMI: ${p.bmi})`)
        }
        if (p.activitate) parti.push(`Activitate: ${p.activitate}`)
        if (p.dieta)      parti.push(`Dietă: ${p.dieta}`)
        if (p.fumat && p.fumat !== 'nefumator') parti.push(`Fumat: ${p.fumat}`)
        if (p.conditii_medicale?.length) parti.push(`Condiții: ${p.conditii_medicale.join(', ')}`)
        if (p.obiective?.length) parti.push(`Obiective: ${p.obiective.join(', ')}`)
        if (p.circumferinta_talie) parti.push(`Talie: ${p.circumferinta_talie}cm`)

        rezultat.profil_text = parti.join(' · ')
      }

      rezultat.ultima_sync = new Date().toISOString()
      setDate(rezultat)
      setLoading(false)
    }

    load()
  }, [])

  // Generează textul pentru câmpurile de analiză
  const genereazaTextWearable = (d: DateAutomate): string => {
    const linii = []
    if (d.hrv)           linii.push(`HRV noapte: ${d.hrv}ms`)
    if (d.ore_somn)      linii.push(`Somn: ${d.ore_somn}h${d.calitate_somn ? ` (calitate ${d.calitate_somn}/100)` : ''}`)
    if (d.pasi)          linii.push(`Pași: ${d.pasi.toLocaleString('ro-RO')}`)
    if (d.stres_garmin)  linii.push(`Stres: ${d.stres_garmin}/100`)
    if (d.calorii_total) linii.push(`Calorii arse: ${d.calorii_total} kcal`)
    if (d.hr_repaus)     linii.push(`HR repaus: ${d.hr_repaus} bpm`)
    if (d.spo2_medie)    linii.push(`SpO2: ${d.spo2_medie}%`)
    if (d.vo2max)        linii.push(`VO2max: ${d.vo2max} ml/kg/min`)
    if (d.body_battery)  linii.push(`Body Battery max: ${d.body_battery}/100`)
    if (d.temperatura_delta !== undefined) linii.push(`Temperatură delta: ${d.temperatura_delta > 0 ? '+' : ''}${d.temperatura_delta}°C`)
    return linii.join('\n')
  }

  return {
    date,
    loading,
    userId,
    areDate: (date?.surse_active?.length || 0) > 0,
    areProfilComplet: !!(date?.profil_text),
    areAnalize: !!(date?.analize_text),
    genereazaTextWearable,
  }
}
