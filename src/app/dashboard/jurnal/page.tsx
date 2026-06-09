'use client'
// src/app/dashboard/jurnal/page.tsx
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase'

// ── CALCULATOR SCORE ──────────────────────────────────────────────────────────
function calcScore(form: any, date: any): number {
  let scor = 0

  // HRV 30%
  if (date.hrv) {
    const hrv = parseFloat(date.hrv)
    const s = hrv >= 60 ? 100 : hrv >= 45 ? 85 : hrv >= 35 ? 65 : hrv >= 25 ? 45 : 25
    scor += s * 0.30
  } else scor += 65 * 0.30

  // Somn 25%
  if (date.ore_somn) {
    const h = parseFloat(date.ore_somn)
    const s = h >= 8 ? 100 : h >= 7.5 ? 90 : h >= 7 ? 80 : h >= 6.5 ? 65 : h >= 6 ? 45 : 25
    const cal = date.calitate_somn ? parseFloat(date.calitate_somn) : 70
    scor += Math.round(s * 0.6 + cal * 0.4) * 0.25
  } else scor += 65 * 0.25

  // Nutriție 20%
  if (date.calorii && date.calorii_target) {
    const r = parseFloat(date.calorii) / parseFloat(date.calorii_target)
    const s = (r >= 0.85 && r <= 1.15) ? 100 : (r >= 0.70 && r <= 1.30) ? 75 : 45
    scor += s * 0.20
  } else scor += 65 * 0.20

  // Activitate 15%
  if (date.pasi) {
    const p = parseInt(date.pasi)
    const s = p >= 12000 ? 100 : p >= 10000 ? 90 : p >= 8000 ? 75 : p >= 6000 ? 55 : 35
    scor += s * 0.15
  } else scor += 65 * 0.15

  // Stres/Screen 10%
  let stres = 70
  if (date.stres_garmin) stres = Math.max(10, 100 - parseInt(date.stres_garmin))
  if (date.screen_ore && parseFloat(date.screen_ore) > 4) stres = Math.max(10, stres - 20)
  scor += stres * 0.10

  // Bonus mood + energie din jurnal
  if (form.energie && form.mood) {
    const bonus = ((parseInt(form.energie) + parseInt(form.mood)) / 2 - 3) * 5
    scor = Math.max(5, Math.min(100, scor + bonus))
  }

  return Math.round(scor)
}

function scorColor(s: number) { return s >= 75 ? '#4ade80' : s >= 55 ? '#facc15' : '#f87171' }
function scorLabel(s: number) { return s >= 85 ? 'Zi de top 🚀' : s >= 70 ? 'Zi excelentă ⭐' : s >= 55 ? 'Zi bună 👍' : s >= 40 ? 'Zi ok 😐' : 'Zi slabă 😴' }

const ENERGIE_OPT = [
  { val: '1', emoji: '😫', label: 'Epuizat' },
  { val: '2', emoji: '😴', label: 'Obosit' },
  { val: '3', emoji: '😐', label: 'Normal' },
  { val: '4', emoji: '😊', label: 'Bine' },
  { val: '5', emoji: '⚡', label: 'Excelent' },
]
const MOOD_OPT = [
  { val: '1', emoji: '😢', label: 'Deprimat' },
  { val: '2', emoji: '😕', label: 'Scăzut' },
  { val: '3', emoji: '😐', label: 'Neutru' },
  { val: '4', emoji: '🙂', label: 'Bun' },
  { val: '5', emoji: '😄', label: 'Fericit' },
]
const FOAME_OPT = [
  { val: 'scazuta', emoji: '😌', label: 'Scăzută' },
  { val: 'normala', emoji: '😐', label: 'Normală' },
  { val: 'ridicata', emoji: '🤤', label: 'Ridicată' },
]

