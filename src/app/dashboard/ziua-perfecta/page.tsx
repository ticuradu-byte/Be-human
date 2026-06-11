'use client'
// src/app/dashboard/ziua-perfecta/page.tsx
// Generator "Ziua Perfectă" — program orar personalizat bazat pe HRV, vreme, energie

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase'

const OPT_VREME = [
  { val: 'insorit', icon: '☀️', label: 'Însorit' },
  { val: 'noros',   icon: '⛅', label: 'Noros' },
  { val: 'ploios',  icon: '🌧️', label: 'Ploios' },
  { val: 'frig',    icon: '🥶', label: 'Frig/Zăpadă' },
]

const OPT_ZI = [
  { val: 'lucru',    icon: '💼', label: 'Zi de lucru' },
  { val: 'weekend',  icon: '🎉', label: 'Weekend' },
  { val: 'liber',    icon: '🌴', label: 'Zi liberă' },
  { val: 'concediu', icon: '✈️', label: 'Concediu' },
]

const OPT_ENERGIE = [
  { val: '1', icon: '😫', label: 'Epuizat' },
  { val: '2', icon: '😴', label: 'Obosit' },
  { val: '3', icon: '😐', label: 'Normal' },
  { val: '4', icon: '😊', label: 'Bine' },
  { val: '5', icon: '⚡', label: 'Super!' },
]

interface Activitate {
  ora: string
  icon: string
  titlu: string
  descriere: string
  durata: string
  categorie: 'sport' | 'nutritie' | 'social' | 'munca' | 'relaxare' | 'somn' | 'hobby'
  outdoor: boolean
  prioritate: 'must' | 'recomandat' | 'optional'
}

const CAT_COLORS: Record<string, string> = {
  sport:    '#4ade80',
  nutritie: '#facc15',
  social:   '#f472b6',
  munca:    '#60a5fa',
  relaxare: '#a78bfa',
  somn:     '#38bdf8',
  hobby:    '#fb923c',
}

