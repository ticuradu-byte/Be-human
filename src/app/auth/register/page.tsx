'use client'
// src/app/auth/register/page.tsx
import { useState } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import Link from 'next/link'

export default function RegisterPage() {
  const supabase = createBrowserClient()
  const [email, setEmail]   = useState('')
  const [parola, setParola] = useState('')
  const [nume, setNume]     = useState('')
  const [loading, setLoading] = useState(false)
  const [eroare, setEroare]   = useState('')
  const [succes, setSucces]   = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (parola.length < 8) { setEroare('Parola trebuie să aibă minim 8 caractere'); return }
    setLoading(true); setEroare('')
    const { error } = await supabase.auth.signUp({
      email, password: parola,
      options: {
        data: { full_name: nume },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) setEroare(error.message.includes('already') ? 'Email deja înregistrat.' : 'Eroare la înregistrare.')
    else setSucces(true)
    setLoading(false)
  }

  const handleGoogle = async () => {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    setLoading(false)
  }

  if (succes) return (
    <div className="min-h-screen bg-[#13161a] flex items-center justify-center px-4">
      <div className="card p-10 max-w-md w-full text-center fade-in">
        <div className="text-5xl mb-6">📬</div>
        <h2 className="text-2xl font-semibold text-white mb-3">Verifică emailul</h2>
        <p className="text-white/50 text-sm leading-relaxed mb-6">
          Am trimis un link de confirmare la <strong className="text-white/80">{email}</strong>.
        </p>
        <Link href="/auth/login" className="btn-ghost text-sm px-6 py-2.5">← Înapoi la login</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#13161a] flex items-center justify-center px-4">
      <div className="w-full max-w-md fade-in">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-green-700 to-green-400 rounded-2xl flex items-center justify-center text-2xl shadow-[0_4px_24px_rgba(34,197,94,0.3)]">🫀</div>
            <div className="text-left">
              <div className="font-fraunces text-3xl font-black text-green-gradient leading-none">be-human</div>
              <div className="text-[10px] text-white/30 uppercase tracking-[2px]">Wellness AI Personal</div>
            </div>
          </Link>
          <h1 className="text-2xl font-semibold text-white mb-2">Creează cont gratuit</h1>
          <p className="text-white/40 text-sm">2 analize gratuite pe lună · Fără card</p>
        </div>

        <div className="card p-8">
          <button onClick={handleGoogle} disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 rounded-xl py-3 text-sm font-medium text-white/80 hover:bg-white/8 hover:text-white transition-all mb-6">
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.01c-.72.48-1.63.73-2.7.73-2.08 0-3.84-1.4-4.47-3.29H1.88v2.07A8 8 0 0 0 8.98 17z"/>
              <path fill="#FBBC05" d="M4.51 10.49A4.8 4.8 0 0 1 4.26 9c0-.52.09-1.02.25-1.49V5.44H1.88A8 8 0 0 0 .98 9c0 1.29.31 2.51.9 3.56l2.63-2.07z"/>
              <path fill="#EA4335" d="M8.98 5.22c1.17 0 2.22.4 3.05 1.2l2.28-2.29A8 8 0 0 0 8.98 1a8 8 0 0 0-7.1 4.44l2.63 2.05c.63-1.89 2.39-3.27 4.47-3.27z"/>
            </svg>
            Înregistrare cu Google
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/25 text-xs">sau cu email</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="text-white/50 text-xs uppercase tracking-wider mb-2 block">Prenume</label>
              <input type="text" value={nume} onChange={e => setNume(e.target.value)} className="input" placeholder="Prenumele tău" required />
            </div>
            <div>
              <label className="text-white/50 text-xs uppercase tracking-wider mb-2 block">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input" placeholder="email@exemplu.ro" required />
            </div>
            <div>
              <label className="text-white/50 text-xs uppercase tracking-wider mb-2 block">Parolă</label>
              <input type="password" value={parola} onChange={e => setParola(e.target.value)} className="input" placeholder="Minim 8 caractere" minLength={8} required />
            </div>

            {eroare && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">⚠️ {eroare}</div>}

            <button type="submit" disabled={loading || !email || !parola || !nume}
              className="btn-green w-full py-3 text-base mt-2">
              {loading ? '⏳ Se creează...' : '🫀 Creează cont gratuit'}
            </button>
          </form>

          <p className="text-center text-white/30 text-sm mt-6">
            Ai deja cont?{' '}
            <Link href="/auth/login" className="text-green-400 hover:text-green-300 font-medium">Intră în cont</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
