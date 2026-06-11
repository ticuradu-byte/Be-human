'use client'
// src/app/dashboard/roata-vietii/page.tsx
// Roata Vieții — scor echilibru 8 dimensiuni + recomandare pentru dimensiunea neglijată

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase'

const DIMENSIUNI = [
  { id: 'corp',      icon: '💪', label: 'Corp & Sport',       desc: 'Exercițiu, greutate, energie fizică', color: '#4ade80' },
  { id: 'minte',     icon: '🧠', label: 'Minte & Stres',      desc: 'Stres, anxietate, claritate mentală', color: '#a78bfa' },
  { id: 'nutritie',  icon: '🥗', label: 'Alimentație',        desc: 'Calitatea mâncării, hidratare', color: '#facc15' },
  { id: 'relatii',   icon: '👥', label: 'Relații Sociale',    desc: 'Prietenii, familie, comunitate', color: '#f472b6' },
  { id: 'sex',       icon: '🌹', label: 'Sex & Intimitate',   desc: 'Viața sexuală, conexiunea cu partenerul', color: '#fb923c' },
  { id: 'hobby',     icon: '🎨', label: 'Hobby & Creativitate', desc: 'Activități creative, timp liber de calitate', color: '#38bdf8' },
  { id: 'natura',    icon: '🌿', label: 'Natură & Aer Liber', desc: 'Timp petrecut în aer liber, natură', color: '#86efac' },
  { id: 'scop',      icon: '🎯', label: 'Scop & Sens',        desc: 'Sens în viață, obiective, împlinire', color: '#fbbf24' },
]

const RECOMANDARI: Record<string, any> = {
  corp: {
    urgent: 'Ieși la o plimbare de 20 min ACUM. Afară, nu pe bandă.',
    saptamana: 'Planifică 3 sesiuni de sport în aer liber. Nu sală — parc, traseu, bicicletă.',
    studiu: 'Blair et al., JAMA: fiecare MET VO2max = mortalitate -13%',
  },
  minte: {
    urgent: '5 min respirație 4-7-8. Sau 10 min afară fără telefon.',
    saptamana: 'Meditație 10 min/zi sau jurnal de recunoștință seara (3 lucruri bune).',
    studiu: 'Lazar et al., NeuroReport: 10 min/zi meditație = modificări structurale creier',
  },
  nutritie: {
    urgent: 'Bea un pahar de apă acum. Mâncarea de la prânz să conțină cel puțin o legumă colorată.',
    saptamana: 'Adaugă pește gras 2x această săptămână. Elimină un ultra-procesat din rutină.',
    studiu: 'PREDIMED: dieta mediteraneană reduce boli CV cu 30%',
  },
  relatii: {
    urgent: 'Trimite un mesaj vocal (nu text) unui prieten pe care nu l-ai contactat de mult.',
    saptamana: 'Organizează o masă sau cafea cu 2-3 prieteni. Fără scuze, fă-o.',
    studiu: 'Harvard Study 85 ani: relațiile = predictor #1 longevitate și fericire',
  },
  sex: {
    urgent: 'Discuție deschisă cu partenerul despre ce vrei și ce simți. Fără judecată.',
    saptamana: 'Planifică o seară romantică. Deconectare de la ecrane, prezență totală.',
    studiu: 'Davey Smith et al., BMJ: 2 orgasme/săpt = mortalitate -50%',
  },
  hobby: {
    urgent: 'Alocă 30 min azi pentru ceva care îți place cu adevărat. Nu productiv — plăcut.',
    saptamana: '2h hobby autentic această săptămână. Sau încearcă ceva complet nou.',
    studiu: 'Csikszentmihalyi: Flow state = cel mai înalt nivel de satisfacție subiectivă',
  },
  natura: {
    urgent: 'Ieși afară 10 min acum. Parc, curte, balcon cu plante — orice natură.',
    saptamana: 'O excursie în natură în weekend (pădure, munte, lac). Minimum 2h.',
    studiu: 'Shinrin-yoku: 2h pădure = cortizol -16%, NK cells +50%, tensiune scăzută',
  },
  scop: {
    urgent: 'Scrie 3 lucruri pentru care ești recunoscător azi. Și 1 lucru mic dar semnificativ de făcut.',
    saptamana: 'Reflectare: ce activitate din ultimele luni te-a făcut să te simți cel mai împlinit?',
    studiu: 'Okun et al., Health Psychology: voluntariatul reduce mortalitatea cu 22%',
  },
}

