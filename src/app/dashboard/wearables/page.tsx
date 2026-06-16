'use client'
// src/app/dashboard/wearables/page.tsx
import { useState, useEffect } from 'react'
import { createBrowserClient, areAcces } from '@/lib/supabase'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_WEARABLES_API_URL || 'http://localhost:8001'

function metricColor(val: number | null, thresholds: [number, number]) {
  if (!val) return 'rgba(255,255,255,.4)'
  if (val >= thresholds[1]) return '#4ade80'
  if (val >= thresholds[0]) return '#facc15'
  return '#f87171'
}

// ══════════════════════════════════════════════════════════════════════════════
export default function WearablesPage() {
  const supabase = createBrowserClient()

  const [userId, setUserId]         = useState('')
  const [plan, setPlan]             = useState('free')
  const [util, setUtil]             = useState<any>(null)
  const [ouraStatus, setOuraStatus] = useState<any>(null)
  const [garminStatus, setGarminStatus] = useState<any>(null)
  const [dateWearable, setDateWearable] = useState<any>(null)
  const [zile30, setZile30] = useState<any[]>([])
  const [metricaGrafic, setMetricaGrafic] = useState<'pasi'|'calorii'|'minute_active'>('pasi')
  const [tooltipGrafic, setTooltipGrafic] = useState<{x: number, y: number, text: string} | null>(null)
  const [loading, setLoading]       = useState(false)
  const [syncing, setSyncing]       = useState(false)
  const [garminForm, setGarminForm] = useState({ email: '', password: '' })
  const [showGarminForm, setShowGarminForm] = useState(false)
  const [garminLoading, setGarminLoading]   = useState(false)
  const [mesaj, setMesaj]           = useState('')
  const [eroare, setEroare]         = useState('')
  const [tab, setTab]               = useState<'conectare' | 'date' | 'istoric'>('conectare')
  const [dataSelectata, setDataSelectata] = useState(new Date(Date.now() - 86400000).toISOString().slice(0, 10))
  const [istoricDate, setIstoricDate]   = useState<any[]>([])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      supabase.from('utilizatori').select('plan, profil_complet').eq('id', user.id).single()
        .then(async ({ data }) => { 
          if (data) { 
            setPlan(data.plan)
            setUtil(data)
            // Auto-load Google Fit
            if (data.profil_complet?.google_fit_conectat) {
              try {
                const res = await fetch(`/api/wearables/google-fit/data?user_id=${uid}`)
                const gfit = await res.json()
                if (gfit.ok) {
                  setZile30(gfit.zile || [])
                  const hrVal = gfit.azi?.hr_medie || gfit.zile?.slice().reverse().find((z: any) => z.hr_medie > 0)?.hr_medie || 0
                  setDateWearable({
                    combinat: { pasi: gfit.azi?.pasi, calorii: gfit.azi?.calorii, hr_medie: hrVal, hr_minim: hrVal, minute_active: gfit.azi?.minute_active, sursa: 'google_fit' },
                    zile: gfit.zile, sursa: 'google_fit', data_zi: gfit.azi?.data
                  })
                  setTab('date')
                }
              } catch(e) { console.log('GFit auto-load:', e) }
            }
          }
        })
      checkStatuses(user.id)
      loadIstoricDate(user.id)
    })
  }, [])

  const checkStatuses = async (uid: string) => {
    try {
      const [o, g] = await Promise.all([
        fetch(`${API}/oura/status/${uid}`).then(r => r.json()).catch(() => ({ conectat: false })),
        fetch(`${API}/garmin/status/${uid}`).then(r => r.json()).catch(() => ({ conectat: false })),
      ])
      setOuraStatus(o); setGarminStatus(g)
    } catch {}
  }

  const loadIstoricDate = async (uid: string) => {
    const { data } = await supabase.from('wearable_date_zilnice')
      .select('data_zi, provider, date_norm')
      .eq('user_id', uid)
      .order('data_zi', { ascending: false })
      .limit(30)
    if (data) setIstoricDate(data)
  }

  const conecteazaOura = () => {
    window.location.href = `${API}/oura/auth/${userId}`
  }

  const conecteazaGarmin = async () => {
    if (!garminForm.email || !garminForm.password) return
    setGarminLoading(true); setEroare('')
    try {
      const res = await fetch(`${API}/garmin/conecteaza/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(garminForm),
      })
      const data = await res.json()
      if (res.ok) {
        setMesaj('✓ Garmin conectat! Datele se trag automat zilnic.')
        setShowGarminForm(false)
        setGarminForm({ email: '', password: '' })
        await checkStatuses(userId)
      } else {
        setEroare(data.detail || 'Credențiale invalide')
      }
    } catch { setEroare('Eroare conexiune la API') }
    finally { setGarminLoading(false) }
  }

  const trageDate = async (zi?: string) => {
    setSyncing(true); setEroare('')
    try {
      if (util?.profil_complet?.google_fit_conectat) {
        const res = await fetch(`/api/wearables/google-fit/data?user_id=${userId}`)
        const data = await res.json()
        if (data.ok) {
          const hrAzi = data.azi?.hr_medie || data.zile?.slice().reverse().find((z: any) => z.hr_medie > 0)?.hr_medie || 0
          setDateWearable({ 
            combinat: { 
              pasi: data.azi?.pasi,
              calorii: data.azi?.calorii,
              hr_medie: hrAzi,
              hr_minim: hrAzi,
              minute_active: data.azi?.minute_active,
              sursa: 'google_fit'
            }, 
            zile: data.zile, 
            sursa: 'google_fit' 
          })
          setTab('date')
        } else setEroare(data.error || 'Eroare Google Fit')
      } else {
        const params = zi ? `?data=${zi}` : ''
        const res = await fetch(`${API}/wearables/date-complete/${userId}${params}`)
        const data = await res.json()
        setDateWearable(data)
        setTab('date')
        await loadIstoricDate(userId)
      }
    } catch(e: any) { setEroare('Eroare: ' + e.message) }
    finally { setSyncing(false) }
  }

  const oricareConetat = ouraStatus?.conectat || garminStatus?.conectat || util?.profil_complet?.google_fit_conectat
  const comb = dateWearable?.combinat || {}

  // ── GATE: plan insuficient ─────────────────────────────────────────────────

  return (
    <div className="fade-in space-y-4 max-w-2xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white mb-1">⌚ Wearables</h1>
          <p className="text-white/40 text-sm">Date automate din Oura Ring și Garmin Connect</p>
        </div>
        {oricareConetat && (
          <button onClick={() => trageDate()} disabled={syncing}
            className="btn-green text-sm py-2.5 px-5">
            {syncing ? '⏳ Sincronizez...' : '⬇️ Trage datele de ieri'}
          </button>
        )}
      </div>

      {mesaj && <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-sm text-green-400">{mesaj}</div>}
      {eroare && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">⚠️ {eroare}</div>}

      {/* Tabs */}
      <div className="flex gap-1.5 bg-white/[0.03] border border-white/[0.07] rounded-xl p-1">
        {[['conectare', '🔗 Conectare'], ['date', `📊 Date${dateWearable ? '' : ''}`], ['istoric', `📅 Istoric (${istoricDate.length})`]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k as any)}
            className={`flex-1 text-xs font-medium py-2 rounded-lg transition-all ${
              tab === k ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'text-white/35 hover:text-white/60'
            }`}>{l}</button>
        ))}
      </div>

      {/* ── TAB: CONECTARE ── */}
      {tab === 'conectare' && (
        <div className="space-y-3 fade-in">
          {/* Oura */}
          <div className="card p-5">
            <div className="flex items-center gap-4">
              <div className="text-3xl flex-shrink-0">💍</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-white/85">Oura Ring</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: ouraStatus?.conectat ? '#4ade80' : 'rgba(255,255,255,.2)' }} />
                    <span className="text-xs" style={{ color: ouraStatus?.conectat ? '#4ade80' : 'rgba(255,255,255,.35)' }}>
                      {ouraStatus?.conectat ? 'Conectat' : 'Neconectat'}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-white/35 mb-1">Readiness, somn detaliat, HRV, temperatură nocturnă, SpO2</div>
                {ouraStatus?.ultima_sync && (
                  <div className="text-[10px] text-white/20">Ultima sync: {new Date(ouraStatus.ultima_sync).toLocaleString('ro-RO')}</div>
                )}
              </div>
              {ouraStatus?.conectat ? (
                <span className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full flex-shrink-0">✓ Activ</span>
              ) : (
                <button onClick={conecteazaOura} className="btn-green text-xs py-2 px-4 flex-shrink-0">Conectează →</button>
              )}
            </div>
            {!ouraStatus?.conectat && (
              <div className="mt-3 p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl text-xs text-white/35 leading-relaxed">
                Vei fi redirecționat la Oura pentru autorizare (30 secunde). Tokenul se salvează automat — nu mai reconectezi niciodată.
              </div>
            )}
          </div>

          {/* Garmin */}
          <div className="card p-5">
            <div className="flex items-center gap-4">
              <div className="text-3xl flex-shrink-0">⌚</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-white/85">Garmin Connect</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: garminStatus?.conectat ? '#4ade80' : 'rgba(255,255,255,.2)' }} />
                    <span className="text-xs" style={{ color: garminStatus?.conectat ? '#4ade80' : 'rgba(255,255,255,.35)' }}>
                      {garminStatus?.conectat ? `Conectat (${garminStatus.email})` : 'Neconectat'}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-white/35">Pași, HRV, Body Battery, stress, somn, antrenamente, VO2max</div>
              </div>
              {garminStatus?.conectat ? (
                <span className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full flex-shrink-0">✓ Activ</span>
              ) : (
                <button onClick={() => setShowGarminForm(!showGarminForm)} className="btn-ghost text-xs py-2 px-4 flex-shrink-0">
                  {showGarminForm ? 'Anulează' : 'Conectează →'}
                </button>
              )}
            </div>

            {showGarminForm && (
              <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-3">
                <div className="text-xs text-white/35 leading-relaxed">
                  Credențialele contului Garmin Connect. Parola se stochează <strong className="text-white/50">criptat (AES-256)</strong> — nu e accesibilă nimănui.
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-white/35 mb-1.5 block">Email Garmin</label>
                    <input type="email" value={garminForm.email} onChange={e => setGarminForm(p => ({ ...p, email: e.target.value }))}
                      className="input text-sm" placeholder="email@garmin.com" />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/35 mb-1.5 block">Parolă Garmin</label>
                    <input type="password" value={garminForm.password} onChange={e => setGarminForm(p => ({ ...p, password: e.target.value }))}
                      className="input text-sm" placeholder="••••••••" />
                  </div>
                </div>
                <button onClick={conecteazaGarmin} disabled={!garminForm.email || !garminForm.password || garminLoading}
                  className="btn-green text-sm py-2.5 px-6">
                  {garminLoading ? '⏳ Conectez...' : '🔗 Conectează Garmin'}
                </button>
              </div>
            )}
          </div>

          {/* CTA trage date */}
          {oricareConetat && (
            <button onClick={() => trageDate()} disabled={syncing} className="btn-green w-full py-4 text-base">
              {syncing ? '⏳ Trag datele de ieri...' : '⬇️ Trage datele de ieri automat'}
            </button>
          )}

          {/* Google Fit */}
          <div className="card p-5">
            <div className="flex items-start gap-4">
              <div className="text-3xl">🔵</div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-semibold text-white/85 text-sm">Google Fit</div>
                  {(util as any)?.profil_complet?.google_fit_conectat
                    ? <span className="text-xs text-green-400 font-medium">✅ Conectat</span>
                    : <button onClick={() => window.location.href = `/api/wearables/google-fit?user_id=${userId}`}
                        className="btn-green text-xs py-1.5 px-4">Conectează →</button>
                  }
                </div>
                <div className="text-xs text-white/40">Pași, calorii, frecvență cardiacă, minute active</div>
              </div>
            </div>
          </div>
          {/* Viitoare */}
          <div className="card p-4">
            <div className="text-[10px] font-bold text-white/25 uppercase tracking-wider mb-3">🔜 Disponibile în curând</div>
            <div className="grid grid-cols-3 gap-2">
              {[{ icon: '📱', l: 'Zepp/Amazfit' }, { icon: '💙', l: 'Samsung Health' }, { icon: '❄️', l: 'Polar' }, { icon: '💚', l: 'Fitbit' }, { icon: '⚖️', l: 'Withings' }, { icon: '💪', l: 'WHOOP' }].map((p, i) => (
                <div key={i} className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl text-center opacity-50">
                  <div className="text-xl mb-1">{p.icon}</div>
                  <div className="text-[10px] text-white/45">{p.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: DATE ── */}
      {tab === 'date' && (
        <div className="space-y-3 fade-in">
          {/* Date picker */}
          <div className="flex items-center gap-3">
            <input type="date" value={dataSelectata} onChange={e => setDataSelectata(e.target.value)}
              className="input text-sm flex-1" max={new Date().toISOString().slice(0, 10)} />
            <button onClick={() => trageDate(dataSelectata)} disabled={syncing}
              className="btn-green text-sm py-2.5 px-5 flex-shrink-0">
              {syncing ? '⏳' : '🔄 Trage'}
            </button>
          </div>

          {!dateWearable ? (
            <div className="text-center py-16 text-white/30">
              <div className="text-4xl mb-3">⌚</div>
              <div className="text-sm mb-3">Nicio dată trasă încă</div>
              {oricareConetat && (
                <button onClick={() => trageDate()} disabled={syncing} className="btn-green text-sm py-2.5 px-6">
                  Trage datele de ieri
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Surse active */}
              <div className="flex gap-2">
                {dateWearable.surse_active?.map((s: string) => (
                  <span key={s} className="text-xs px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 capitalize">✓ {s}</span>
                ))}
                <span className="text-xs text-white/30 self-center">· {dateWearable.data_zi}</span>
              </div>

              {/* Grafic trend 30 zile */}
              {(zile30.length > 0 || dateWearable?.zile?.length > 0) && (() => {
                const zile = zile30.length > 0 ? zile30 : (dateWearable?.zile || [])
                const metrici = [
                  { key: 'pasi', label: 'Pași', color: '#4ade80', target: 10000 },
                  { key: 'calorii', label: 'Calorii', color: '#fb923c', target: 2500 },
                  { key: 'minute_active', label: 'Min. active', color: '#a78bfa', target: 30 },
                ]
                const metrica = metrici.find(m => m.key === metricaGrafic) || metrici[0]
                const valori = zile.map((z: any) => z[metricaGrafic] || 0)
                const maxVal = Math.max(...valori, 1)
                return (
                  <div className="card p-4 mb-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-[10px] font-bold text-white/25 uppercase tracking-wider">📈 Trend {zile.length} zile</div>
                      <div className="flex gap-1">
                        {metrici.map(m => (
                          <button key={m.key} onClick={() => setMetricaGrafic(m.key as any)}
                            className={`text-[10px] px-2 py-1 rounded-lg transition-all ${metricaGrafic === m.key ? 'text-white font-bold' : 'text-white/30'}`}
                            style={metricaGrafic === m.key ? { background: m.color + '20', color: m.color } : {}}>
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ position: 'relative' }}>
                      {/* Tooltip */}
                      {tooltipGrafic && (
                        <div style={{ position: 'absolute', top: tooltipGrafic.y - 30, left: Math.min(tooltipGrafic.x, 280), background: '#1a2a1a', border: '1px solid #4ade8040', borderRadius: 8, padding: '4px 8px', fontSize: 11, color: '#fff', whiteSpace: 'nowrap', zIndex: 50, pointerEvents: 'none' }}>
                          {tooltipGrafic.text}
                        </div>
                      )}
                      {/* Grafic 30 zile */}
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '80px' }}
                        onMouseLeave={() => setTooltipGrafic(null)}>
                        {zile.map((z: any, i: number) => {
                          const val = z[metricaGrafic] || 0
                          const h = maxVal > 0 ? Math.round((val / maxVal) * 76) : 0
                          const ok = val >= metrica.target
                          return (
                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '80px', cursor: 'pointer' }}
                              onMouseEnter={(e) => setTooltipGrafic({ x: e.nativeEvent.offsetX + i * 8, y: 0, text: `${z.data}: ${val.toLocaleString()}` })}>
                              <div style={{ width: '100%', height: `${Math.max(h, val > 0 ? 3 : 0)}px`, background: ok ? metrica.color : metrica.color + '80', borderRadius: '2px 2px 0 0' }} />
                            </div>
                          )
                        })}
                      </div>
                      {/* Ultimele 7 zile cu valori */}
                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Ultimele 7 zile</div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {zile.slice(-7).map((z: any, i: number) => {
                            const val = z[metricaGrafic] || 0
                            const ok = val >= metrica.target
                            const maxUlt = Math.max(...zile.slice(-7).map((z: any) => z[metricaGrafic] || 0), 1)
                            const h = Math.round((val / maxUlt) * 48)
                            return (
                              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                                <div style={{ fontSize: 9, color: ok ? metrica.color : 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                                  {val > 0 ? (val >= 1000 ? Math.round(val/1000) + 'k' : val) : '—'}
                                </div>
                                <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', height: 48 }}>
                                  <div style={{ width: '100%', height: `${Math.max(h, val > 0 ? 3 : 0)}px`, background: ok ? metrica.color : metrica.color + '60', borderRadius: '3px 3px 0 0' }} />
                                </div>
                                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>
                                  {z.data?.slice(0, 5)}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between text-[9px] text-white/20 mt-1">
                      <span>{zile[0]?.data}</span>
                      <span style={{ color: metrica.color }}>target: {metrica.target.toLocaleString()}</span>
                      <span>{zile[zile.length-1]?.data}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {[
                        { l: 'Medie', v: Math.round(valori.filter((v: number) => v > 0).reduce((a: number, b: number) => a + b, 0) / Math.max(1, valori.filter((v: number) => v > 0).length)) },
                        { l: 'Max', v: Math.max(...valori) },
                        { l: 'Min', v: Math.min(...valori.filter((v: number) => v > 0)) },
                      ].map((s, i) => (
                        <div key={i} className="text-center p-2 bg-white/[0.02] rounded-lg">
                          <div className="text-xs font-bold" style={{ color: metrica.color }}>{s.v?.toLocaleString()}</div>
                          <div className="text-[9px] text-white/25">{s.l}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}
              {/* Metrici cheie */}
              <div className="card p-4">
                <div className="text-[10px] font-bold text-white/25 uppercase tracking-wider mb-3">⚡ Metrici cheie</div>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                  {[
                    { icon: '💓', l: 'HRV', v: comb.hrv ? `${comb.hrv}ms` : '—', thr: [30, 45] as [number, number], raw: comb.hrv },
                    { icon: '😴', l: 'Somn', v: comb.ore_somn ? `${comb.ore_somn}h` : '—', thr: [6.5, 7.5] as [number, number], raw: comb.ore_somn },
                    { icon: '🏃', l: 'Pași', v: comb.pasi ? parseInt(comb.pasi).toLocaleString() : '—', thr: [7000, 10000] as [number, number], raw: comb.pasi },
                    { icon: '❤️', l: 'HR', v: (comb.hr_minim || comb.hr_medie) ? `${comb.hr_minim || comb.hr_medie}bpm` : '—', thr: [55, 75] as [number, number], raw: 100 - (comb.hr_minim || comb.hr_medie || 0) },
                    { icon: '🔥', l: 'Calorii', v: comb.calorii ? `${comb.calorii}` : '—', thr: [1800, 2500] as [number, number], raw: comb.calorii },
                    { icon: '⚡', l: 'Min. Active', v: comb.minute_active ? `${comb.minute_active}min` : '—', thr: [30, 60] as [number, number], raw: comb.minute_active },
                  ].map((m, i) => (
                    <div key={i} className="text-center p-3 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                      <div className="text-lg mb-1">{m.icon}</div>
                      <div className="font-fraunces text-lg font-bold leading-none" style={{ color: metricColor(m.raw, m.thr) }}>{m.v}</div>
                      <div className="text-[9px] text-white/30 uppercase tracking-wide mt-1">{m.l}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Oura detalii */}
              {dateWearable.surse_active?.includes('oura') && dateWearable.date?.oura && (
                <div className="card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">💍</span>
                    <div className="text-[10px] font-bold text-white/25 uppercase tracking-wider">Oura — Somn & Recuperare</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { l: 'Readiness', v: dateWearable.date.oura.readiness_score ? `${dateWearable.date.oura.readiness_score}/100` : '—' },
                      { l: 'HRV noapte', v: dateWearable.date.oura.hrv_mediu_noapte ? `${dateWearable.date.oura.hrv_mediu_noapte}ms` : '—' },
                      { l: 'Eficiență somn', v: dateWearable.date.oura.eficienta_somn ? `${dateWearable.date.oura.eficienta_somn}%` : '—' },
                      { l: 'Deep sleep', v: dateWearable.date.oura.deep_sleep_min ? `${dateWearable.date.oura.deep_sleep_min}min` : '—' },
                      { l: 'REM sleep', v: dateWearable.date.oura.rem_sleep_min ? `${dateWearable.date.oura.rem_sleep_min}min` : '—' },
                      { l: 'Temp. delta', v: dateWearable.date.oura.temperatura_delta ? `${dateWearable.date.oura.temperatura_delta > 0 ? '+' : ''}${dateWearable.date.oura.temperatura_delta}°C` : '—' },
                    ].map((m, i) => (
                      <div key={i} className="p-2 bg-purple-500/[0.04] border border-purple-500/[0.12] rounded-lg text-center">
                        <div className="text-sm font-semibold text-white/75">{m.v}</div>
                        <div className="text-[9px] text-white/30 uppercase tracking-wide mt-0.5">{m.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Garmin detalii */}
              {dateWearable.surse_active?.includes('garmin') && dateWearable.date?.garmin && (
                <div className="card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">⌚</span>
                    <div className="text-[10px] font-bold text-white/25 uppercase tracking-wider">Garmin — Activitate & Metrici</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { l: 'Body Battery', v: dateWearable.date.garmin.body_battery_max ? `${dateWearable.date.garmin.body_battery_max}/100` : '—' },
                      { l: 'Stres', v: dateWearable.date.garmin.stress_mediu ? `${dateWearable.date.garmin.stress_mediu}/100` : '—' },
                      { l: 'VO2max', v: dateWearable.date.garmin.vo2max ? `${dateWearable.date.garmin.vo2max}` : '—' },
                      { l: 'Calorii total', v: dateWearable.date.garmin.calorii_total ? `${dateWearable.date.garmin.calorii_total}kcal` : '—' },
                      { l: 'Min. active', v: dateWearable.date.garmin.minute_active ? `${dateWearable.date.garmin.minute_active}min` : '—' },
                      { l: 'SpO2 medie', v: dateWearable.date.garmin.spo2_medie ? `${dateWearable.date.garmin.spo2_medie}%` : '—' },
                    ].map((m, i) => (
                      <div key={i} className="p-2 bg-cyan-500/[0.04] border border-cyan-500/[0.12] rounded-lg text-center">
                        <div className="text-sm font-semibold text-white/75">{m.v}</div>
                        <div className="text-[9px] text-white/30 uppercase tracking-wide mt-0.5">{m.l}</div>
                      </div>
                    ))}
                  </div>
                  {/* Antrenamente */}
                  {dateWearable.date.garmin.antrenamente?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/[0.05]">
                      <div className="text-[10px] font-bold text-white/25 uppercase tracking-wider mb-2">🏃 Antrenamente</div>
                      {dateWearable.date.garmin.antrenamente.map((a: any, i: number) => (
                        <div key={i} className="flex items-center gap-3 py-2 border-b border-white/[0.04]">
                          <span className="text-base">{a.tip?.includes('run') ? '🏃' : a.tip?.includes('cycl') ? '🚴' : '💪'}</span>
                          <div className="flex-1 text-xs text-white/65">{a.tip || 'Antrenament'} · {a.durata_min}min {a.distanta_km ? `· ${a.distanta_km}km` : ''}</div>
                          {a.hr_mediu && <span className="text-xs text-red-400">♥ {a.hr_mediu}bpm</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button onClick={() => setTab('conectare')} className="btn-ghost text-sm py-2.5 w-full">← Înapoi la conectare</button>
            </>
          )}
        </div>
      )}

      {/* ── TAB: ISTORIC ── */}
      {tab === 'istoric' && (
        <div className="space-y-2 fade-in">
          {istoricDate.length === 0 ? (
            <div className="text-center py-16 text-white/30">
              <div className="text-4xl mb-3">📅</div>
              <div className="text-sm">Nicio date sincronizate încă</div>
            </div>
          ) : (
            (() => {
              // Grupează pe zile
              const peZi: Record<string, any[]> = {}
              istoricDate.forEach(d => {
                if (!peZi[d.data_zi]) peZi[d.data_zi] = []
                peZi[d.data_zi].push(d)
              })
              return Object.entries(peZi).map(([zi, intrari]) => (
                <div key={zi} className="card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-medium text-white/70">
                      {new Date(zi + 'T12:00:00').toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </div>
                    <div className="flex gap-2">
                      {intrari.map((i: any) => (
                        <span key={i.provider} className="text-xs px-2 py-0.5 rounded-full bg-white/[0.05] text-white/40">{i.provider}</span>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { l: 'HRV', v: intrari[0]?.date_norm?.hrv_mediu_noapte || intrari.find((i: any) => i.date_norm?.hrv_last_night)?.date_norm?.hrv_last_night, u: 'ms' },
                      { l: 'Somn', v: intrari[0]?.date_norm?.ore_somn, u: 'h' },
                      { l: 'Pași', v: intrari.find((i: any) => i.date_norm?.pasi)?.date_norm?.pasi, u: '' },
                      { l: 'Readiness', v: intrari.find((i: any) => i.date_norm?.readiness_score)?.date_norm?.readiness_score, u: '/100' },
                    ].map((m, i) => (
                      <div key={i} className="text-center">
                        <div className="text-sm font-semibold text-white/70">{m.v ? `${typeof m.v === 'number' && m.v > 1000 ? m.v.toLocaleString() : m.v}${m.u}` : '—'}</div>
                        <div className="text-[9px] text-white/25 uppercase tracking-wide">{m.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            })()
          )}
        </div>
      )}
    </div>
  )
}