// ══════════════════════════════════════════════════════════════════════════════
export default function JurnalPage() {
  const supabase = createBrowserClient()

  const [form, setForm]     = useState({ energie: '', mood: '', foame: '', dureri: '', alte: '' })
  const [date, setDate]     = useState({ hrv: '', ore_somn: '', calitate_somn: '', pasi: '', stres_garmin: '', calorii: '', calorii_target: '', screen_ore: '' })
  const [scor, setScor]     = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [salvat, setSalvat] = useState(false)
  const [eroare, setEroare] = useState('')
  const [istoric, setIstoric] = useState<any[]>([])
  const [jurnalAzi, setJurnalAzi] = useState<any | null>(null)
  const [view, setView]     = useState<'form' | 'istoric'>('form')
  const [userId, setUserId] = useState<string>('')

  const azi = new Date().toISOString().slice(0, 10)
  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))
  const d = (k: string, v: string) => setDate(p => ({ ...p, [k]: v }))

  // Recalculează scorul live
  useEffect(() => {
    const hasAny = Object.values({ ...form, ...date }).some(v => v.trim())
    if (hasAny) setScor(calcScore(form, date))
    else setScor(null)
  }, [form, date])

  // Încarcă date existente
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      // Jurnal de azi
      const { data: jAzi } = await supabase.from('jurnal_zilnic')
        .select('*').eq('user_id', user.id).eq('data_zi', azi).single()
      if (jAzi) {
        setJurnalAzi(jAzi)
        setForm({ energie: String(jAzi.energie || ''), mood: String(jAzi.mood || ''), foame: jAzi.foame || '', dureri: jAzi.dureri || '', alte: jAzi.alte || '' })
        if (jAzi.scor_wellness) setScor(jAzi.scor_wellness)
      }

      // Istoric 30 zile
      const { data: ist } = await supabase.from('jurnal_zilnic')
        .select('*').eq('user_id', user.id).order('data_zi', { ascending: false }).limit(30)
      if (ist) setIstoric(ist)
    }
    load()
  }, [])

  const salveaza = async () => {
    if (!userId) return
    setSaving(true); setEroare('')

    const scorFinal = scor || calcScore(form, date)
    const payload = {
      user_id:       userId,
      data_zi:       azi,
      energie:       form.energie ? parseInt(form.energie) : null,
      mood:          form.mood    ? parseInt(form.mood)    : null,
      foame:         form.foame   || null,
      dureri:        form.dureri  || null,
      alte:          form.alte    || null,
      scor_wellness: scorFinal,
    }

    const { error } = await supabase.from('jurnal_zilnic')
      .upsert(payload, { onConflict: 'user_id,data_zi' })

    if (error) { setEroare('Eroare la salvare'); setSaving(false); return }

    // Actualizează istoricul local
    setIstoric(prev => {
      const filtered = prev.filter(j => j.data_zi !== azi)
      return [{ ...payload, creat_la: new Date().toISOString() }, ...filtered]
    })
    setScor(scorFinal); setSalvat(true)
    setTimeout(() => setSalvat(false), 2000)
    setSaving(false)
  }

  // ── CORELAȚII AUTOMATE ─────────────────────────────────────────────────────
  const corel: string[] = []
  if ((form.energie === '1' || form.energie === '2') && date.ore_somn && parseFloat(date.ore_somn) < 7) {
    corel.push(`⚡ Energie scăzută + somn ${date.ore_somn}h → recuperare insuficientă. Somn sub 7h reduce performanța cognitivă cu 40%.`)
  }
  if (form.foame === 'ridicata' && date.ore_somn && parseFloat(date.ore_somn) < 7) {
    corel.push(`🍽️ Foame ridicată + somn ${date.ore_somn}h → ghrelin crescut cu ~28% (studii RCT). Așteptați-vă la +300 calorii consumate azi.`)
  }
  if ((form.mood === '1' || form.mood === '2') && date.stres_garmin && parseInt(date.stres_garmin) > 50) {
    corel.push(`🧠 Mood scăzut + stres Garmin ${date.stres_garmin}/100 → cortizol cronic posibil. Verificați somn + magneziu + exercițiu.`)
  }
  if (date.hrv && parseInt(date.hrv) < 30) {
    corel.push(`💓 HRV ${date.hrv}ms → semnal de recuperare insuficientă. Evitați antrenamente intense azi.`)
  }

  return (
    <div className="fade-in space-y-4 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white mb-1">Jurnal Zilnic</h1>
          <p className="text-white/40 text-sm">{new Date().toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div className="flex gap-2 bg-white/[0.03] border border-white/[0.07] rounded-lg p-1">
          {[['form', '📓 Azi'], ['istoric', '📈 Istoric']].map(([k, l]) => (
            <button key={k} onClick={() => setView(k as any)}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
                view === k ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'text-white/35 hover:text-white/60'
              }`}>{l}</button>
          ))}
        </div>
      </div>

      {/* ── FORM ── */}
      {view === 'form' && (
        <div className="space-y-3">
          {/* Score live */}
          {scor && (
            <div className="flex items-center gap-4 p-4 card-green rounded-xl">
              <div className="relative flex-shrink-0">
                <svg width="64" height="64" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="6"/>
                  <circle cx="32" cy="32" r="26" fill="none" stroke={scorColor(scor)} strokeWidth="6"
                    strokeDasharray={`${(scor/100)*163} 163`} strokeLinecap="round"/>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center" style={{ marginTop: 6 }}>
                  <span className="font-fraunces text-xl font-bold" style={{ color: scorColor(scor) }}>{scor}</span>
                </div>
              </div>
              <div>
                <div className="font-semibold text-white/80 text-sm">{scorLabel(scor)}</div>
                <div className="text-xs text-white/40 mt-1">Calculat din datele introduse · Se actualizează live</div>
                {jurnalAzi?.scor_wellness && (
                  <div className="text-xs mt-1" style={{ color: scor > jurnalAzi.scor_wellness ? '#4ade80' : '#f87171' }}>
                    {scor > jurnalAzi.scor_wellness ? '↑' : '↓'} față de ultima salvare ({jurnalAzi.scor_wellness})
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Energie */}
          <div className="card p-4">
            <label className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-3 block">⚡ Nivelul de energie azi</label>
            <div className="grid grid-cols-5 gap-2">
              {ENERGIE_OPT.map(o => (
                <div key={o.val} onClick={() => f('energie', o.val)}
                  className={`text-center p-3 rounded-xl cursor-pointer transition-all ${
                    form.energie === o.val ? 'bg-green-500/12 border border-green-500/35' : 'bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06]'
                  }`}>
                  <div className="text-2xl mb-1">{o.emoji}</div>
                  <div className="text-[10px] text-white/40">{o.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Mood */}
          <div className="card p-4">
            <label className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-3 block">🙂 Dispoziția generală</label>
            <div className="grid grid-cols-5 gap-2">
              {MOOD_OPT.map(o => (
                <div key={o.val} onClick={() => f('mood', o.val)}
                  className={`text-center p-3 rounded-xl cursor-pointer transition-all ${
                    form.mood === o.val ? 'bg-green-500/12 border border-green-500/35' : 'bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06]'
                  }`}>
                  <div className="text-2xl mb-1">{o.emoji}</div>
                  <div className="text-[10px] text-white/40">{o.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Foame */}
          <div className="card p-4">
            <label className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-3 block">🍽️ Nivelul de foame</label>
            <div className="grid grid-cols-3 gap-3">
              {FOAME_OPT.map(o => (
                <div key={o.val} onClick={() => f('foame', o.val)}
                  className={`text-center p-4 rounded-xl cursor-pointer transition-all ${
                    form.foame === o.val ? 'bg-green-500/12 border border-green-500/35' : 'bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06]'
                  }`}>
                  <div className="text-3xl mb-2">{o.emoji}</div>
                  <div className="text-xs text-white/50 font-medium">{o.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Date obiective */}
          <div className="card p-4">
            <label className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-3 block">📊 Date din ceas (opțional — îmbunătățesc scorul)</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'hrv',            label: 'HRV (ms)',           placeholder: 'ex: 42' },
                { key: 'ore_somn',       label: 'Ore somn',           placeholder: 'ex: 7.5' },
                { key: 'calitate_somn',  label: 'Calitate somn 0-100', placeholder: 'ex: 75' },
                { key: 'pasi',           label: 'Pași zilnici',       placeholder: 'ex: 10200' },
                { key: 'stres_garmin',   label: 'Stres Garmin 0-100', placeholder: 'ex: 42' },
                { key: 'calorii',        label: 'Calorii consumate',  placeholder: 'ex: 1820' },
                { key: 'calorii_target', label: 'Target calorii',     placeholder: 'ex: 2100' },
                { key: 'screen_ore',     label: 'Screen time (ore)',  placeholder: 'ex: 4.5' },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-[10px] text-white/35 mb-1 block">{field.label}</label>
                  <input type="number" step="0.1" value={date[field.key as keyof typeof date]}
                    onChange={e => d(field.key, e.target.value)}
                    className="input text-sm" placeholder={field.placeholder} />
                </div>
              ))}
            </div>
          </div>

          {/* Dureri + alte */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-4">
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-2 block">😣 Dureri / disconfort</label>
              <input type="text" value={form.dureri} onChange={e => f('dureri', e.target.value)}
                className="input text-sm" placeholder="ex: durere ușoară genunchi, fără" />
            </div>
            <div className="card p-4">
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-2 block">📝 Altceva relevant</label>
              <input type="text" value={form.alte} onChange={e => f('alte', e.target.value)}
                className="input text-sm" placeholder="ex: stres job, alcool ieri, ceață mentală" />
            </div>
          </div>

          {/* Corelații automate */}
          {corel.length > 0 && (
            <div className="p-4 bg-indigo-500/[0.05] border border-indigo-500/[0.18] rounded-xl">
              <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-2">🔗 Corelații detectate automat</div>
              {corel.map((c, i) => (
                <div key={i} className="flex gap-2 py-1.5">
                  <span className="text-indigo-400 flex-shrink-0 text-xs">→</span>
                  <span className="text-xs text-white/60 leading-relaxed">{c}</span>
                </div>
              ))}
            </div>
          )}

          {eroare && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">⚠️ {eroare}</div>}

          <button onClick={salveaza} disabled={saving || (!form.energie && !form.mood && !form.foame)}
            className="btn-green w-full py-4 text-base">
            {saving ? '⏳ Se salvează...' : salvat ? '✓ Salvat!' : `💾 Salvează jurnalul${scor ? ` · Scor: ${scor}/100` : ''}`}
          </button>
        </div>
      )}

      {/* ── ISTORIC ── */}
      {view === 'istoric' && (
        <div className="space-y-3 fade-in">
          {/* Medie */}
          {istoric.length > 0 && (
            <div className="card p-4 flex items-center gap-4">
              <div className="text-center flex-shrink-0">
                <div className="font-fraunces text-3xl font-bold" style={{ color: scorColor(Math.round(istoric.slice(0, 7).reduce((s: number, j: any) => s + (j.scor_wellness || 0), 0) / Math.min(7, istoric.slice(0, 7).length))) }}>
                  {Math.round(istoric.slice(0, 7).reduce((s: number, j: any) => s + (j.scor_wellness || 0), 0) / Math.min(7, istoric.slice(0, 7).length))}
                </div>
                <div className="text-[10px] text-white/30 uppercase">Medie 7 zile</div>
              </div>
              <div className="flex-1">
                {/* Mini trend */}
                <div className="flex items-end gap-1 h-10">
                  {istoric.slice(0, 14).reverse().map((j: any, i: number) => (
                    <div key={i} title={`${j.data_zi}: ${j.scor_wellness || '?'}/100`}
                      className="flex-1 rounded-t-sm min-w-[10px]"
                      style={{ height: `${((j.scor_wellness || 0)/100)*40}px`, background: scorColor(j.scor_wellness || 0), opacity: 0.6 + (i / 14) * 0.4 }} />
                  ))}
                </div>
                <div className="flex justify-between mt-1 text-[9px] text-white/20">
                  <span>14 zile în urmă</span><span>Azi</span>
                </div>
              </div>
            </div>
          )}

          {/* Lista zile */}
          <div className="space-y-2">
            {istoric.length === 0 ? (
              <div className="text-center py-16 text-white/30">
                <div className="text-4xl mb-3">📓</div>
                <div className="text-sm">Nicio înregistrare încă</div>
                <button onClick={() => setView('form')} className="mt-3 text-green-400 text-sm hover:text-green-300">Completează jurnalul de azi →</button>
              </div>
            ) : (
              istoric.map((j: any) => (
                <div key={j.id} className="card p-4 flex items-center gap-4">
                  <div className="text-center flex-shrink-0 w-12">
                    <div className="font-fraunces text-xl font-bold" style={{ color: j.scor_wellness ? scorColor(j.scor_wellness) : 'rgba(255,255,255,.3)' }}>
                      {j.scor_wellness || '—'}
                    </div>
                    <div className="text-[9px] text-white/25">/100</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white/75">
                      {new Date(j.data_zi + 'T12:00:00').toLocaleDateString('ro-RO', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </div>
                    <div className="flex gap-3 mt-1 text-xs text-white/35">
                      {j.energie && <span>{ENERGIE_OPT[j.energie-1]?.emoji} {j.energie}/5</span>}
                      {j.mood    && <span>{MOOD_OPT[j.mood-1]?.emoji} {j.mood}/5</span>}
                      {j.foame   && <span>{FOAME_OPT.find(f => f.val === j.foame)?.emoji} {j.foame}</span>}
                    </div>
                    {j.alte && <div className="text-[10px] text-white/25 mt-0.5 truncate">{j.alte}</div>}
                  </div>
                  {j.scor_wellness && (
                    <div className="text-xs text-white/30 flex-shrink-0">{scorLabel(j.scor_wellness).split(' ')[0]}</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
