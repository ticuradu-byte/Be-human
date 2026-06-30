export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Coduri tip măsurătoare Withings (Measure API)
const MEAS = { GREUTATE: 1, MASA_GRASA_PCT: 6, MASA_MUSCULARA: 76, HIDRATARE: 77, DIASTOLICA: 9, SISTOLICA: 10, PULS: 11 }

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
      .from('utilizatori')
      .select('profil_complet')
      .eq('id', userId)
      .single()

    const token = user?.profil_complet?.withings_token
    if (!token?.access_token) {
      return NextResponse.json({ error: 'no_token' }, { status: 401 })
    }

    let accessToken = token.access_token

    // Refresh, apelat DOAR dacă tokenul curent eșuează — niciodată preventiv.
    // La Withings, fiecare refresh INVALIDEAZĂ tokenul vechi și emite unul nou;
    // a face refresh la fiecare request ar strica un token perfect valid.
    async function refreshToken(): Promise<string | null> {
      if (!token.refresh_token) return null
      const refreshRes = await fetch('https://wbsapi.withings.net/v2/oauth2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'requesttoken',
          grant_type: 'refresh_token',
          client_id: process.env.WITHINGS_CLIENT_ID!,
          client_secret: process.env.WITHINGS_CLIENT_SECRET!,
          refresh_token: token.refresh_token,
        }),
      })
      const refreshed = await refreshRes.json()
      console.log('[Withings data] refresh status:', refreshed.status)
      if (refreshed.status === 0 && refreshed.body?.access_token) {
        await supabase.from('utilizatori').update({
          profil_complet: { ...(user?.profil_complet || {}), withings_token: refreshed.body }
        }).eq('id', userId)
        return refreshed.body.access_token
      }
      console.log('[Withings data] refresh EȘUAT:', JSON.stringify(refreshed).slice(0, 200))
      return null
    }

    const now = Math.floor(Date.now() / 1000)
    const acum365Zile = now - 365 * 24 * 60 * 60

    async function getMeasuri(tok: string) {
      const res = await fetch('https://wbsapi.withings.net/measure', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${tok}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'getmeas',
          meastypes: Object.values(MEAS).join(','),
          category: '1',
          startdate: String(acum365Zile),
          enddate: String(now),
        }),
      })
      return res.json()
    }

    // Prima încercare — cu tokenul existent, fără refresh preventiv
    let measData = await getMeasuri(accessToken)
    console.log('[Withings data] measure status (încercare 1):', measData.status)

    if (measData.status === 401 || measData.error?.toLowerCase?.().includes('token')) {
      console.log('[Withings data] token invalid, refresh...')
      const tokenNou = await refreshToken()
      if (tokenNou) {
        accessToken = tokenNou
        measData = await getMeasuri(accessToken)
        console.log('[Withings data] measure status (încercare 2):', measData.status)
      }
    }

    if (measData.status !== 0) {
      return NextResponse.json({ error: measData.error || 'eroare_masuratori', status: measData.status }, { status: 400 })
    }

    const peZi: Record<string, any> = {}
    for (const grp of (measData.body?.measuregrps || [])) {
      const zi = new Date(grp.date * 1000).toLocaleDateString('ro-RO')
      if (!peZi[zi]) peZi[zi] = { data: zi }
      for (const m of (grp.measures || [])) {
        const valoare = m.value * Math.pow(10, m.unit)
        if (m.type === MEAS.GREUTATE) peZi[zi].greutate_kg = Math.round(valoare * 10) / 10
        if (m.type === MEAS.MASA_GRASA_PCT) peZi[zi].masa_grasa_pct = Math.round(valoare * 10) / 10
        if (m.type === MEAS.MASA_MUSCULARA) peZi[zi].masa_musculara_kg = Math.round(valoare * 10) / 10
        if (m.type === MEAS.HIDRATARE) peZi[zi].hidratare_kg = Math.round(valoare * 10) / 10
        if (m.type === MEAS.DIASTOLICA) peZi[zi].tensiune_diastolica = Math.round(valoare)
        if (m.type === MEAS.SISTOLICA) peZi[zi].tensiune_sistolica = Math.round(valoare)
        if (m.type === MEAS.PULS) peZi[zi].puls = Math.round(valoare)
      }
    }

    // Somn — Sleep API v2 getsummary (folosește tokenul curent, eventual reîmprospătat)
    const formatYMD = (ts: number) => new Date(ts * 1000).toISOString().slice(0, 10)
    const sleepRes = await fetch('https://wbsapi.withings.net/v2/sleep', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        action: 'getsummary',
        startdateymd: formatYMD(acum365Zile),
        enddateymd: formatYMD(now),
      }),
    })
    const sleepData = await sleepRes.json()
    if (sleepData.status === 0) {
      for (const rec of (sleepData.body?.series || [])) {
        const zi = new Date(rec.startdate * 1000).toLocaleDateString('ro-RO')
        if (!peZi[zi]) peZi[zi] = { data: zi }
        const d = rec.data || {}
        peZi[zi].somn_scor = d.sleep_score ?? null
        peZi[zi].somn_total_min = d.total_sleep_time ? Math.round(d.total_sleep_time / 60) : null
        peZi[zi].somn_profund_min = d.deepsleepduration ? Math.round(d.deepsleepduration / 60) : null
        peZi[zi].somn_rem_min = d.remsleepduration ? Math.round(d.remsleepduration / 60) : null
        peZi[zi].somn_treziri = d.wakeupcount ?? null
      }
    }

    const zile = Object.values(peZi).sort((a: any, b: any) =>
      new Date(a.data.split('.').reverse().join('-')).getTime() - new Date(b.data.split('.').reverse().join('-')).getTime()
    )

    const azi = zile.length > 0 ? zile[zile.length - 1] : null

    return NextResponse.json({ ok: true, zile, azi })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
