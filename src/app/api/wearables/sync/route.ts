export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('user_id')
    if (!userId) return NextResponse.json({ error: 'no_user_id' }, { status: 400 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: user } = await supabase
      .from('utilizatori').select('profil_complet').eq('id', userId).single()

    const profil = user?.profil_complet || {}
    const rezultat: any = {
      surse_active: [],
      pasi: null, calorii: null, hr_medie: null,
      hrv: null, ore_somn: null, somn_profund: null, somn_rem: null,
      spo2: null, temperatura: null, readiness: null,
      greutate: null, hidratare_ml: null, minute_active: null,
      zile: [], azi: null,
    }

    // Google Fit / Health Connect — încearcă mereu, endpoint-ul verifică token intern
    {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://be-human-gamma.vercel.app'
        const res = await fetch(`${baseUrl}/api/wearables/google-fit/data?user_id=${userId}`)
        const gfit = await res.json()
        console.log('GFit response ok:', gfit.ok, 'azi:', !!gfit.azi, 'error:', gfit.error)
        if (gfit.ok && gfit.azi) {
          rezultat.surse_active.push('Google Fit')
          rezultat.pasi = gfit.azi.pasi || null
          rezultat.calorii = gfit.azi.calorii || null
          rezultat.minute_active = gfit.azi.minute_active || null
          rezultat.greutate = gfit.azi.greutate || null
          rezultat.ore_somn = gfit.azi.ore_somn || null
          rezultat.spo2 = gfit.azi.spo2 || null
          rezultat.hidratare_ml = gfit.azi.hidratare_ml || null
          const hrVal = gfit.azi.hr_medie || gfit.zile?.slice().reverse().find((z: any) => z.hr_medie > 0)?.hr_medie || null
          rezultat.hr_medie = hrVal
          rezultat.zile = gfit.zile || []
          rezultat.azi = gfit.azi
        }
      } catch(e) { console.log('GFit sync:', e) }
    }

    // Oura Ring
    if (profil?.oura_token) {
      try {
        const ieri = new Date(Date.now() - 86400000).toISOString().slice(0,10)
        const [readRes, somnRes] = await Promise.all([
          fetch(`https://api.ouraring.com/v2/usercollection/daily_readiness?start_date=${ieri}`, {
            headers: { 'Authorization': `Bearer ${profil.oura_token}` }
          }),
          fetch(`https://api.ouraring.com/v2/usercollection/daily_sleep?start_date=${ieri}`, {
            headers: { 'Authorization': `Bearer ${profil.oura_token}` }
          }),
        ])
        if (readRes.ok) {
          const r = await readRes.json()
          const d = r.data?.[0]
          if (d) {
            rezultat.surse_active.push('Oura Ring')
            rezultat.readiness = d.score
            rezultat.hrv = d.contributors?.hrv_balance
            rezultat.temperatura = d.temperature_deviation
          }
        }
        if (somnRes.ok) {
          const s = await somnRes.json()
          const d = s.data?.[0]
          if (d) {
            rezultat.ore_somn = Math.round(d.total_sleep_duration / 3600 * 10) / 10
            rezultat.somn_profund = Math.round(d.deep_sleep_duration / 3600 * 10) / 10
            rezultat.somn_rem = Math.round(d.rem_sleep_duration / 3600 * 10) / 10
          }
        }
      } catch(e) { console.log('Oura sync:', e) }
    }

    // Text pentru analiză
    const linii: string[] = []
    if (rezultat.surse_active.length > 0) {
      linii.push(`Date wearables (${rezultat.surse_active.join(' + ')}):`)
      if (rezultat.pasi) linii.push(`- Pași ieri: ${rezultat.pasi.toLocaleString()}`)
      if (rezultat.calorii) linii.push(`- Calorii: ${rezultat.calorii} kcal`)
      if (rezultat.hr_medie) linii.push(`- HR medie: ${rezultat.hr_medie} bpm`)
      if (rezultat.minute_active) linii.push(`- Minute active: ${rezultat.minute_active} min`)
      if (rezultat.hrv) linii.push(`- HRV: ${rezultat.hrv} ms`)
      if (rezultat.ore_somn) linii.push(`- Somn: ${rezultat.ore_somn}h`)
      if (rezultat.somn_profund) linii.push(`- Somn profund: ${rezultat.somn_profund}h`)
      if (rezultat.somn_rem) linii.push(`- Somn REM: ${rezultat.somn_rem}h`)
      if (rezultat.readiness) linii.push(`- Readiness: ${rezultat.readiness}/100`)
      if (rezultat.temperatura) linii.push(`- Temperatură deviație: ${rezultat.temperatura}°C`)
      if (rezultat.spo2) linii.push(`- SpO2: ${rezultat.spo2}%`)
      if (rezultat.greutate) linii.push(`- Greutate: ${rezultat.greutate} kg`)
      if (rezultat.hidratare_ml) linii.push(`- Hidratare: ${rezultat.hidratare_ml} ml`)
      if (rezultat.zile?.length > 1) {
        const n = rezultat.zile.length
        const med = Math.round(rezultat.zile.reduce((a: number, z: any) => a + (z.pasi || 0), 0) / n)
        linii.push(`- Medie pași ${n} zile: ${med.toLocaleString()}`)
      }
    }
    rezultat.text_analiza = linii.join('\n')

    return NextResponse.json({ ok: true, ...rezultat })
  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
