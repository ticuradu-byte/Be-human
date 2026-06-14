export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { code, userId } = await req.json()

    const params = new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_FIT_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_FIT_CLIENT_SECRET || '',
      redirect_uri: 'https://be-human-gamma.vercel.app/auth/callback/google-fit',
      grant_type: 'authorization_code',
    })

    console.log('Sending to Google, client_id exists:', !!process.env.GOOGLE_FIT_CLIENT_ID)

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    })

    const tokens = await tokenRes.json()
    console.log('Token response:', JSON.stringify(tokens))

    if (!tokens.access_token) {
      return NextResponse.json({ 
        error: 'no_token', 
        details: tokens,
        hasClientId: !!process.env.GOOGLE_FIT_CLIENT_ID,
        hasSecret: !!process.env.GOOGLE_FIT_CLIENT_SECRET
      }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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
          google_fit_token: tokens, 
          google_fit_conectat: true 
        } 
      })
      .eq('id', userId)

    return NextResponse.json({ ok: true })
  } catch(e: any) {
    console.error('Callback error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
