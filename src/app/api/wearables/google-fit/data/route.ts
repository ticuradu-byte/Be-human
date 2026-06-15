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
      .from('utilizatori')
      .select('profil_complet')
      .eq('id', userId)
      .single()

    const token = user?.profil_complet?.google_fit_token
    if (!token?.access_token) {
      return NextResponse.json({ error: 'no_token' }, { status: 401 })
    }

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
      if (refreshed.access_token) {
        accessToken = refreshed.access_token
        await supabase.from('utilizatori').update({
          profil_complet: { ...user.profil_complet, google_fit_token: { ...token, access_token: refreshed.access_token } }
        }).eq('id', userId)
      }
    }

    const now = Date.now()
    const acum7Zile = now - 30 * 24 * 60 * 60 * 1000

    const fitRes = await fetch(
      'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate',
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aggregateBy: [
            { dataTypeName: 'com.google.step_count.delta' },
            { dataTypeName: 'com.google.calories.expended' },
            { dataTypeName: 'com.google.heart_rate.bpm' },
            { dataTypeName: 'com.google.active_minutes' },
          ],
          bucketByTime: { durationMillis: 86400000 },
          startTimeMillis: acum7Zile,
          endTimeMillis: now,
        }),
      }
    )

    const fitData = await fitRes.json()
    if (fitData.error) return NextResponse.json({ error: fitData.error.message }, { status: 400 })

    const rezultate: any[] = []
    for (const bucket of (fitData.bucket || [])) {
      const zi: any = { 
        data: new Date(parseInt(bucket.startTimeMillis)).toLocaleDateString('ro-RO'), 
        pasi: 0, calorii: 0, hr_medie: 0, minute_active: 0 
      }
      for (const ds of (bucket.dataset || [])) {
        for (const point of (ds.point || [])) {
          const vals = point.value || []
          if (ds.dataSourceId?.includes('step_count')) zi.pasi += vals[0]?.intVal || 0
          if (ds.dataSourceId?.includes('calories')) zi.calorii += Math.round(vals[0]?.fpVal || 0)
          if (ds.dataSourceId?.includes('heart_rate')) zi.hr_medie = Math.round(vals[0]?.fpVal || 0)
          if (ds.dataSourceId?.includes('active_minutes')) zi.minute_active += vals[0]?.intVal || 0
        }
      }
      if (zi.pasi > 0 || zi.calorii > 0) rezultate.push(zi)
    }

    return NextResponse.json({ ok: true, zile: rezultate, azi: rezultate[rezultate.length - 1] || null })
  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
