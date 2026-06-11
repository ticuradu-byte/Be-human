'use client'
// src/app/dashboard/cont/page.tsx
import { useEffect, useState } from 'react'
import { createBrowserClient, PLANURI, type Plan } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

const PLANURI_AFISATE: Plan[] = ['free', 'plus', 'pro', 'familie']

export default function ContPage() {
  const supabase = createBrowserClient()
  const router   = useRouter()
  const params   = useSearchParams()

  const [util, setUtil]       = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [upLoading, setUpLoading] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [numeEdit, setNumeEdit] = useState('')
  const [mesaj, setMesaj]   = useState('')
  const [eroare, setEroare] = useState('')

  // Redirect de la Stripe
  useEffect(() => {
    if (params.get('upgrade') === 'success') {
      setMesaj(`🎉 Felicitări! Planul ${params.get('plan')?.toUpperCase()} activat. Trial 14 zile gratuit!`)
      window.history.replaceState({}, '', '/dashboard/cont')
    }
    if (params.get('upgrade') === 'cancelled') {
      setEroare('Upgrade anulat. Poți încerca oricând.')
      window.history.replaceState({}, '', '/dashboard/cont')
    }
  }, [params])

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('utilizatori').select('*').eq('id', user.id).single()
      if (data) { setUtil(data); setNumeEdit(data.nume || '') }
      setLoading(false)
    }
    load()
  }, [])

  const saveNume = async () => {
    setSaving(true)
    await supabase.from('utilizatori').update({ nume: numeEdit }).eq('id', util.id)
    setMesaj('Salvat!'); setSaving(false)
    setTimeout(() => setMesaj(''), 2000)
  }

  const handleUpgrade = async (plan: string) => {
    setUpLoading(plan); setEroare('')
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else { setEroare(data.error || 'Eroare'); setUpLoading(null) }
  }

  const handlePortal = async () => {
    setPortalLoading(true)
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else { setEroare(data.error || 'Eroare'); setPortalLoading(false) }
  }

  const logout = async () => { await supabase.auth.signOut(); router.push('/') }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-3xl animate-pulse">🫀</div></div>

  const planCurent = PLANURI[(util?.plan || "free") as keyof typeof PLANURI]
  const ePlatit    = ['plus', 'pro', 'familie'].includes(util?.plan)
  const trialActiv = util?.trial_ends_at && new Date(util.trial_ends_at) > new Date()
  const trialZile  = trialActiv ? Math.ceil((new Date(util.trial_ends_at).getTime() - Date.now()) / 86400000) : 0

  return (
    <div className="fade-in space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-white mb-1">Contul meu</h1>
        <p className="text-white/40 text-sm">Profil, abonament și facturare</p>
      </div>

      {mesaj && <div className="bg-green-500/10 border border-green-500/25 rounded-xl px-5 py-4 text-green-400 text-sm">{mesaj}</div>}
      {eroare && <div className="bg-red-500/10 border border-red-500/25 rounded-xl px-5 py-4 text-red-400 text-sm">⚠️ {eroare}</div>}

      {trialActiv && (
        <div className="bg-green-500/8 border border-green-500/25 rounded-xl px-5 py-4 flex items-center gap-3">
          <span className="text-2xl">⏳</span>
          <div>
            <div className="font-semibold text-green-400 text-sm">Trial {util?.plan?.toUpperCase()} activ — {trialZile} zile rămase</div>
            <div className="text-white/35 text-xs mt-0.5">Poți anula oricând fără costuri</div>
          </div>
        </div>
      )}

      {/* Profil */}
      <div className="card p-6 space-y-5">
        <h2 className="text-xs font-bold text-white/40 uppercase tracking-wider">Profil</h2>
        <div className="flex items-center gap-4">
          {util?.avatar_url
            ? <img src={util.avatar_url} className="w-14 h-14 rounded-2xl border border-white/10 flex-shrink-0" alt="" />
            : <div className="w-14 h-14 rounded-2xl bg-green-500/20 border border-green-500/30 flex items-center justify-center text-2xl font-bold text-green-400 flex-shrink-0">
                {(util?.nume || util?.email || 'U')[0].toUpperCase()}
              </div>
          }
          <div className="min-w-0">
            <div className="text-white/80 font-medium truncate">{util?.nume || '—'}</div>
            <div className="text-white/40 text-sm truncate">{util?.email}</div>
          </div>
        </div>
        <div>
          <label className="text-white/40 text-xs uppercase tracking-wider mb-2 block">Prenume</label>
          <div className="flex gap-3">
            <input value={numeEdit} onChange={e => setNumeEdit(e.target.value)} className="input text-sm flex-1" placeholder="Prenumele tău" />
            <button onClick={saveNume} disabled={saving || numeEdit === util?.nume}
              className="btn-green py-2.5 px-5 text-sm">
              {saving ? '...' : 'Salvează'}
            </button>
          </div>
        </div>
      </div>

      {/* Abonament */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <h2 className="text-xs font-bold text-white/40 uppercase tracking-wider">Abonament</h2>
          <div className="flex items-center gap-2">
            <span className={`badge-plan-${util?.plan || 'free'}`}>{planCurent.label}</span>
            {ePlatit && util?.plan_expires_at && (
              <span className="text-xs text-white/25">
                Reînnoire {new Date(util.plan_expires_at).toLocaleDateString('ro-RO')}
              </span>
            )}
          </div>
        </div>

        {/* Management abonament existent */}
        {ePlatit && (
          <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl mb-5">
            <div>
              <div className="text-sm font-medium text-white/75">Analize nelimitate · Toate funcțiile</div>
              <div className="text-xs text-white/30 mt-0.5">Gestionează card, facturi, anulare</div>
            </div>
            <button onClick={handlePortal} disabled={portalLoading} className="btn-ghost text-sm py-2 px-4">
              {portalLoading ? '⏳...' : '⚙️ Gestionează'}
            </button>
          </div>
        )}

        {/* Planuri upgrade */}
        {!ePlatit && (
          <div className="space-y-3">
            <div className="text-xs text-white/25 uppercase tracking-wider">Upgrade pentru mai mult</div>
            {PLANURI_AFISATE.filter(p => p !== 'free').map(planKey => {
              const p = PLANURI[planKey]
              return (
                <div key={planKey} className={`rounded-2xl p-5 border transition-all ${
                  planKey === 'pro'
                    ? 'bg-green-500/[0.05] border-green-500/25'
                    : 'bg-white/[0.02] border-white/[0.08]'
                }`}>
                  <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white">{p.label}</span>
                        {planKey === 'pro' && (
                          <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full">Popular</span>
                        )}
                        <span className="text-xs text-green-400/60">14 zile gratuit</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="font-fraunces text-2xl font-bold text-green-400">
                          {p.pret_lunar}€
                        </span>
                        <span className="text-white/30 text-sm">/lună</span>
                      </div>
                    </div>
                    <button onClick={() => handleUpgrade(planKey)} disabled={!!upLoading}
                      className={`text-sm py-2.5 px-5 rounded-xl font-semibold transition-all ${
                        planKey === 'pro' ? 'btn-green' : 'btn-ghost'
                      } disabled:opacity-50`}>
                      {upLoading === planKey ? '⏳...' : `Alege ${p.label}`}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {p.features.map((f, i) => (
                      <div key={i} className="text-xs text-white/45 flex items-center gap-1.5">
                        <span className="text-green-400 flex-shrink-0">✓</span> {f}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
            <div className="text-center text-xs text-white/20">
              🛡️ Garanție returnare 14 zile · Anulezi oricând · Fără comisioane ascunse
            </div>
          </div>
        )}
      </div>

      {/* Facturi */}
      {ePlatit && (
        <div className="card p-5">
          <h2 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Facturare</h2>
          <button onClick={handlePortal} disabled={portalLoading}
            className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.02] border border-white/[0.07] rounded-xl hover:bg-white/[0.04] transition-all text-sm text-white/55 hover:text-white">
            <span>📄 Descarcă facturi și schimbă metoda de plată</span>
            <span>→</span>
          </button>
        </div>
      )}

      {/* Deconectare + ștergere */}
      <div className="card p-5 space-y-3">
        <h2 className="text-xs font-bold text-white/40 uppercase tracking-wider">Cont</h2>
        <button onClick={logout}
          className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.02] border border-white/[0.07] rounded-xl hover:bg-white/[0.04] transition-all text-sm text-white/55 hover:text-white">
          <span>Deconectare</span><span>⏏</span>
        </button>
        <div className="border-t border-white/5 pt-3">
          <div className="text-xs text-white/20 mb-2">Zonă periculoasă</div>
          <button onClick={async () => {
            if (!confirm('Ștergi contul? Toate datele vor fi șterse permanent.')) return
            if (!confirm('Confirmare finală — ireversibil!')) return
            await supabase.from('utilizatori').delete().eq('id', util.id)
            await supabase.auth.signOut()
            router.push('/')
          }} className="w-full flex items-center justify-between px-4 py-3 bg-red-500/5 border border-red-500/15 rounded-xl hover:bg-red-500/10 transition-all text-sm text-red-400">
            <span>Șterge contul permanent</span><span>🗑</span>
          </button>
        </div>
      </div>

      <div className="text-xs text-white/15 leading-relaxed">
        🔒 Date stocate în UE (Supabase Frankfurt) · Conform GDPR · contact@be-human.ro
      </div>
    </div>
  )
}
