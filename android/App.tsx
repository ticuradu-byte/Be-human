// android/App.tsx
// be-human Android App — React Native cu Google Health Connect
// Suportă: Amazfit, Xiaomi Mi Band, Huawei, Samsung, Fitbit, orice device Android

// Instalare:
// npx react-native init BeHumanApp --template react-native-template-typescript
// npm install @kingstinct/react-native-healthconnect
// npm install @supabase/supabase-js @react-native-async-storage/async-storage
// npm install react-native-push-notification @react-native-community/push-notification-ios

import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, Platform, StatusBar, ActivityIndicator, Linking,
} from 'react-native'

// Health Connect
import {
  initialize,
  requestPermission,
  readRecords,
  getSdkStatus,
  SdkAvailabilityStatus,
} from '@kingstinct/react-native-healthconnect'

// Supabase
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

// ── CONFIG ────────────────────────────────────────────────────────────────────
const SUPABASE_URL  = 'https://aaonctqrvfpotzsqeykl.supabase.co' // din .env
const SUPABASE_KEY  = 'eyJ...' // anon key
const APP_URL       = 'https://be-human.ro'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true },
})

// ── PERMISIUNI HEALTH CONNECT ─────────────────────────────────────────────────
const PERMISIUNI_NECESARE = [
  { accessType: 'read', recordType: 'HeartRate' },
  { accessType: 'read', recordType: 'HeartRateVariabilitySdnn' },
  { accessType: 'read', recordType: 'Steps' },
  { accessType: 'read', recordType: 'SleepSession' },
  { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
  { accessType: 'read', recordType: 'TotalCaloriesBurned' },
  { accessType: 'read', recordType: 'OxygenSaturation' },
  { accessType: 'read', recordType: 'BodyTemperature' },
  { accessType: 'read', recordType: 'RestingHeartRate' },
  { accessType: 'read', recordType: 'Weight' },
  { accessType: 'read', recordType: 'ExerciseSession' },
  { accessType: 'read', recordType: 'StressLevel' },
]

// ── CITIRE DATE HEALTH CONNECT ────────────────────────────────────────────────
async function citesteDateHealthConnect(dataZi: string): Promise<Record<string, any>> {
  const startTime = new Date(dataZi + 'T00:00:00.000Z').toISOString()
  const endTime   = new Date(dataZi + 'T23:59:59.999Z').toISOString()
  const date_norm: Record<string, any> = { data_zi: dataZi, provider: 'health_connect' }

  try {
    // HRV
    const hrv = await readRecords('HeartRateVariabilitySdnn', { timeRangeFilter: { operator: 'between', startTime, endTime } })
    if (hrv.records.length > 0) {
      const hrv_values = hrv.records.map((r: any) => r.heartRateVariabilityMillis)
      date_norm.hrv = Math.round(hrv_values.reduce((a: number, b: number) => a + b, 0) / hrv_values.length)
    }

    // Frecvență cardiacă
    const hr = await readRecords('RestingHeartRate', { timeRangeFilter: { operator: 'between', startTime, endTime } })
    if (hr.records.length > 0) {
      date_norm.hr_repaus = hr.records[hr.records.length - 1].beatsPerMinute
    }

    // Pași
    const pasi = await readRecords('Steps', { timeRangeFilter: { operator: 'between', startTime, endTime } })
    if (pasi.records.length > 0) {
      date_norm.pasi = pasi.records.reduce((sum: number, r: any) => sum + r.count, 0)
    }

    // Calorii
    const calorii = await readRecords('TotalCaloriesBurned', { timeRangeFilter: { operator: 'between', startTime, endTime } })
    if (calorii.records.length > 0) {
      date_norm.calorii_total = Math.round(calorii.records.reduce((s: number, r: any) => s + r.energy.inKilocalories, 0))
    }

    // SpO2
    const spo2 = await readRecords('OxygenSaturation', { timeRangeFilter: { operator: 'between', startTime, endTime } })
    if (spo2.records.length > 0) {
      const valori = spo2.records.map((r: any) => r.percentage)
      date_norm.spo2_medie = +(valori.reduce((a: number, b: number) => a + b, 0) / valori.length).toFixed(1)
      date_norm.spo2_minima = Math.min(...valori)
    }

    // Somn
    const somn = await readRecords('SleepSession', { timeRangeFilter: { operator: 'between', startTime, endTime } })
    if (somn.records.length > 0) {
      const sesiuneSomn = somn.records[0]
      const durata = (new Date(sesiuneSomn.endTime).getTime() - new Date(sesiuneSomn.startTime).getTime()) / 3600000
      date_norm.ore_somn = +durata.toFixed(1)

      if (sesiuneSomn.stages) {
        const deep  = sesiuneSomn.stages.filter((s: any) => s.stage === 5)
        const rem   = sesiuneSomn.stages.filter((s: any) => s.stage === 6)
        date_norm.deep_sleep_min = deep.reduce((s: number, st: any) => s + (new Date(st.endTime).getTime() - new Date(st.startTime).getTime()) / 60000, 0)
        date_norm.rem_sleep_min  = rem.reduce((s: number, st: any)  => s + (new Date(st.endTime).getTime() - new Date(st.startTime).getTime()) / 60000, 0)
      }
    }

    // Temperatură corporală
    const temp = await readRecords('BodyTemperature', { timeRangeFilter: { operator: 'between', startTime, endTime } })
    if (temp.records.length > 0) {
      date_norm.temperatura_corp = temp.records[temp.records.length - 1].temperature.inCelsius
    }

    // Greutate
    const greutate = await readRecords('Weight', { timeRangeFilter: { operator: 'between', startTime, endTime } })
    if (greutate.records.length > 0) {
      date_norm.greutate_kg = +greutate.records[0].weight.inKilograms.toFixed(1)
    }

    // Antrenamente
    const antrenamente = await readRecords('ExerciseSession', { timeRangeFilter: { operator: 'between', startTime, endTime } })
    if (antrenamente.records.length > 0) {
      date_norm.antrenamente = antrenamente.records.map((a: any) => ({
        tip: a.exerciseType,
        durata_min: Math.round((new Date(a.endTime).getTime() - new Date(a.startTime).getTime()) / 60000),
      }))
    }

  } catch (e) {
    console.error('Eroare citire Health Connect:', e)
  }

  return date_norm
}

// ── COMPONENT PRINCIPAL ───────────────────────────────────────────────────────
export default function App() {
  const [user, setUser]                 = useState<any>(null)
  const [hcDisponibil, setHcDisponibil] = useState(false)
  const [permisiuni, setPermisiuni]     = useState(false)
  const [syncing, setSyncing]           = useState(false)
  const [ultimaSync, setUltimaSync]     = useState<string | null>(null)
  const [dateAzi, setDateAzi]           = useState<Record<string, any>>({})
  const [notifScor, setNotifScor]       = useState<number | null>(null)
  const [loading, setLoading]           = useState(true)
  const [eroare, setEroare]             = useState('')

  useEffect(() => {
    initializeApp()
  }, [])

  const initializeApp = async () => {
    try {
      // Verifică sesiunea Supabase
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        await incarcaUltimaSync(session.user.id)
      }

      // Verifică Health Connect (Android 14+)
      if (Platform.OS === 'android') {
        const status = await getSdkStatus()
        if (status === SdkAvailabilityStatus.SDK_AVAILABLE) {
          setHcDisponibil(true)
          await initialize()
          setPermisiuni(true)
        } else if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) {
          // Redirecționează la Play Store pentru update Health Connect
          Alert.alert(
            'Health Connect necesită update',
            'Apasă OK pentru a actualiza Health Connect din Play Store.',
            [{ text: 'OK', onPress: () => Linking.openURL('market://details?id=com.google.android.apps.healthdata') }]
          )
        }
      }
    } catch (e) {
      console.error('Init error:', e)
    } finally {
      setLoading(false)
    }
  }

  const incarcaUltimaSync = async (userId: string) => {
    const { data } = await supabase.from('wearable_date_zilnice')
      .select('ultima_sync:creat_la, date_norm')
      .eq('user_id', userId)
      .eq('provider', 'health_connect')
      .order('data_zi', { ascending: false })
      .limit(1)
      .single()

    if (data) {
      setUltimaSync(data.ultima_sync)
      setDateAzi(data.date_norm)
    }
  }

  const cererPermisiuni = async () => {
    try {
      const granted = await requestPermission(PERMISIUNI_NECESARE as any)
      if (granted.length > 0) {
        setPermisiuni(true)
        Alert.alert('✅ Permisiuni acordate', 'be-human poate acum citi datele de sănătate.')
      }
    } catch (e) {
      Alert.alert('Eroare', 'Nu s-au putut acorda permisiunile.')
    }
  }

  const syncDate = async () => {
    if (!user) { Alert.alert('Loghează-te mai întâi'); return }
    if (!permisiuni) { await cererPermisiuni(); return }

    setSyncing(true); setEroare('')
    try {
      const ieri = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
      const azi  = new Date().toISOString().slice(0, 10)

      const [dateIeri, dateAziRead] = await Promise.all([
        citesteDateHealthConnect(ieri),
        citesteDateHealthConnect(azi),
      ])

      // Salvează în Supabase
      await supabase.from('wearable_date_zilnice').upsert([
        { user_id: user.id, data_zi: ieri, provider: 'health_connect', date_norm: dateIeri, date_raw: dateIeri },
        { user_id: user.id, data_zi: azi,  provider: 'health_connect', date_norm: dateAziRead, date_raw: dateAziRead },
      ], { onConflict: 'user_id,data_zi,provider' })

      setDateAzi(dateAziRead)
      setUltimaSync(new Date().toISOString())

      // Calculează scor rapid
      const scor = calculeazaScorRapid(dateAziRead)
      setNotifScor(scor)

      Alert.alert('✅ Sync complet!', `Date din Health Connect salvate.\nScor wellness estimat: ${scor}/100`)

    } catch (e: any) {
      setEroare('Eroare la sync: ' + e.message)
    } finally {
      setSyncing(false)
    }
  }

  function calculeazaScorRapid(d: Record<string, any>): number {
    let s = 0
    if (d.hrv) s += d.hrv >= 45 ? 30 : d.hrv >= 35 ? 20 : 10
    if (d.ore_somn) s += d.ore_somn >= 7.5 ? 25 : d.ore_somn >= 6.5 ? 18 : 10
    if (d.pasi) s += d.pasi >= 10000 ? 15 : d.pasi >= 7000 ? 10 : 5
    s += 30 // default pentru restul
    return Math.min(100, Math.round(s))
  }

  const deschideDashboard = () => {
    Linking.openURL(`${APP_URL}/dashboard`)
  }

  if (loading) return (
    <View style={[s.container, s.center]}>
      <ActivityIndicator size="large" color="#4ade80" />
      <Text style={s.loadingText}>Se încarcă be-human...</Text>
    </View>
  )

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#070d09" />
      <ScrollView contentContainerStyle={s.scroll}>

        {/* Header */}
        <View style={s.header}>
          <View style={s.logoRow}>
            <View style={s.logoIcon}><Text style={s.logoEmoji}>🫀</Text></View>
            <View>
              <Text style={s.logoText}>be-human</Text>
              <Text style={s.logoSub}>WELLNESS AI · ANDROID</Text>
            </View>
          </View>
        </View>

        {/* Status HC */}
        <View style={[s.card, hcDisponibil ? s.cardGreen : s.cardGray]}>
          <Text style={s.cardTitle}>⌚ Google Health Connect</Text>
          <Text style={[s.statusText, { color: hcDisponibil ? '#4ade80' : 'rgba(255,255,255,.4)' }]}>
            {hcDisponibil ? '✓ Disponibil — suportă 50+ device-uri' : '✗ Nu e disponibil pe acest device'}
          </Text>
          {hcDisponibil && !permisiuni && (
            <TouchableOpacity style={s.btnGreen} onPress={cererPermisiuni}>
              <Text style={s.btnGreenText}>Acordă permisiuni →</Text>
            </TouchableOpacity>
          )}
          {hcDisponibil && permisiuni && (
            <Text style={s.permisiuniText}>✓ Permisiuni acordate · Citesc: HRV, Somn, Pași, SpO2, Temp</Text>
          )}
        </View>

        {/* Scor + date */}
        {notifScor !== null && (
          <View style={s.card}>
            <Text style={s.cardTitle}>📊 Scor Wellness Estimat Azi</Text>
            <View style={s.scorRow}>
              <Text style={[s.scorNumar, { color: notifScor >= 75 ? '#4ade80' : notifScor >= 55 ? '#facc15' : '#f87171' }]}>
                {notifScor}
              </Text>
              <Text style={s.scorLabel}>/100</Text>
            </View>
          </View>
        )}

        {/* Date de azi */}
        {Object.keys(dateAzi).length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>📈 Date citite azi</Text>
            <View style={s.metriciGrid}>
              {[
                { icon: '💓', label: 'HRV', val: dateAzi.hrv ? `${dateAzi.hrv}ms` : '—' },
                { icon: '😴', label: 'Somn', val: dateAzi.ore_somn ? `${dateAzi.ore_somn}h` : '—' },
                { icon: '🏃', label: 'Pași', val: dateAzi.pasi ? dateAzi.pasi.toLocaleString('ro-RO') : '—' },
                { icon: '💨', label: 'SpO2', val: dateAzi.spo2_medie ? `${dateAzi.spo2_medie}%` : '—' },
                { icon: '❤️', label: 'HR', val: dateAzi.hr_repaus ? `${dateAzi.hr_repaus}bpm` : '—' },
                { icon: '🔥', label: 'Calorii', val: dateAzi.calorii_total ? `${dateAzi.calorii_total}` : '—' },
              ].map((m, i) => (
                <View key={i} style={s.metricBox}>
                  <Text style={s.metricIcon}>{m.icon}</Text>
                  <Text style={s.metricVal}>{m.val}</Text>
                  <Text style={s.metricLabel}>{m.label}</Text>
                </View>
              ))}
            </View>
            {ultimaSync && (
              <Text style={s.ultimaSync}>Ultima sync: {new Date(ultimaSync).toLocaleString('ro-RO')}</Text>
            )}
          </View>
        )}

        {/* Device-uri suportate */}
        <View style={s.card}>
          <Text style={s.cardTitle}>📱 Device-uri suportate prin Health Connect</Text>
          {[
            '⌚ Amazfit (toate modelele) — via Zepp app',
            '📿 Xiaomi Mi Band 7/8/9 — via Mi Fitness',
            '💙 Samsung Galaxy Watch — via Samsung Health',
            '🔴 Huawei Watch — via Huawei Health (limitat)',
            '💚 Fitbit — via Fitbit app',
            '❤️ Withings — via Health Mate',
            '💪 Garmin — via Garmin Connect',
            '+ orice alt device cu app pe Android',
          ].map((d, i) => (
            <Text key={i} style={s.deviceItem}>{d}</Text>
          ))}
        </View>

        {eroare ? <Text style={s.eroare}>{eroare}</Text> : null}

        {/* Butoane principale */}
        <TouchableOpacity style={s.btnGreen} onPress={syncDate} disabled={syncing || !hcDisponibil}>
          {syncing
            ? <ActivityIndicator color="#070d09" />
            : <Text style={s.btnGreenText}>{hcDisponibil && permisiuni ? '⬇️ Sync date Health Connect' : '⌚ Configurează Health Connect'}</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity style={s.btnGhost} onPress={deschideDashboard}>
          <Text style={s.btnGhostText}>🌿 Deschide dashboard be-human →</Text>
        </TouchableOpacity>

        <Text style={s.disclaimer}>
          be-human nu înlocuiește consultul medical. Urgențe: 112
        </Text>

      </ScrollView>
    </View>
  )
}

