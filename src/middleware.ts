// src/middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED = ['/dashboard']
const AUTH_ONLY  = ['/auth/login', '/auth/register']

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()
  const path = req.nextUrl.pathname

  if (PROTECTED.some(p => path.startsWith(p)) && !session) {
    const url = new URL('/auth/login', req.url)
    url.searchParams.set('redirect', path)
    return NextResponse.redirect(url)
  }

  if (AUTH_ONLY.some(p => path.startsWith(p)) && session) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/stripe/webhook).*)'],
}
