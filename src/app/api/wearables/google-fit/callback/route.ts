export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { code, userId } = await req.json()
    
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_FIT_CLIENT_ID!,
        client_secret: process.env.GOOGLE_FIT_CLIENT_SECRET!,
        redirect_uri: process.env.NEXT_PUBLIC_APP_URL + '/auth/callback/google-fit',
        grant_type: 'authorization_code',
      }),
    })
    
    const tokens = await tokenRes.json()
    if (!tokens.access_token) return NextResponse.json({ error: 'no_token' }, { status: 400 })
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    await supabase.from('utilizatori').update({
      profil_complet: { google_fit_token: tokens }
    }).eq('id', userId)
    
    return NextResponse.json({ ok: true })
  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
