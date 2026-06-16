export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

async function getGoogleFitData(userId: string, supabase: any) {
  const { data: user } = await supabase
    .from('utilizatori').select('profil_complet').eq('id', userId).single()
  
  const token = user?.profil_complet?.google_fit_token
  console.log('User found:', !!user, 'token exists:', !!token, 'access_token:', !!token?.access_token)
  if (!token?.access_token) return null

  let accessToken = token.access_token
  if (token.refresh_token) {
    const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: token.refresh_token,
        client_id: process.env.GOOGLE_FIT_CLIENT_ID!,
        client_secret: process.env.GOOGLE_FIT_CLIENT_SECRET!,
        grant_type: 'refresh_token',
      }),
    })
    const refreshed = await refreshRes.json()
    if (refreshed.access_token) accessToken = refreshed.access_token
  }

  const now = Date.now()
  const acum30Zile = now - 30 * 24 * 60 * 60 * 1000

  const fitRes = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      aggregateBy: [
        { dataTypeName: 'com.google.step_count.delta' },
        { dataTypeName: 'com.google.calories.expended' },
        { dataTypeName: 'com.google.heart_rate.bpm' },
        { dataTypeName: 'com.google.active_minutes' },
        { dataTypeName: 'com.google.weight' },
        { dataTypeName: 'com.google.sleep.segment' },
        { dataTypeName: 'com.google.hydration' },
      ],
      bucketByTime: { durationMillis: 86400000 },
      startTimeMillis: acum30Zile,
      endTimeMillis: now,
    }),
  })

  const fitData = await fitRes.json()
  if (fitData.error) return null

  const rezultate: any[] = []
  for (const bucket of (fitData.bucket || [])) {
    const zi: any = { data: new Date(parseInt(bucket.startTimeMillis)).toLocaleDateString('ro-RO'), pasi: 0, calorii: 0, hr_medie: 0, minute_active: 0, greutate: 0, ore_somn: 0, hidratare_ml: 0 }
    for (const ds of (bucket.dataset || [])) {
      for (const point of (ds.point || [])) {
        const vals = point.value || []
        const srcId = ds.dataSourceId || ''
        if (srcId.includes('step_count')) zi.pasi += vals[0]?.intVal || 0
        if (srcId.includes('calories.expended')) zi.calorii += Math.round(vals[0]?.fpVal || 0)
        if (srcId.includes('heart_rate')) zi.hr_medie = Math.round(vals[0]?.fpVal || 0)
        if (srcId.includes('active_minutes')) zi.minute_active += vals[0]?.intVal || 0
        if (srcId.includes('weight') && (vals[0]?.fpVal || 0) > 0) zi.greutate = Math.round(vals[0].fpVal * 10) / 10
        if (srcId.includes('hydration')) zi.hidratare_ml += Math.round((vals[0]?.fpVal || 0) * 1000)
        if (srcId.includes('sleep')) {
          const sleepType = vals[0]?.intVal || 0
          if (sleepType === 2 || sleepType === 72) {
            const dur = (parseInt(point.endTimeNanos) - parseInt(point.startTimeNanos)) / 1e9 / 3600
            zi.ore_somn += Math.round(dur * 10) / 10
          }
        }
      }
    }
    if (zi.pasi > 0 || zi.calorii > 0 || zi.ore_somn > 0) rezultate.push(zi)
  }

  const azi = rezultate[rezultate.length - 1] || null
  const hrAzi = azi?.hr_medie || rezultate.slice().reverse().find((z: any) => z.hr_medie > 0)?.hr_medie || 0
  return { zile: rezultate, azi: { ...azi, hr_medie: hrAzi } }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('user_id')
    if (!userId) return NextResponse.json({ error: 'no_user_id' }, { status: 400 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const rezultat: any = {
      surse_active: [], pasi: null, calorii: null, hr_medie: null,
      hrv: null, ore_somn: null, somn_profund: null, somn_rem: null,
      spo2: null, temperatura: null, readiness: null,
      greutate: null, hidratare_ml: null, minute_active: null,
      zile: [], azi: null,
    }

    // Google Fit direct
    try {
      const gfit = await getGoogleFitData(userId, supabase)
      if (gfit?.azi) {
        rezultat.surse_active.push('Google Fit')
        rezultat.pasi = gfit.azi.pasi || null
        rezultat.calorii = gfit.azi.calorii || null
        rezultat.minute_active = gfit.azi.minute_active || null
        rezultat.greutate = gfit.azi.greutate || null
        rezultat.ore_somn = gfit.azi.ore_somn || null
        rezultat.hidratare_ml = gfit.azi.hidratare_ml || null
        rezultat.hr_medie = gfit.azi.hr_medie || null
        rezultat.zile = gfit.zile || []
        rezultat.azi = gfit.azi
      }
    } catch(e) { console.log('GFit error:', e) }

    // Text pentru analiză
    const linii: string[] = []
    if (rezultat.surse_active.length > 0) {
      linii.push(`Date wearables (${rezultat.surse_active.join(' + ')}):`)
      if (rezultat.pasi) linii.push(`- Pași ieri: ${rezultat.pasi.toLocaleString()}`)
      if (rezultat.calorii) linii.push(`- Calorii: ${rezultat.calorii} kcal`)
      if (rezultat.hr_medie) linii.push(`- HR medie: ${rezultat.hr_medie} bpm`)
      if (rezultat.minute_active) linii.push(`- Minute active: ${rezultat.minute_active} min`)
      if (rezultat.ore_somn) linii.push(`- Somn: ${rezultat.ore_somn}h`)
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