// ── STILURI ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#070d09' },
  center:         { justifyContent: 'center', alignItems: 'center' },
  scroll:         { padding: 20, paddingTop: 48 },
  loadingText:    { color: 'rgba(255,255,255,.4)', marginTop: 12, fontSize: 14 },

  header:         { marginBottom: 20 },
  logoRow:        { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoIcon:       { width: 48, height: 48, borderRadius: 14, backgroundColor: '#16a34a', justifyContent: 'center', alignItems: 'center' },
  logoEmoji:      { fontSize: 24 },
  logoText:       { fontSize: 24, fontWeight: '700', color: '#4ade80', letterSpacing: -0.5 },
  logoSub:        { fontSize: 9, color: 'rgba(255,255,255,.3)', letterSpacing: 2, marginTop: 2 },

  card:           { backgroundColor: 'rgba(255,255,255,.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,.07)', borderRadius: 16, padding: 16, marginBottom: 12 },
  cardGreen:      { borderColor: 'rgba(74,222,128,.2)', backgroundColor: 'rgba(74,222,128,.04)' },
  cardGray:       { borderColor: 'rgba(255,255,255,.07)' },
  cardTitle:      { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },

  statusText:     { fontSize: 13, marginBottom: 8 },
  permisiuniText: { fontSize: 11, color: 'rgba(74,222,128,.6)', marginTop: 6 },

  scorRow:        { flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginTop: 4 },
  scorNumar:      { fontSize: 52, fontWeight: '700', lineHeight: 56 },
  scorLabel:      { fontSize: 18, color: 'rgba(255,255,255,.3)', marginBottom: 8 },

  metriciGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  metricBox:      { width: '30%', backgroundColor: 'rgba(0,0,0,.3)', borderRadius: 12, padding: 10, alignItems: 'center' },
  metricIcon:     { fontSize: 18, marginBottom: 4 },
  metricVal:      { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,.85)' },
  metricLabel:    { fontSize: 9, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', marginTop: 2 },
  ultimaSync:     { fontSize: 10, color: 'rgba(255,255,255,.2)', marginTop: 10, textAlign: 'center' },

  deviceItem:     { fontSize: 12, color: 'rgba(255,255,255,.5)', paddingVertical: 3 },

  btnGreen:       { backgroundColor: '#16a34a', borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 10 },
  btnGreenText:   { color: '#070d09', fontSize: 15, fontWeight: '700' },
  btnGhost:       { backgroundColor: 'rgba(255,255,255,.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,.1)', borderRadius: 14, padding: 14, alignItems: 'center', marginBottom: 20 },
  btnGhostText:   { color: 'rgba(255,255,255,.6)', fontSize: 14 },

  eroare:         { color: '#f87171', fontSize: 12, textAlign: 'center', marginBottom: 10, padding: 12, backgroundColor: 'rgba(239,68,68,.08)', borderRadius: 10 },
  disclaimer:     { fontSize: 10, color: 'rgba(255,255,255,.2)', textAlign: 'center', lineHeight: 16, paddingBottom: 20 },
})
