'use client'
// src/app/dashboard/page.tsx
import { useEffect, useState } from 'react'
import { createBrowserClient, PLANURI } from '@/lib/supabase'
import Link from 'next/link'

function scorColor(s: number) { return s >= 75 ? '#4ade80' : s >= 55 ? '#facc15' : '#f87171' }
function scorLabel(s: number) { return s >= 85 ? 'Zi de top' : s >= 70 ? 'Excelent' : s >= 55 ? 'Bun' : s >= 40 ? 'Ok' : 'Slab' }

export default function DashboardPage() {
  const supabase = createBrowserClient()
  const [util, setUtil] = useState<any>(null)
  const [jurnal, setJurnal] = useState<any[]>([])
  const [analize, setAnalize] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [wearableData, setWearableData] = useState<any>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: u }, { data: j }, { data: a }] = await Promise.all([
        supabase.from('utilizatori').select('*').eq('id', user.id).single(),
        supabase.from('jurnal_zilnic').select('*').eq('user_id', user.id)
          .order('data_zi', { ascending: false }).limit(14),
        supabase.from('analize_bh').select('*').eq('user_id', user.id)
          .order('creat_la', { ascending: false }).limit(5),
      ])
      if (u) setUtil(u)
      if (j) setJurnal(j)
      if (a) setAnalize(a)
      
      // Load wearables data
      if (u?.profil_complet?.google_fit_conectat) {
        try {
          const gfitRes = await fetch(`/api/wearables/google-fit/data?user_id=${user.id}`)
          const gfitData = await gfitRes.json()
          if (gfitData.ok) {
            const zile = gfitData.zile || []
            const hrZi = gfitData.azi?.hr_medie || zile.slice().reverse().find((z: any) => z.hr_medie > 0)?.hr_medie || 0
            setWearableData({
              sursa: 'Google Fit',
              pasi: gfitData.azi?.pasi || 0,
              calorii: gfitData.azi?.calorii || 0,
              hr_medie: hrZi,
              minute_active: gfitData.azi?.minute_active || 0,
              zile: zile,
            })
          }
        } catch(e) { console.log('GFit dashboard error:', e) }
      }
      
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-3xl animate-pulse">🫀</div>
    </div>
  )

  const planInfo = PLANURI[(util?.plan || "free") as keyof typeof PLANURI]
  const scorAzi = jurnal[0]?.scor_wellness as number | undefined
  const scorIeri = jurnal[1]?.scor_wellness as number | undefined
  const trend = (scorAzi && scorIeri) ? scorAzi - scorIeri : null

  const jurnalPentruMedie = jurnal.slice(0, 7)
  const sumaScoruri = jurnalPentruMedie.reduce((s: number, j: any) => s + (j.scor_wellness || 0), 0)
  const medie7 = jurnalPentruMedie.length > 0 ? Math.round(sumaScoruri / jurnalPentruMedie.length) : null

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white mb-1">
            Bună{util?.nume ? `, ${util.nume.split(' ')[0]}` : ''}! 🌿
          </h1>
          <p className="text-white/40 text-sm">
            {new Date().toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <Link href="/dashboard/analiza" className="btn-green py-2.5 px-5 text-sm">
          + Analiză Nouă
        </Link>
      </div>

      {/* Score + trend */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="card p-5 md:col-span-2">
          <div className="text-white/30 text-xs uppercase tracking-wider mb-3">Scorul de ieri</div>
          {scorAzi ? (
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="6"/>
                  <circle cx="36" cy="36" r="28" fill="none" stroke={scorColor(scorAzi)} strokeWidth="6"
                    strokeDasharray={`${(scorAzi / 100) * 176} 176`} strokeLinecap="round"/>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center" style={{ marginTop: 8 }}>
                  <span className="font-fraunces text-2xl font-bold" style={{ color: scorColor(scorAzi) }}>{scorAzi}</span>
                </div>
              </div>
              <div>
                <div className="font-fraunces text-lg font-bold" style={{ color: scorColor(scorAzi) }}>
                  {scorLabel(scorAzi)}
                </div>
                {trend !== null && (
                  <div className="text-sm mt-1" style={{ color: trend >= 0 ? '#4ade80' : '#f87171' }}>
                    {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)} față de alaltăieri
                  </div>
                )}
                {medie7 && (
                  <div className="text-xs text-white/30 mt-1">Medie 7 zile: {medie7}/100</div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-white/30 text-sm">
              Completează jurnalul pentru scor →{' '}
              <Link href="/dashboard/jurnal" className="text-green-400">Jurnal</Link>
            </div>
          )}
        </div>

        {/* Trend */}
        <div className="card p-5 md:col-span-2">
          <div className="text-white/30 text-xs uppercase tracking-wider mb-3">Trend 14 zile</div>
          {jurnal.length > 1 ? (
            <div className="flex items-end gap-1.5 h-12">
              {jurnal.slice().reverse().map((j: any, i: number) => (
                <div key={i} title={`${j.data_zi}: ${j.scor_wellness}/100`}
                  className="flex-1 rounded-t-sm transition-all"
                  style={{
                    height: `${((j.scor_wellness || 0) / 100) * 48}px`,
                    background: scorColor(j.scor_wellness || 0),
                    opacity: 0.5 + (i / jurnal.length) * 0.5,
                    minWidth: 8,
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-white/25 text-sm">Completează jurnalul zilnic pentru trend</div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: '📊', label: 'Analize total', val: analize.length, sub: 'rapoarte' },
          { icon: '📓', label: 'Zile jurnal', val: jurnal.length, sub: 'înregistrate' },
          { icon: '🌿', label: 'Analize luna', val: util?.analize_luna || 0, sub: planInfo.analize < 999999 ? `din ${planInfo.analize}` : 'nelimitat' },
          { icon: '⌚', label: 'Plan', val: planInfo.label, sub: planInfo.pret },
        ].map((s, i) => (
          <div key={i} className="card p-5">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="font-fraunces text-2xl font-bold text-white">{s.val}</div>
            <div className="text-white/30 text-xs mt-1">{s.label}</div>
            <div className="text-white/20 text-[10px]">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Wearables Card */}
      {wearableData && (
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] font-bold text-white/30 uppercase tracking-wider">⌚ {wearableData.sursa} — Azi</div>
            <a href="/dashboard/wearables" className="text-xs text-green-400/60 hover:text-green-400">Vezi detalii →</a>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: '🏃', label: 'Pași', value: wearableData.pasi?.toLocaleString(), color: '#4ade80' },
              { icon: '🔥', label: 'Calorii', value: `${wearableData.calorii} kcal`, color: '#fb923c' },
              { icon: '❤️', label: 'HR medie', value: wearableData.hr_medie ? `${wearableData.hr_medie} bpm` : '—', color: '#f87171' },
              { icon: '⚡', label: 'Min. active', value: `${wearableData.minute_active} min`, color: '#a78bfa' },
            ].map((m, i) => (
              <div key={i} className="text-center p-3 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                <div className="text-lg mb-1">{m.icon}</div>
                <div className="text-sm font-bold" style={{ color: m.color }}>{m.value}</div>
                <div className="text-[9px] text-white/30 mt-0.5">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Analize recente */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white/70">Analize recente</h3>
          <Link href="/dashboard/istoric" className="text-green-400 text-xs hover:text-green-300">
            Vezi tot →
          </Link>
        </div>
        {analize.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">🌿</div>
            <div className="text-white/35 text-sm mb-3">Nicio analiză încă</div>
            <Link href="/dashboard/analiza" className="btn-green text-sm py-2 px-5 inline-block">
              Prima analiză →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {analize.map((a: any, i: number) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <div className="text-xl flex-shrink-0">🌿</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white/75">Analiză wellness</div>
                  <div className="text-xs text-white/30">
                    {new Date(a.creat_la).toLocaleDateString('ro-RO')}
                  </div>
                </div>
                {a.scor_wellness && (
                  <div className="text-right flex-shrink-0">
                    <div className="font-fraunces text-lg font-bold" style={{ color: scorColor(a.scor_wellness) }}>
                      {a.scor_wellness}
                    </div>
                    <div className="text-[10px] text-white/25">/100</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div>
        <div className="text-white/30 text-xs uppercase tracking-wider mb-3">Acțiuni rapide</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: '/dashboard/analiza',   icon: '🌿', label: 'Analiză Nouă' },
            { href: '/dashboard/jurnal',    icon: '📓', label: 'Jurnal Azi' },
            { href: '/dashboard/wearables', icon: '⌚', label: 'Wearables' },
            { href: '/dashboard/cont',      icon: '👤', label: 'Contul meu' },
          ].map((a) => (
            <Link key={a.href} href={a.href}
              className="card p-4 text-center hover:bg-white/[0.05] transition-all rounded-xl">
              <div className="text-2xl mb-2">{a.icon}</div>
              <div className="text-white/55 text-xs font-medium">{a.label}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
