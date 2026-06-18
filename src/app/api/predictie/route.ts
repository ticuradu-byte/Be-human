export const dynamic = 'force-dynamic'
// src/app/api/predictie/route.ts
// Predicție îmbolnăvire 24-48h — bazat pe trend HRV, temperatură nocturnă, somn, stres
// Algoritm bazat pe markeri fiziologici documentați în literatura wearables (Oura, Whoop research)

import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

interface ZiData {
  data_zi: string
  hrv?: number
  temperatura_delta?: number
  ore_somn?: number
  calitate_somn?: number
  stres_garmin?: number
  hr_repaus?: number
  spo2_medie?: number
}

interface RezultatPredictie {
  risc_nivel: 'scazut' | 'moderat' | 'ridicat' | 'critic'
  probabilitate_24h: number
  probabilitate_48h: number
  markeri_alarma: string[]
  recomandari: string[]
  explicatie: string
  trend_hrv: 'crescator' | 'stabil' | 'descrescator'
  baseline: { hrv: number; temp: number; somn: number; hr: number }
  zi_curenta: ZiData | null
}

export async function GET(req: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Neautentificat' }, { status: 401 })

  // Ultimele 14 zile de date wearables pentru calcul baseline + trend
  const { data: zile, error } = await supabase
    .from('wearable_date_zilnice')
    .select('data_zi, date_norm')
    .eq('user_id', user.id)
    .order('data_zi', { ascending: false })
    .limit(14)

  if (error || !zile || zile.length < 3) {
    return NextResponse.json({
      error: 'Date insuficiente. Conectează wearables și ai nevoie de minim 3 zile de date.',
      necesar_zile_minim: 3,
      zile_disponibile: zile?.length || 0,
    }, { status: 200 })
  }

  // Normalizează datele din toate sursele (Oura/Garmin/HealthConnect)
  const zileNorm: ZiData[] = zile.map((z: any) => {
    const d = z.date_norm || {}
    return {
      data_zi: z.data_zi,
      hrv: d.hrv_mediu_noapte || d.hrv_last_night || d.hrv,
      temperatura_delta: d.temperatura_delta ?? d.temp_deviation,
      ore_somn: d.ore_somn,
      calitate_somn: d.calitate_somn,
      stres_garmin: d.stress_mediu || d.stres_garmin,
      hr_repaus: d.hr_repaus || d.hr_minim,
      spo2_medie: d.spo2_medie,
    }
  })

  const ziCurenta = zileNorm[0]
  const istoricBaseline = zileNorm.slice(1, 14) // restul zilelor pentru baseline

  // ── CALCUL BASELINE (media ultimelor 13 zile, excluzând azi) ───────────────
  const medie = (arr: (number | undefined)[]): number => {
    const valori = arr.filter((v): v is number => typeof v === 'number' && !isNaN(v))
    return valori.length > 0 ? valori.reduce((s, v) => s + v, 0) / valori.length : 0
  }

  const baseline = {
    hrv:  medie(istoricBaseline.map(z => z.hrv)),
    temp: medie(istoricBaseline.map(z => z.temperatura_delta)),
    somn: medie(istoricBaseline.map(z => z.ore_somn)),
    hr:   medie(istoricBaseline.map(z => z.hr_repaus)),
  }

  // ── TREND HRV — ultimele 3 zile vs baseline ─────────────────────────────────
  const hrvUltimele3 = medie(zileNorm.slice(0, 3).map(z => z.hrv))
  let trendHrv: 'crescator' | 'stabil' | 'descrescator' = 'stabil'
  if (baseline.hrv > 0) {
    const diferentaPct = ((hrvUltimele3 - baseline.hrv) / baseline.hrv) * 100
    if (diferentaPct < -10) trendHrv = 'descrescator'
    else if (diferentaPct > 10) trendHrv = 'crescator'
  }

  // ── DETECTARE MARKERI DE ALARMĂ ──────────────────────────────────────────────
  const markeri: string[] = []
  let scorRisc = 0 // 0-100

  // 1. HRV scăzut semnificativ față de baseline (cel mai puternic predictor)
  if (baseline.hrv > 0 && ziCurenta.hrv) {
    const scaderePct = ((baseline.hrv - ziCurenta.hrv) / baseline.hrv) * 100
    if (scaderePct > 25) {
      markeri.push(`HRV scăzut cu ${Math.round(scaderePct)}% față de media ta (${ziCurenta.hrv}ms vs ${Math.round(baseline.hrv)}ms)`)
      scorRisc += 35
    } else if (scaderePct > 15) {
      markeri.push(`HRV ușor scăzut (${Math.round(scaderePct)}% sub medie)`)
      scorRisc += 18
    }
  }

  // 2. Temperatura corporală nocturnă crescută (semnal precoce infecție/inflamație)
  if (ziCurenta.temperatura_delta !== undefined && ziCurenta.temperatura_delta > 0.3) {
    markeri.push(`Temperatură nocturnă +${ziCurenta.temperatura_delta.toFixed(1)}°C peste normal`)
    scorRisc += ziCurenta.temperatura_delta > 0.6 ? 30 : 20
  }

  // 3. Frecvență cardiacă de repaus crescută
  if (baseline.hr > 0 && ziCurenta.hr_repaus) {
    const cresterePct = ((ziCurenta.hr_repaus - baseline.hr) / baseline.hr) * 100
    if (cresterePct > 12) {
      markeri.push(`HR repaus crescut cu ${Math.round(cresterePct)}% (${ziCurenta.hr_repaus} vs ${Math.round(baseline.hr)} bpm)`)
      scorRisc += 20
    }
  }

  // 4. Somn insuficient sau calitate slabă consecutiv
  const somnUltimele3 = zileNorm.slice(0, 3).map(z => z.ore_somn).filter((v): v is number => !!v)
  if (somnUltimele3.length >= 2 && somnUltimele3.every(s => s < 6)) {
    markeri.push('Somn sub 6h, 2+ nopți consecutive')
    scorRisc += 15
  }

  // 5. SpO2 scăzut
  if (ziCurenta.spo2_medie && ziCurenta.spo2_medie < 95) {
    markeri.push(`SpO2 scăzut: ${ziCurenta.spo2_medie}%`)
    scorRisc += 25
  }

  // 6. Stres crescut sever
  if (ziCurenta.stres_garmin && ziCurenta.stres_garmin > 70) {
    markeri.push(`Nivel de stres foarte ridicat: ${ziCurenta.stres_garmin}/100`)
    scorRisc += 10
  }

  // 7. Trend HRV descrescător susținut (3+ zile)
  if (trendHrv === 'descrescator') {
    scorRisc += 10
  }

  scorRisc = Math.min(100, scorRisc)

  // ── CLASIFICARE RISC ──────────────────────────────────────────────────────
  let riscNivel: RezultatPredictie['risc_nivel'] = 'scazut'
  if (scorRisc >= 70) riscNivel = 'critic'
  else if (scorRisc >= 45) riscNivel = 'ridicat'
  else if (scorRisc >= 20) riscNivel = 'moderat'

  const probabilitate24h = Math.min(95, Math.round(scorRisc * 0.9))
  const probabilitate48h = Math.min(98, Math.round(scorRisc * 1.15))

  // ── RECOMANDĂRI BAZATE PE NIVEL RISC ──────────────────────────────────────
  const recomandari: string[] = []
  if (riscNivel === 'critic') {
    recomandari.push('Anulează antrenamentele intense azi și mâine')
    recomandari.push('Hidratare crescută: 3L+ apă cu electroliți')
    recomandari.push('Somn minim 8-9h azi — culcare cu 1h mai devreme')
    recomandari.push('Monitorizează temperatura corporală la 12h')
    recomandari.push('Dacă apar simptome (febră, durere gât, oboseală extremă) — odihnă completă')
  } else if (riscNivel === 'ridicat') {
    recomandari.push('Redu intensitatea sportului la Z2 (cardio ușor) sau zi de pauză')
    recomandari.push('Vitamina C 1000mg + Zinc 30mg preventiv')
    recomandari.push('Prioritizează somnul — minim 8h azi')
    recomandari.push('Evită expunerea la persoane bolnave dacă posibil')
  } else if (riscNivel === 'moderat') {
    recomandari.push('Ascultă-ți corpul — antrenament normal dar fără PR-uri')
    recomandari.push('Hidratare și somn de calitate prioritare')
    recomandari.push('Monitorizează cum te simți în următoarele 24h')
  } else {
    recomandari.push('Toți markerii sunt în limite normale')
    recomandari.push('Continuă rutina obișnuită de sport și recuperare')
  }

  const explicatie = markeri.length > 0
    ? `Am detectat ${markeri.length} semnal(e) de alarmă fiziologică. Corpul tău arată semne incipiente de stres sistemic care precede de obicei îmbolnăvirea cu 24-48h.`
    : 'Toți indicatorii (HRV, temperatură, somn, HR repaus) sunt în limitele normale comparativ cu baseline-ul tău personal.'

  const rezultat: RezultatPredictie = {
    risc_nivel: riscNivel,
    probabilitate_24h: probabilitate24h,
    probabilitate_48h: probabilitate48h,
    markeri_alarma: markeri,
    recomandari,
    explicatie,
    trend_hrv: trendHrv,
    baseline: {
      hrv: Math.round(baseline.hrv),
      temp: Math.round(baseline.temp * 10) / 10,
      somn: Math.round(baseline.somn * 10) / 10,
      hr: Math.round(baseline.hr),
    },
    zi_curenta: ziCurenta,
  }

  return NextResponse.json(rezultat)
}
