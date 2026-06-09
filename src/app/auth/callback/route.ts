// src/app/auth/callback/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const url     = new URL(req.url)
  const code    = url.searchParams.get('code')
  const redirect = url.searchParams.get('redirect') || '/dashboard'

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.exchangeCodeForSession(code)

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      // Creează profilul dacă nu există
      await supabase.from('utilizatori').upsert({
        id:            user.id,
        email:         user.email!,
        nume:          user.user_metadata?.full_name || user.user_metadata?.name,
        avatar_url:    user.user_metadata?.avatar_url,
        plan:          'free',
        luna_curenta:  new Date().toISOString().slice(0, 7),
      }, { onConflict: 'id', ignoreDuplicates: true })
    }
  }

  return NextResponse.redirect(new URL(redirect, url.origin))
}