export default function RoataVietiiPage() {
  const supabase = createBrowserClient()
  const [scoruri, setScoruri] = useState<Record<string, number>>(
    Object.fromEntries(DIMENSIUNI.map(d => [d.id, 5]))
  )
  const [salvat, setSalvat]   = useState(false)
  const [userId, setUserId]   = useState('')
  const [istoric, setIstoric] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase.from('jurnal_zilnic')
        .select('data_zi, roata_vietii').eq('user_id', user.id)
        .not('roata_vietii', 'is', null)
        .order('data_zi', { ascending: false }).limit(4)
      if (data?.length) {
        setIstoric(data)
        if (data[0]?.roata_vietii) setScoruri(data[0].roata_vietii)
      }
    }
    load()
  }, [])

  const salveaza = async () => {
    const azi = new Date().toISOString().slice(0, 10)
    await supabase.from('jurnal_zilnic').upsert({
      user_id: userId, data_zi: azi, roata_vietii: scoruri,
    }, { onConflict: 'user_id,data_zi' })
    setSalvat(true)
    setTimeout(() => setSalvat(false), 2000)
  }

  const scorMediu = Math.round(Object.values(scoruri).reduce((s, v) => s + v, 0) / DIMENSIUNI.length * 10)
  const dimNeglijata = DIMENSIUNI.reduce((min, d) => scoruri[d.id] < scoruri[min.id] ? d : min)
  const dimCeaMaiBuna = DIMENSIUNI.reduce((max, d) => scoruri[d.id] > scoruri[max.id] ? d : max)

  return (
    <div className="fade-in space-y-4 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-white mb-1">⚖️ Roata Vieții</h1>
        <p className="text-white/40 text-sm">Evaluare echilibru 8 dimensiuni · Săptămânal</p>
      </div>

      {/* Scor general */}
      <div className="card-green p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="font-fraunces text-3xl font-bold text-green-400">{scorMediu}/100</div>
          <div className="text-sm text-white/50">Echilibru general</div>
        </div>
        <div className="h-2 bg-white/[0.08] rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-green-400 transition-all" style={{ width: `${scorMediu}%` }}/>
        </div>
      </div>

      {/* Sliders */}
      <div className="card p-5 space-y-5">
        <div className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Evaluează fiecare dimensiune (1-10)</div>
        {DIMENSIUNI.map(d => (
          <div key={d.id}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{d.icon}</span>
                <span className="text-sm font-medium text-white/80">{d.label}</span>
              </div>
              <span className="text-sm font-bold w-6 text-right" style={{ color: d.color }}>{scoruri[d.id]}</span>
            </div>
            <input type="range" min="1" max="10" value={scoruri[d.id]}
              onChange={e => setScoruri(p => ({ ...p, [d.id]: parseInt(e.target.value) }))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{ accentColor: d.color, background: `linear-gradient(to right, ${d.color} ${(scoruri[d.id]-1)/9*100}%, rgba(255,255,255,.1) ${(scoruri[d.id]-1)/9*100}%)` }}
            />
            <div className="text-[10px] text-white/25 mt-1">{d.desc}</div>
          </div>
        ))}
      </div>

      {/* Vizualizare bare */}
      <div className="card p-5">
        <div className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-4">📊 Overview</div>
        <div className="flex items-end gap-2 h-24">
          {DIMENSIUNI.map(d => (
            <div key={d.id} className="flex-1 flex flex-col items-center gap-1">
              <div className="text-[10px] font-bold" style={{ color: d.color }}>{scoruri[d.id]}</div>
              <div className="w-full rounded-t-sm transition-all" style={{
                height: `${(scoruri[d.id]/10)*80}px`,
                background: d.color,
                opacity: 0.7,
                minHeight: 4,
              }}/>
              <div className="text-[8px] text-white/30 text-center leading-tight">{d.icon}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-red-500/[0.06] border border-red-500/[0.15] rounded-xl p-4">
          <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-2">📉 Cel mai neglijat</div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{dimNeglijata.icon}</span>
            <span className="text-sm font-semibold text-white/80">{dimNeglijata.label}</span>
            <span className="text-sm font-bold ml-auto" style={{ color: dimNeglijata.color }}>{scoruri[dimNeglijata.id]}/10</span>
          </div>
          <div className="text-xs text-white/55 leading-relaxed mb-2">{RECOMANDARI[dimNeglijata.id].urgent}</div>
          <div className="text-[10px] text-indigo-400/60 italic">📚 {RECOMANDARI[dimNeglijata.id].studiu}</div>
        </div>
        <div className="bg-green-500/[0.06] border border-green-500/[0.15] rounded-xl p-4">
          <div className="text-[10px] font-bold text-green-400 uppercase tracking-wider mb-2">📈 Punctul forte</div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{dimCeaMaiBuna.icon}</span>
            <span className="text-sm font-semibold text-white/80">{dimCeaMaiBuna.label}</span>
            <span className="text-sm font-bold ml-auto" style={{ color: dimCeaMaiBuna.color }}>{scoruri[dimCeaMaiBuna.id]}/10</span>
          </div>
          <p className="text-xs text-white/55">Continuă să menții și să construiești pe această bază.</p>
        </div>
      </div>

      {/* Focus saptamana */}
      <div className="bg-yellow-500/[0.06] border border-yellow-500/[0.18] rounded-xl p-4">
        <div className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider mb-2">
          🎯 Focus săptămâna aceasta: {dimNeglijata.label}
        </div>
        <p className="text-sm text-white/70 leading-relaxed">{RECOMANDARI[dimNeglijata.id].saptamana}</p>
      </div>

      <button onClick={salveaza} className="btn-green w-full py-3 text-sm">
        {salvat ? '✓ Salvat!' : '💾 Salvează evaluarea săptămânii'}
      </button>

      <div className="text-xs text-white/25 text-center">Completează săptămânal pentru a vedea evoluția în timp</div>
    </div>
  )
}
