'use client'
// src/app/dashboard/challenge/page.tsx
// Challenge Social Săptămânal — provocări bazate pe știință

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase'

const CHALLENGES_PREDEFINITE = [
  {
    id: 'sport_aer_liber',
    icon: '🌿',
    titlu: 'Sport în aer liber 5 zile',
    descriere: 'Minimum 30 min activitate fizică în aer liber, 5 zile consecutive',
    studiu: 'Pretty et al., 2011: 5 min în natură → mood +18%, self-esteem +18%',
    categorie: 'sport',
    zile: 7,
    dificultate: 'mediu',
    impact: 'Energie +25%, cortizol -16%, NK cells +50%',
  },
  {
    id: 'masa_prieteni',
    icon: '👥',
    titlu: 'O masă cu prietenii',
    descriere: 'Mănâncă cel puțin o masă cu prieteni sau familie în afara casei',
    studiu: 'Holt-Lunstad, 2010: relații sociale = mortalitate -50%',
    categorie: 'social',
    zile: 7,
    dificultate: 'usor',
    impact: 'Fericire +30%, longevitate crescută',
  },
  {
    id: 'hobby_nou',
    icon: '🎨',
    titlu: 'Hobby 2h în această săptămână',
    descriere: 'Alocă 2h pentru un hobby care îți place sau încearcă ceva nou',
    studiu: 'Csikszentmihalyi: Flow state = dopamină + endorfine + norepinefrină simultan',
    categorie: 'hobby',
    zile: 7,
    dificultate: 'usor',
    impact: 'Stres -30%, creativitate crescută, satisfacție viață',
  },
  {
    id: 'fara_alcool',
    icon: '🚫',
    titlu: '7 zile fără alcool',
    descriere: 'O săptămână completă fără alcool',
    studiu: 'HRV crește cu 15ms persistent după eliminarea alcoolului',
    categorie: 'nutritie',
    zile: 7,
    dificultate: 'greu',
    impact: 'HRV +15ms, somn +45min deep, testosteron crescut',
  },
  {
    id: 'natura_zilnic',
    icon: '🌲',
    titlu: 'Natură 30 min zilnic',
    descriere: 'Ieși în natură (parc, pădure, malul apei) cel puțin 30 min în fiecare zi',
    studiu: 'Shinrin-yoku: cortizol -16%, tensiune -6mmHg, NK cells +50%',
    categorie: 'sport',
    zile: 7,
    dificultate: 'mediu',
    impact: 'Imunitate +50%, stres -16%, tensiune scăzută',
  },
  {
    id: 'suna_pe_cineva',
    icon: '📞',
    titlu: 'Sună 1 prieten/zi 7 zile',
    descriere: 'Un apel telefonic real (nu mesaj) cu un prieten sau rudă zilnic',
    studiu: 'Harvard Study 85 ani: calitatea relațiilor = predictor #1 longevitate',
    categorie: 'social',
    zile: 7,
    dificultate: 'usor',
    impact: 'Senzație de conectare, reduce singurătatea, oxitocina crescută',
  },
  {
    id: 'fara_ecrane_dimineata',
    icon: '📵',
    titlu: 'Fără ecrane dimineața 1h',
    descriere: 'Prima oră după trezire: fără telefon, laptop sau TV. Afară, mișcare, mic dejun real.',
    studiu: 'Huberman Lab: lumina dimineții + fără ecrane = cortizol optim + ritm circadian',
    categorie: 'mental',
    zile: 7,
    dificultate: 'greu',
    impact: 'Cortizol optim, energie mai susținută, somn mai bun',
  },
  {
    id: 'proteina_dimineata',
    icon: '🥚',
    titlu: '30g proteine la micul dejun',
    descriere: 'Micul dejun cu minimum 30g proteine în fiecare zi (ouă, iaurt grecesc, carne)',
    studiu: 'Morton et al., BJSM 2018: proteine dimineața → apetit controlat + energie uniformă',
    categorie: 'nutritie',
    zile: 7,
    dificultate: 'usor',
    impact: 'Poftă de dulce redusă, masă musculară menținută, energie uniformă',
  },
]

