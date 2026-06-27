export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { code, userId } = await req.json()

    const tokenRes = await fetch('https://wbsapi.withings.net/v2/oauth2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        action: 'requesttoken',
        grant_type: 'authorization_code',
        client_id: process.env.WITHINGS_CLIENT_ID!,
        client_secret: process.env.WITHINGS_CLIENT_SECRET!,
        code,
        redirect_uri: 'https://be-human-gamma.vercel.app/auth/callback/withings',
      }),
    })

    const tokenData = await tokenRes.json()
    // Withings răspunde mereu cu status:0 pentru succes, restul e în .body
    if (tokenData.status !== 0 || !tokenData.body?.access_token) {
      return NextResponse.json({ error: 'no_token', details: tokenData }, { status: 400 })
    }

    const tokens = tokenData.body // { access_token, refresh_token, userid, expires_in, scope }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: user } = await supabase
      .from('utilizatori')
      .select('profil_complet')
      .eq('id', userId)
      .single()

    await supabase
      .from('utilizatori')
      .update({
        profil_complet: {
          ...(user?.profil_complet || {}),
          withings_token: tokens,
          withings_conectat: true,
          withings_data: new Date().toISOString(),
        }
      })
      .eq('id', userId)

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