export default function ZiuaPerfectaPage() {
  const supabase = createBrowserClient()
  const [hrv, setHrv]         = useState('')
  const [energie, setEnergie] = useState('3')
  const [vreme, setVreme]     = useState('insorit')
  const [tipZi, setTipZi]     = useState('lucru')
  const [obiective, setObiective] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [program, setProgram] = useState<any>(null)
  const [util, setUtil]       = useState<any>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('utilizatori').select('*').eq('id', user.id).single()
      if (data) {
        setUtil(data)
        if (data.profil_complet?.obiective) setObiective(data.profil_complet.obiective)
      }
      // Trage HRV de ieri din wearables
      const ieri = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
      const { data: wData } = await supabase.from('wearable_date_zilnice')
        .select('date_norm').eq('user_id', user.id).eq('data_zi', ieri).limit(1).single()
      if (wData?.date_norm?.hrv_mediu_noapte) setHrv(String(wData.date_norm.hrv_mediu_noapte))
      if (wData?.date_norm?.hrv_last_night) setHrv(String(wData.date_norm.hrv_last_night))
    }
    load()
  }, [])

  const genereaza = async () => {
    setLoading(true)
    try {
      const profil = util?.profil_complet
      const prompt = `Ești be-human — generezi programul PERFECT pentru ziua de azi.

DATE UTILIZATOR:
- HRV azi: ${hrv || 'necunoscut'}ms (${parseInt(hrv) >= 50 ? 'excelent' : parseInt(hrv) >= 35 ? 'bun' : parseInt(hrv) >= 20 ? 'moderat — zi ușoară' : 'scăzut — recuperare'})
- Energie auto-raportată: ${energie}/5
- Vreme: ${vreme}
- Tip zi: ${tipZi}
- Profil: ${profil ? `${profil.prenume}, ${new Date().getFullYear() - new Date(profil.data_nastere || '1990').getFullYear()} ani, ${profil.activitate || 'activ'}` : 'necunoscut'}
- Obiective: ${obiective.join(', ') || 'sănătate generală'}
- Condiții medicale: ${profil?.conditii_medicale?.join(', ') || 'niciuna'}

PRINCIPII OBLIGATORII:
- Sport în aer liber prioritizat față de sală
- Activități sociale incluse când posibil  
- Micro-acțiuni (sub 15 min) ca prim pas
- Dacă HRV < 30 sau energie ≤ 2: zi de recuperare, fără HIIT
- Dacă HRV > 50 și energie ≥ 4: zi de performanță, antrenament intens posibil
- Mâncare reală, nu suplimente ca soluție primară
- Hobby și timp pentru plăcere sunt OBLIGATORII în program

Returnează DOAR JSON valid:
{
  "titlu_zi": "titlu inspirational scurt",
  "rezumat": "2 fraze despre ce tip de zi e azi și de ce",
  "scor_potential": număr 1-100,
  "tip_zi": "recuperare|normal|performanta|social|creativ",
  "activitati": [
    {
      "ora": "07:00",
      "icon": "emoji",
      "titlu": "titlu scurt",
      "descriere": "instrucțiune concretă, specifică",
      "durata": "15 min",
      "categorie": "sport|nutritie|social|munca|relaxare|somn|hobby",
      "outdoor": true/false,
      "prioritate": "must|recomandat|optional"
    }
  ],
  "focus_principal": "singurul lucru cel mai important azi",
  "evita_azi": ["max 3 lucruri de evitat azi bazate pe date"],
  "citat_motivational": "citat scurt și relevant, nu clișeu",
  "micro_actiune_acum": "ceva ce poți face în următoarele 5 minute"
}`

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      const data = await res.json()
      const raw = data.content?.[0]?.text || ''
      setProgram(JSON.parse(raw.replace(/```json|```/g, '').trim()))
    } catch { alert('Eroare generare program.') }
    finally { setLoading(false) }
  }

  const getCatColor = (cat: string) => CAT_COLORS[cat] || '#4ade80'

  return (
    <div className="fade-in space-y-4 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-white mb-1">☀️ Ziua Perfectă</h1>
        <p className="text-white/40 text-sm">Program personalizat orar · Bazat pe HRV, energie și vreme</p>
      </div>

      {!program ? (
        <div className="space-y-4">
          {/* HRV */}
          <div className="card p-5">
            <div className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-3">💓 HRV de azi</div>
            <div className="flex items-center gap-3">
              <input type="number" value={hrv} onChange={e => setHrv(e.target.value)}
                className="input text-sm flex-1" placeholder="ex: 42 ms (din Oura/Garmin)" />
              {hrv && (
                <div className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{
                  background: parseInt(hrv) >= 50 ? 'rgba(74,222,128,.1)' : parseInt(hrv) >= 35 ? 'rgba(250,204,21,.1)' : 'rgba(248,113,113,.1)',
                  color: parseInt(hrv) >= 50 ? '#4ade80' : parseInt(hrv) >= 35 ? '#facc15' : '#f87171',
                  border: `1px solid ${parseInt(hrv) >= 50 ? 'rgba(74,222,128,.25)' : parseInt(hrv) >= 35 ? 'rgba(250,204,21,.2)' : 'rgba(248,113,113,.2)'}`,
                }}>
                  {parseInt(hrv) >= 50 ? '🚀 Zi de performanță' : parseInt(hrv) >= 35 ? '✅ Zi normală' : '😴 Zi de recuperare'}
                </div>
              )}
            </div>
          </div>

          {/* Energie */}
          <div className="card p-5">
            <div className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-3">⚡ Cum te simți acum?</div>
            <div className="flex gap-2">
              {OPT_ENERGIE.map(o => (
                <div key={o.val} onClick={() => setEnergie(o.val)}
                  className={`flex-1 py-3 rounded-xl border text-center cursor-pointer transition-all ${
                    energie === o.val ? 'bg-green-500/10 border-green-500/25 text-green-400' : 'bg-white/[0.02] border-white/[0.07] text-white/50'
                  }`}>
                  <div className="text-xl mb-1">{o.icon}</div>
                  <div className="text-[10px]">{o.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Vreme + Tip zi */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-4">
              <div className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-3">🌤️ Vreme afară</div>
              <div className="grid grid-cols-2 gap-2">
                {OPT_VREME.map(o => (
                  <div key={o.val} onClick={() => setVreme(o.val)}
                    className={`py-2.5 rounded-xl border text-center text-xs cursor-pointer transition-all ${
                      vreme === o.val ? 'bg-blue-500/10 border-blue-500/25 text-blue-400' : 'bg-white/[0.02] border-white/[0.07] text-white/50'
                    }`}>
                    <div className="text-lg mb-0.5">{o.icon}</div>
                    {o.label}
                  </div>
                ))}
              </div>
            </div>
            <div className="card p-4">
              <div className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-3">📅 Tip de zi</div>
              <div className="grid grid-cols-2 gap-2">
                {OPT_ZI.map(o => (
                  <div key={o.val} onClick={() => setTipZi(o.val)}
                    className={`py-2.5 rounded-xl border text-center text-xs cursor-pointer transition-all ${
                      tipZi === o.val ? 'bg-purple-500/10 border-purple-500/25 text-purple-400' : 'bg-white/[0.02] border-white/[0.07] text-white/50'
                    }`}>
                    <div className="text-lg mb-0.5">{o.icon}</div>
                    {o.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button onClick={genereaza} disabled={loading} className="btn-green w-full py-4 text-base">
            {loading ? '⏳ Generez programul tău...' : '☀️ Generează Ziua Perfectă'}
          </button>
        </div>
      ) : (
        <div className="space-y-4 fade-in">
          <button onClick={() => setProgram(null)} className="text-white/40 text-sm hover:text-white/60">← Regenerează</button>

          {/* Hero */}
          <div className="card-green p-6">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
              <div>
                <div className="font-fraunces text-xl font-bold text-white mb-1">{program.titlu_zi}</div>
                <p className="text-sm text-white/60 leading-relaxed">{program.rezumat}</p>
              </div>
              <div className="text-center flex-shrink-0">
                <div className="font-fraunces text-3xl font-bold text-green-400">{program.scor_potential}</div>
                <div className="text-xs text-white/35">potențial zi</div>
              </div>
            </div>

            {/* Micro-actiune acum */}
            <div className="bg-green-500/[0.1] border border-green-500/[0.25] rounded-xl p-3">
              <div className="text-[10px] font-bold text-green-400 uppercase tracking-wider mb-1">⚡ Fă ACUM — 5 minute</div>
              <div className="text-sm text-white/85 font-medium">{program.micro_actiune_acum}</div>
            </div>
          </div>

          {/* Focus + Evita */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-yellow-500/[0.06] border border-yellow-500/[0.18] rounded-xl p-4">
              <div className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider mb-2">🎯 Focus principal</div>
              <p className="text-sm text-white/70 leading-relaxed">{program.focus_principal}</p>
            </div>
            <div className="bg-red-500/[0.06] border border-red-500/[0.15] rounded-xl p-4">
              <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-2">🚫 Evită azi</div>
              {program.evita_azi?.map((e: string, i: number) => (
                <div key={i} className="text-xs text-white/60 mb-1.5 flex gap-1.5">
                  <span className="text-red-400 flex-shrink-0">×</span>{e}
                </div>
              ))}
            </div>
          </div>

          {/* Program orar */}
          <div className="card p-5">
            <div className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-4">🕐 Programul tău de azi</div>
            <div className="space-y-3">
              {program.activitati?.map((act: Activitate, i: number) => {
                const color = getCatColor(act.categorie)
                const isMust = act.prioritate === 'must'
                return (
                  <div key={i} className="flex gap-4 py-3 border-b border-white/[0.04]">
                    <div className="flex-shrink-0 text-right w-14">
                      <div className="text-xs font-bold text-white/50">{act.ora}</div>
                      <div className="text-[10px] text-white/25">{act.durata}</div>
                    </div>
                    <div className="w-0.5 rounded-full flex-shrink-0" style={{ background: `${color}40` }}/>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-lg flex-shrink-0">{act.icon}</span>
                        <span className="text-sm font-semibold text-white/85">{act.titlu}</span>
                        {act.outdoor && <span className="text-[10px] text-green-400/70 bg-green-500/[0.08] px-1.5 py-0.5 rounded-full">🌿 afară</span>}
                        {isMust && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ color, background: `${color}15` }}>obligatoriu</span>}
                      </div>
                      <p className="text-xs text-white/55 leading-relaxed">{act.descriere}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Citat */}
          <div className="text-center p-5 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
            <div className="text-lg text-white/60 italic leading-relaxed">"{program.citat_motivational}"</div>
          </div>

          {/* Legenda categorii */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(CAT_COLORS).map(([cat, color]) => (
              <span key={cat} className="text-[10px] px-2 py-1 rounded-full" style={{ background: `${color}10`, color, border: `1px solid ${color}25` }}>
                {cat}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
