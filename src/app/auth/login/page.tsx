'use client'
// src/app/auth/login/page.tsx
import { Suspense, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginContent() {
  const supabase = createBrowserClient()
  const router = useRouter()
  const params = useSearchParams()
  const redirect = params.get('redirect') || '/dashboard'

  const [email, setEmail]   = useState('')
  const [parola, setParola] = useState('')
  const [loading, setLoading] = useState(false)
  const [eroare, setEroare]   = useState('')
  const [mesaj, setMesaj]     = useState('')

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setEroare('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: parola })
    if (error) setEroare('Email sau parolă incorectă')
    else { router.push(redirect); router.refresh() }
    setLoading(false)
  }

  const handleGoogle = async () => {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}` },
    })
    setLoading(false)
  }

  const handleForgot = async () => {
    if (!email) { setEroare('Introdu emailul mai întâi'); return }
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    setMesaj('Link de resetare trimis!')
  }

  return (
    <div className="min-h-screen bg-[#070d09] flex items-center justify-center px-4">
      <div className="w-full max-w-md fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-green-700 to-green-400 rounded-2xl flex items-center justify-center text-2xl shadow-[0_4px_24px_rgba(34,197,94,0.3)]">🫀</div>
            <div className="text-left">
              <div className="font-fraunces text-3xl font-black text-green-gradient leading-none">be-human</div>
              <div className="text-[10px] text-white/30 uppercase tracking-[2px]">Wellness AI Personal</div>
            </div>
          </Link>
          <h1 className="text-2xl font-semibold text-white mb-2">Bine ai revenit</h1>
          <p className="text-white/40 text-sm">Intră în contul tău be-human</p>
        </div>

        <div className="card p-8">
          {/* Google */}
          <button onClick={handleGoogle} disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 rounded-xl py-3 text-sm font-medium text-white/80 hover:bg-white/8 hover:text-white transition-all mb-6 disabled:opacity-50">
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.01c-.72.48-1.63.73-2.7.73-2.08 0-3.84-1.4-4.47-3.29H1.88v2.07A8 8 0 0 0 8.98 17z"/>
              <path fill="#FBBC05" d="M4.51 10.49A4.8 4.8 0 0 1 4.26 9c0-.52.09-1.02.25-1.49V5.44H1.88A8 8 0 0 0 .98 9c0 1.29.31 2.51.9 3.56l2.63-2.07z"/>
              <path fill="#EA4335" d="M8.98 5.22c1.17 0 2.22.4 3.05 1.2l2.28-2.29A8 8 0 0 0 8.98 1a8 8 0 0 0-7.1 4.44l2.63 2.05c.63-1.89 2.39-3.27 4.47-3.27z"/>
            </svg>
            Continuă cu Google
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/25 text-xs">sau cu email</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={handleEmail} className="space-y-4">
            <div>
              <label className="text-white/50 text-xs uppercase tracking-wider mb-2 block">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="input" placeholder="email@exemplu.ro" required />
            </div>
            <div>
              <label className="text-white/50 text-xs uppercase tracking-wider mb-2 block">Parolă</label>
              <input type="password" value={parola} onChange={e => setParola(e.target.value)}
                className="input" placeholder="••••••••" required />
              <button type="button" onClick={handleForgot}
                className="text-green-500/60 text-xs hover:text-green-400 transition-colors mt-1.5 block">
                Am uitat parola
              </button>
            </div>

            {eroare && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">⚠️ {eroare}</div>}
            {mesaj  && <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-green-400 text-sm">✓ {mesaj}</div>}

            <button type="submit" disabled={loading || !email || !parola}
              className="btn-green w-full py-3 text-base mt-2">
              {loading ? '⏳ Se conectează...' : '→ Intră în cont'}
            </button>
          </form>

          <p className="text-center text-white/30 text-sm mt-6">
            Nu ai cont?{' '}
            <Link href="/auth/register" className="text-green-400 hover:text-green-300 transition-colors font-medium">
              Creează gratuit
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a]" />}>
      <LoginContent />
    </Suspense>
  )
}