const DIFICULTATE_CONFIG: Record<string, { color: string; label: string }> = {
  usor:  { color: '#4ade80', label: 'Ușor' },
  mediu: { color: '#facc15', label: 'Mediu' },
  greu:  { color: '#f87171', label: 'Greu' },
}

const CAT_CONFIG: Record<string, { color: string; icon: string }> = {
  sport:    { color: '#4ade80', icon: '🏃' },
  social:   { color: '#f472b6', icon: '👥' },
  hobby:    { color: '#fb923c', icon: '🎨' },
  nutritie: { color: '#facc15', icon: '🥗' },
  mental:   { color: '#a78bfa', icon: '🧠' },
}

export default function ChallengePage() {
  const supabase = createBrowserClient()
  const [challengeActiv, setChallengeActiv] = useState<any>(null)
  const [checkins, setCheckins]             = useState<string[]>([])
  const [loading, setLoading]               = useState(false)
  const [userId, setUserId]                 = useState('')
  const [catFiltru, setCatFiltru]           = useState<string | null>(null)
  const [completat, setCompletat]           = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      // Trage challenge activ și check-ins din Supabase
      const { data } = await supabase.from('jurnal_zilnic')
        .select('data_zi, challenge_id, challenge_checkin')
        .eq('user_id', user.id)
        .gte('data_zi', new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10))
        .not('challenge_id', 'is', null)
      if (data?.length) {
        const cId = data[0].challenge_id
        const ch = CHALLENGES_PREDEFINITE.find(c => c.id === cId)
        if (ch) { setChallengeActiv(ch); setCheckins(data.map(d => d.data_zi)) }
      }
    }
    load()
  }, [])

  const incepeChallenge = async (ch: any) => {
    setChallengeActiv(ch)
    setCheckins([])
    // Salvează în Supabase
    const azi = new Date().toISOString().slice(0, 10)
    await supabase.from('jurnal_zilnic').upsert({
      user_id: userId, data_zi: azi,
      challenge_id: ch.id, challenge_checkin: true,
    }, { onConflict: 'user_id,data_zi' })
    setCheckins([azi])
  }

  const checkin = async () => {
    setLoading(true)
    const azi = new Date().toISOString().slice(0, 10)
    if (checkins.includes(azi)) { setLoading(false); return }
    await supabase.from('jurnal_zilnic').upsert({
      user_id: userId, data_zi: azi,
      challenge_id: challengeActiv.id, challenge_checkin: true,
    }, { onConflict: 'user_id,data_zi' })
    const nouCheckins = [...checkins, azi]
    setCheckins(nouCheckins)
    if (nouCheckins.length >= challengeActiv.zile) setCompletat(true)
    setLoading(false)
  }

  const azi = new Date().toISOString().slice(0, 10)
  const checkinAziDone = checkins.includes(azi)
  const challengesFiltrate = catFiltru
    ? CHALLENGES_PREDEFINITE.filter(c => c.categorie === catFiltru)
    : CHALLENGES_PREDEFINITE

  if (completat) return (
    <div className="fade-in text-center py-16 space-y-6 max-w-md mx-auto">
      <div className="text-6xl">🏆</div>
      <div className="font-fraunces text-2xl font-bold text-green-400">Challenge Completat!</div>
      <p className="text-white/60 leading-relaxed">
        Ai completat <strong className="text-white/80">{challengeActiv.titlu}</strong> — {challengeActiv.zile} zile consecutive!
      </p>
      <div className="p-4 bg-green-500/[0.08] border border-green-500/[0.2] rounded-2xl">
        <div className="text-sm font-semibold text-green-400 mb-2">🎯 Impact estimat:</div>
        <div className="text-sm text-white/70">{challengeActiv.impact}</div>
      </div>
      <button onClick={() => { setChallengeActiv(null); setCheckins([]); setCompletat(false) }}
        className="btn-green py-3 px-8">🔄 Alege alt challenge</button>
    </div>
  )

  return (
    <div className="fade-in space-y-4 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-white mb-1">🏆 Challenge Săptămânal</h1>
        <p className="text-white/40 text-sm">Provocări bazate pe știință · Check-in zilnic · Impact real</p>
      </div>

      {challengeActiv ? (
        // VIEW CHALLENGE ACTIV
        <div className="space-y-4">
          <div className="card-green p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="text-4xl flex-shrink-0">{challengeActiv.icon}</div>
              <div>
                <div className="font-fraunces text-lg font-bold text-white mb-1">{challengeActiv.titlu}</div>
                <p className="text-sm text-white/60 leading-relaxed">{challengeActiv.descriere}</p>
                <div className="text-xs text-indigo-400/60 italic mt-2">📚 {challengeActiv.studiu}</div>
              </div>
            </div>

            {/* Progress */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/40">Progres</span>
                <span className="text-sm font-bold text-green-400">{checkins.length}/{challengeActiv.zile} zile</span>
              </div>
              <div className="flex gap-1.5">
                {Array.from({ length: challengeActiv.zile }).map((_, i) => (
                  <div key={i} className="flex-1 h-3 rounded-full" style={{
                    background: i < checkins.length ? '#4ade80' : 'rgba(255,255,255,.08)',
                  }}/>
                ))}
              </div>
            </div>

            {/* Check-in */}
            {checkinAziDone ? (
              <div className="text-center py-3 bg-green-500/[0.08] border border-green-500/[0.2] rounded-xl">
                <div className="text-green-400 font-semibold">✓ Check-in de azi făcut!</div>
                <div className="text-xs text-white/35 mt-1">Revino mâine pentru continuare</div>
              </div>
            ) : (
              <button onClick={checkin} disabled={loading}
                className="btn-green w-full py-3 text-base">
                {loading ? '⏳' : '✅ Check-in azi — am făcut challengeul!'}
              </button>
            )}
          </div>

          {/* Impact */}
          <div className="bg-yellow-500/[0.06] border border-yellow-500/[0.18] rounded-xl p-4">
            <div className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider mb-2">🎯 Impact la completare</div>
            <p className="text-sm text-white/65">{challengeActiv.impact}</p>
          </div>

          <button onClick={() => { setChallengeActiv(null); setCheckins([]) }}
            className="btn-ghost w-full text-sm py-2.5">Abandonează și alege alt challenge</button>
        </div>
      ) : (
        // VIEW SELECTARE CHALLENGE
        <div className="space-y-4">
          {/* Filtre */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => setCatFiltru(null)}
              className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-lg border transition-all ${!catFiltru ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'text-white/35 border-white/10'}`}>
              Toate
            </button>
            {Object.entries(CAT_CONFIG).map(([cat, cfg]) => (
              <button key={cat} onClick={() => setCatFiltru(catFiltru === cat ? null : cat)}
                className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-lg border transition-all ${
                  catFiltru === cat ? 'text-white border-white/25 bg-white/[0.08]' : 'text-white/35 border-white/10'
                }`}>
                {cfg.icon} {cat}
              </button>
            ))}
          </div>

          {challengesFiltrate.map(ch => {
            const diff = DIFICULTATE_CONFIG[ch.dificultate]
            const catCfg = CAT_CONFIG[ch.categorie]
            return (
              <div key={ch.id} className="card p-5 hover:bg-white/[0.04] transition-all cursor-pointer"
                onClick={() => incepeChallenge(ch)}>
                <div className="flex items-start gap-4">
                  <div className="text-3xl flex-shrink-0">{ch.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-semibold text-white/85">{ch.titlu}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: diff.color, background: `${diff.color}15` }}>
                        {diff.label}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ color: catCfg.color, background: `${catCfg.color}10` }}>
                        {ch.zile} zile
                      </span>
                    </div>
                    <p className="text-xs text-white/55 leading-relaxed mb-2">{ch.descriere}</p>
                    <div className="text-xs text-green-400/60">🎯 {ch.impact}</div>
                  </div>
                  <div className="text-white/25 flex-shrink-0">→</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
