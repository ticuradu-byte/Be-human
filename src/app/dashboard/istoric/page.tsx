'use client'
// src/app/dashboard/istoric/page.tsx
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import Link from 'next/link'

function scorColor(s: number) { return s >= 75 ? '#4ade80' : s >= 55 ? '#facc15' : '#f87171' }

export default function IstoricPage() {
  const supabase = createBrowserClient()
  const [jurnal, setJurnal]   = useState<any[]>([])
  const [analize, setAnalize] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState<'trend' | 'analize'>('trend')
  const [perioada, setPerioad] = useState<7 | 30 | 90>(30)
  const [analizaOpen, setAnalizaOpen] = useState<number | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: j }, { data: a }] = await Promise.all([
        supabase.from('jurnal_zilnic').select('*').eq('user_id', user.id).order('data_zi', { ascending: false }).limit(90),
        supabase.from('analize_bh').select('*').eq('user_id', user.id).order('creat_la', { ascending: false }).limit(50),
      ])
      if (j) setJurnal(j)
      if (a) setAnalize(a)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-3xl animate-pulse">🫀</div></div>

  const jurnalPerioad = jurnal.slice(0, perioada)
  const scoruri = jurnalPerioad.filter(j => j.scor_wellness).map(j => j.scor_wellness)
  const medie   = scoruri.length ? Math.round(scoruri.reduce((s: number, v: number) => s + v, 0) / scoruri.length) : null
  const maxScor = scoruri.length ? Math.max(...scoruri) : null
  const minScor = scoruri.length ? Math.min(...scoruri) : null
  const trend   = scoruri.length >= 2 ? scoruri[0] - scoruri[scoruri.length - 1] : null

  return (
    <div className="fade-in space-y-4 max-w-2xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white mb-1">📈 Istoric & Trend</h1>
          <p className="text-white/40 text-sm">Evoluția wellness-ului tău în timp</p>
        </div>
        <Link href="/dashboard/analiza" className="btn-green text-sm py-2.5 px-5">+ Analiză Nouă</Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 bg-white/[0.03] border border-white/[0.07] rounded-xl p-1">
        {[['trend', '📊 Trend Wellness'], ['analize', `🌿 Analize (${analize.length})`]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k as any)}
            className={`flex-1 text-xs font-medium py-2 rounded-lg transition-all ${
              tab === k ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'text-white/35 hover:text-white/60'
            }`}>{l}</button>
        ))}
      </div>

      {/* ── TREND ── */}
      {tab === 'trend' && (
        <div className="space-y-3 fade-in">
          {/* Perioadă */}
          <div className="flex gap-2">
            {([7, 30, 90] as const).map(p => (
              <button key={p} onClick={() => setPerioad(p)}
                className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                  perioada === p ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'text-white/35 hover:text-white/60 border border-white/[0.07]'
                }`}>
                {p} zile
              </button>
            ))}
          </div>

          {jurnalPerioad.length === 0 ? (
            <div className="text-center py-16 text-white/30">
              <div className="text-4xl mb-3">📓</div>
              <div className="text-sm mb-3">Completează jurnalul zilnic pentru a vedea trendul</div>
              <Link href="/dashboard/jurnal" className="btn-green text-sm py-2.5 px-6 inline-block">Jurnal zilnic →</Link>
            </div>
          ) : (
            <>
              {/* Stats rezumat */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { l: 'Medie', v: medie || '—', color: medie ? scorColor(medie) : 'rgba(255,255,255,.4)' },
                  { l: 'Maxim', v: maxScor || '—', color: maxScor ? scorColor(maxScor) : 'rgba(255,255,255,.4)' },
                  { l: 'Minim', v: minScor || '—', color: minScor ? scorColor(minScor) : 'rgba(255,255,255,.4)' },
                  { l: 'Trend', v: trend !== null ? `${trend > 0 ? '+' : ''}${trend}` : '—', color: trend !== null ? (trend >= 0 ? '#4ade80' : '#f87171') : 'rgba(255,255,255,.4)' },
                ].map((s, i) => (
                  <div key={i} className="card p-3 text-center">
                    <div className="font-fraunces text-2xl font-bold" style={{ color: s.color }}>{s.v}</div>
                    <div className="text-[10px] text-white/30 uppercase tracking-wider mt-1">{s.l}</div>
                  </div>
                ))}
              </div>

              {/* Grafic bar */}
              <div className="card p-5">
                <div className="text-[10px] font-bold text-white/25 uppercase tracking-wider mb-4">Scor wellness zilnic — ultimele {perioada} zile</div>
                <div className="flex items-end gap-1" style={{ height: 80 }}>
                  {jurnalPerioad.slice().reverse().map((j: any, i: number) => {
                    const scor = j.scor_wellness
                    const h = scor ? (scor / 100) * 80 : 4
                    return (
                      <div key={i} className="flex-1 group relative" style={{ minWidth: 6 }}>
                        <div style={{ height: `${h}px`, background: scor ? scorColor(scor) : 'rgba(255,255,255,.1)', borderRadius: '2px 2px 0 0', opacity: scor ? 1 : 0.4 }} />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-black/80 text-white/80 text-[9px] px-2 py-1 rounded whitespace-nowrap z-10">
                          {new Date(j.data_zi + 'T12:00:00').toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}: {scor || '—'}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="flex justify-between mt-2 text-[9px] text-white/20">
                  <span>{new Date(jurnalPerioad[jurnalPerioad.length - 1]?.data_zi + 'T12:00:00').toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}</span>
                  <span>Azi</span>
                </div>
              </div>

              {/* Tabel zile */}
              <div className="card p-4">
                <div className="text-[10px] font-bold text-white/25 uppercase tracking-wider mb-3">Detalii pe zile</div>
                <div className="space-y-1.5 max-h-96 overflow-y-auto">
                  {jurnalPerioad.map((j: any) => (
                    <div key={j.id} className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-white/[0.02] transition-all">
                      <div className="w-20 text-xs text-white/40 flex-shrink-0">
                        {new Date(j.data_zi + 'T12:00:00').toLocaleDateString('ro-RO', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </div>
                      <div className="flex-1">
                        {j.scor_wellness ? (
                          <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${j.scor_wellness}%`, background: scorColor(j.scor_wellness) }} />
                          </div>
                        ) : (
                          <div className="h-2 bg-white/[0.04] rounded-full" />
                        )}
                      </div>
                      <div className="w-10 text-right">
                        <span className="text-xs font-semibold" style={{ color: j.scor_wellness ? scorColor(j.scor_wellness) : 'rgba(255,255,255,.2)' }}>
                          {j.scor_wellness || '—'}
                        </span>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        {j.energie && <span className="text-xs">{'⚡😊😐😴😫'.split('')[5 - parseInt(j.energie)]}</span>}
                        {j.mood    && <span className="text-xs">{'😄🙂😐😕😢'.split('')[5 - parseInt(j.mood)]}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── ANALIZE ── */}
      {tab === 'analize' && (
        <div className="space-y-2 fade-in">
          {analize.length === 0 ? (
            <div className="text-center py-16 text-white/30">
              <div className="text-4xl mb-3">🌿</div>
              <div className="text-sm mb-3">Nicio analiză completă încă</div>
              <Link href="/dashboard/analiza" className="btn-green text-sm py-2.5 px-6 inline-block">Prima analiză →</Link>
            </div>
          ) : (
            analize.map((a: any, i: number) => (
              <div key={a.id}>
                <div
                  className="card p-4 cursor-pointer hover:bg-white/[0.04] transition-all"
                  onClick={() => setAnalizaOpen(analizaOpen === i ? null : i)}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-xl flex-shrink-0">🌿</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white/75">Raport Wellness</div>
                      <div className="text-xs text-white/30 mt-0.5">
                        {new Date(a.creat_la).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {a.surse_date?.length > 0 && (
                        <div className="flex gap-1.5 mt-1.5 flex-wrap">
                          {a.surse_date.map((s: string) => (
                            <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-white/30">{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      {a.scor_wellness && (
                        <>
                          <div className="font-fraunces text-xl font-bold" style={{ color: scorColor(a.scor_wellness) }}>{a.scor_wellness}</div>
                          <div className="text-[10px] text-white/25">/100</div>
                        </>
                      )}
                    </div>
                    <span className="text-white/20 text-xs flex-shrink-0">{analizaOpen === i ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Detalii analiză */}
                {analizaOpen === i && a.rezultat_json && (
                  <div className="border border-white/[0.07] border-t-0 rounded-b-2xl p-4 bg-white/[0.01] space-y-3">
                    {/* Alerte */}
                    {a.alerte?.length > 0 && (
                      <div className="space-y-2">
                        {a.alerte.map((al: any, j: number) => (
                          <div key={j} className="text-xs p-3 rounded-xl" style={{
                            background: al.nivel === 'rosu' ? 'rgba(239,68,68,.08)' : 'rgba(250,204,21,.06)',
                            border: `1px solid ${al.nivel === 'rosu' ? 'rgba(239,68,68,.25)' : 'rgba(250,204,21,.2)'}`,
                          }}>
                            <span style={{ color: al.nivel === 'rosu' ? '#f87171' : '#facc15' }}>
                              {al.nivel === 'rosu' ? '🚨' : '⚠️'} {al.parametru}: {al.valoare}
                            </span>
                            <span className="text-white/40 ml-2">{al.mesaj}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-sm text-white/60 leading-relaxed">{a.rezultat_json.salut}</p>
                    <div className="bg-green-500/[0.06] border border-green-500/[0.15] rounded-xl p-3">
                      <div className="text-[10px] font-bold text-green-400 uppercase tracking-wider mb-1">⚡ Pasul cheie</div>
                      <div className="text-sm text-white/80">{a.rezultat_json.urmatorul_pas}</div>
                    </div>
                    {/* Top 3 insights */}
                    {a.rezultat_json.insights?.slice(0, 3).map((ins: any, j: number) => (
                      <div key={j} className="flex gap-3 p-3 bg-white/[0.02] rounded-xl">
                        <span className="text-base flex-shrink-0">{ins.icon}</span>
                        <div>
                          <div className="text-xs font-semibold text-white/75 mb-0.5">{ins.titlu}</div>
                          <div className="text-xs text-white/45 leading-relaxed">{ins.actiune}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
