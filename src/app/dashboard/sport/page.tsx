'use client'
// src/app/dashboard/sport/page.tsx
// Program sport săptămânal personalizat — cardio + forță + recuperare

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase'

interface Exercitiu {
  nume: string
  serii?: number
  repetari?: string
  durata?: string
  intensitate?: string
  pauza?: string
  nota?: string
}

interface AntrenamentZi {
  zi: string
  ziScurt: string
  tip: 'forta' | 'cardio' | 'mixt' | 'recuperare' | 'activ'
  titlu: string
  durata: string
  calorii: number
  dificultate: 1 | 2 | 3
  obiectivZi: string
  incalzire: Exercitiu[]
  antrenament: Exercitiu[]
  racire: Exercitiu[]
  sfat: string
  echipament: string[]
}

function genereazaSport(profil: any): AntrenamentZi[] {
  const activitate = profil?.activitate || 'moderat'
  const obiective = profil?.obiective || []
  const greutate = parseFloat(profil?.greutate_kg || profil?.greutate || '80')
  const conditii = profil?.conditii_medicale || profil?.conditii || []

  const vreaSlabire = obiective.includes('slabire')
  const vreaMasa = obiective.includes('masa_musculara')
  const vreaPerformanta = obiective.includes('performanta')
  const eIncepator = activitate === 'sedentar' || activitate === 'usor'
  const areHTA = conditii.some((c: string) => c.toLowerCase().includes('hipertensiune'))
  const inaltimeSport = parseFloat(profil?.inaltime_cm || profil?.inaltime || '175')
  const bmiSport = greutate / ((inaltimeSport / 100) ** 2)
  const eSupraponderal = bmiSport >= 30
  const areProblemeArticulare = conditii.some((c: string) => c.toLowerCase().includes('artr'))
  const evitaImpact = eSupraponderal || areProblemeArticulare

  // Intensitate adaptată
  const intensitateCardio = areHTA ? 'moderată (60-70% FC max)' : eIncepator ? 'ușoară-moderată (65-75% FC max)' : 'moderată-ridicată (70-85% FC max)'
  const caloriiForta = Math.round(greutate * 5.5)
  const caloriiCardio = Math.round(greutate * 7)

  return [
    {
      zi: 'Luni', ziScurt: 'Lu', tip: 'forta', dificultate: 2,
      titlu: '💪 Forță — Upper Body (Spate + Bicepși)',
      durata: eIncepator ? '40 min' : '55 min',
      calorii: caloriiForta,
      obiectivZi: 'Construiești masă musculară în zona spatelui și brațelor. Exercițiile de pulling echilibrează postura și combat sedentarismul.',
      sfat: areHTA ? 'Evită exercițiile cu capul în jos și Valsalva. Respiră constant.' : 'Concentrează-te pe mișcarea negativă (coborâre lentă 3-4 secunde) pentru stimul muscular maxim.',
      echipament: ['Haltere/gantere', 'Bară tracțiuni (optional)', 'Bandă elastică'],
      incalzire: [
        { nume: 'Rotații umeri', durata: '30 sec', nota: 'Înainte și înapoi' },
        { nume: 'Rotații gât ușoare', durata: '20 sec' },
        { nume: 'Jumping jacks ușori', durata: '60 sec' },
        { nume: 'Arm circles', durata: '30 sec' },
      ],
      antrenament: eIncepator ? [
        { nume: 'Tracțiuni asistate / Lat pulldown', serii: 3, repetari: '10-12', pauza: '90 sec', nota: 'Controlat, coboară lent' },
        { nume: 'Vâslit cu gantera', serii: 3, repetari: '12 per braț', pauza: '60 sec' },
        { nume: 'Bicep curl cu gantere', serii: 3, repetari: '12-15', pauza: '60 sec' },
        { nume: 'Facepull bandă', serii: 3, repetari: '15', pauza: '45 sec', nota: 'Excelent pentru postura' },
        { nume: 'Plancă', serii: 3, durata: '30 sec', pauza: '45 sec' },
      ] : [
        { nume: 'Tracțiuni / Lat pulldown', serii: 4, repetari: '8-10', pauza: '90 sec', nota: 'Greutate progresivă' },
        { nume: 'Vâslit cu bara / gantera', serii: 4, repetari: '10-12', pauza: '75 sec' },
        { nume: 'Vâslit cablu / bandă', serii: 3, repetari: '12-15', pauza: '60 sec', nota: 'Contractie la final' },
        { nume: 'Bicep curl bara EZ', serii: 3, repetari: '10-12', pauza: '60 sec' },
        { nume: 'Hammer curl', serii: 3, repetari: '12', pauza: '45 sec' },
        { nume: 'Facepull / Reverse fly', serii: 3, repetari: '15-20', pauza: '45 sec' },
        { nume: 'Plancă cu ridicare braț', serii: 3, durata: '30 sec', pauza: '45 sec' },
      ],
      racire: [
        { nume: 'Stretching triceps', durata: '30 sec per parte' },
        { nume: 'Stretching spate — cat-cow', durata: '60 sec' },
        { nume: 'Childs pose', durata: '60 sec' },
      ]
    },
    {
      zi: 'Marți', ziScurt: 'Ma', tip: 'cardio', dificultate: 2,
      titlu: '🏃 Cardio — Zona 2 + HIIT scurt',
      durata: eIncepator ? '35 min' : '45 min',
      calorii: caloriiCardio,
      obiectivZi: 'Zona 2 cardio îmbunătățește VO2max, eficiența mitocondrială și arderea grăsimilor. HIIT-ul scurt crește EPOC (ardere post-antrenament).',
      sfat: areHTA ? 'Rămâi în zona 2 (conversație posibilă). Evită sprinturile intense.' : 'Testul vorbire: în Zona 2 poți vorbi propoziții complete. Dacă nu poți — reduci ritmul.',
      echipament: ['Bandă de alergat / Pistă / Parc', 'Opțional: bicicletă, eliptic'],
      incalzire: [
        { nume: 'Mers vioi', durata: '3 min' },
        { nume: 'High knees ușori', durata: '30 sec' },
        { nume: 'Leg swings', durata: '30 sec per picior' },
      ],
      antrenament: evitaImpact ? [
        { nume: 'Bicicletă plat — fără impact', durata: '25 min', intensitate: '60-70% FC max', nota: eSupraponderal ? 'BMI >30: alergarea e contraindicată — risc genunchi. Bicicleta e ideală!' : 'Articulații sensibile — zero impact' },
        { nume: 'Mers rapid în pantă ușoară', durata: '15 min', nota: 'Același beneficiu ca joggingul, fără impact' },
        { nume: 'Cool-down mers ușor', durata: '5 min' },
      ] : eIncepator ? [
        { nume: 'Bicicletă Zona 2 pe plat', durata: '20 min', intensitate: '60-70% FC max', nota: 'Cadenț 70-80 rpm, conversație posibilă' },
        { nume: 'Intervale: 1 min mai rapid / 2 min normal', durata: '10 min ×3', nota: 'Pe urcări mici' },
        { nume: 'Cool-down pedalat ușor', durata: '5 min' },
      ] : [
        { nume: 'Bicicletă Zona 2', durata: '15 min', intensitate: '65-70% FC max', nota: 'Cadenț 85-95 rpm, respirație nazală' },
        { nume: 'Urcări Zona 4: 3 min urcare / 2 min coborâre', durata: '3 runde', intensitate: '80-88% FC max', nota: 'Forță pe pedală' },
        { nume: 'Sprint: 30 sec maxim / 90 sec ușor', durata: '3 runde', intensitate: '90-95% FC max' },
        { nume: 'Jogging brick după bicicletă', durata: '10 min', nota: 'Primii 2-3 min picioarele par grele — normal!' },
        { nume: 'Cool-down mers', durata: '5 min' },
      ],
      racire: [
        { nume: 'Stretching cvadricepși', durata: '30 sec per picior' },
        { nume: 'Stretching ischio-gambieri', durata: '30 sec per picior' },
        { nume: 'Stretching gambe', durata: '30 sec per picior' },
        { nume: 'Respirații profunde', durata: '2 min' },
      ]
    },
    {
      zi: 'Miercuri', ziScurt: 'Mi', tip: 'forta', dificultate: 2,
      titlu: '🦵 Forță — Lower Body (Picioare + Fese)',
      durata: eIncepator ? '45 min' : '60 min',
      calorii: Math.round(caloriiForta * 1.2),
      obiectivZi: 'Picioarele sunt cel mai mare grup muscular. Antrenamentul lower body crește cel mai mult testosteronul și hormonul de creștere.',
      sfat: vreaMasa ? 'Squat-ul și deadlift-ul sunt regele exercițiilor. Nu le evita — ele construiesc masa în tot corpul.' : 'Genunchii urmează direcția degetelor. Nu lăsa genunchii să cadă înăuntru la squat.',
      echipament: ['Haltere/gantere', 'Kettlebell (opțional)', 'Bandă rezistență'],
      incalzire: [
        { nume: 'Squat cu greutatea corpului', serii: 2, repetari: '15', nota: 'Lent, controlat' },
        { nume: 'Hip circles', durata: '30 sec per direcție' },
        { nume: 'Lunges statice', serii: 1, repetari: '10 per picior' },
        { nume: 'Glute bridges', serii: 1, repetari: '15' },
      ],
      antrenament: eIncepator ? [
        { nume: 'Goblet squat', serii: 3, repetari: '12-15', pauza: '75 sec', nota: 'Kettlebell sau gantera' },
        { nume: 'Romanian deadlift', serii: 3, repetari: '12', pauza: '75 sec', nota: 'Spatele drept!' },
        { nume: 'Walking lunges', serii: 3, repetari: '10 per picior', pauza: '60 sec' },
        { nume: 'Glute bridge cu greutate', serii: 3, repetari: '15', pauza: '45 sec' },
        { nume: 'Calf raises', serii: 3, repetari: '20', pauza: '30 sec' },
      ] : [
        { nume: 'Squat cu bara / goblet squat', serii: 4, repetari: '8-10', pauza: '2 min', nota: 'Greutate progresivă' },
        { nume: 'Romanian deadlift', serii: 4, repetari: '10-12', pauza: '90 sec' },
        { nume: 'Bulgarian split squat', serii: 3, repetari: '10 per picior', pauza: '75 sec', nota: 'Cel mai eficient pentru fese' },
        { nume: 'Hip thrust / Glute bridge loaded', serii: 4, repetari: '12-15', pauza: '60 sec' },
        { nume: 'Leg curl / Nordic curl', serii: 3, repetari: '12', pauza: '60 sec' },
        { nume: 'Calf raises cu greutate', serii: 4, repetari: '15-20', pauza: '30 sec' },
      ],
      racire: [
        { nume: 'Pigeon pose', durata: '60 sec per parte' },
        { nume: 'Figure-4 stretch', durata: '45 sec per parte' },
        { nume: 'Stretching cvadricepși', durata: '30 sec per parte' },
        { nume: 'Childs pose', durata: '60 sec' },
      ]
    },
    {
      zi: 'Joi', ziScurt: 'Jo', tip: 'activ', dificultate: 1,
      titlu: '🚶 Recuperare activă — Mers + Mobilitate',
      durata: '45-60 min',
      calorii: Math.round(caloriiCardio * 0.5),
      obiectivZi: 'Recuperarea activă accelerează vindecarea musculară prin circulație crescută, fără stres suplimentar. Mersul pe jos e unul din cele mai eficiente exerciții pentru longevitate.',
      sfat: 'Mersul 45-60 min/zi reduce mortalitatea cu 35% (studiu JAMA). Nu subestima puterea mersului simplu.',
      echipament: ['Pantofi comozi', 'Opțional: covoraș yoga'],
      incalzire: [],
      antrenament: [
        { nume: 'Mers în natură / parc', durata: '30-45 min', intensitate: 'Ușoară-moderată', nota: 'Fără telefon, mindful walking' },
        { nume: 'Yoga / stretching full body', durata: '15 min', nota: 'YouTube: yoga for recovery' },
        { nume: 'Respirații 4-7-8 (Wim Hof lite)', durata: '5 min', nota: 'Reduce cortizolul, îmbunătățește recuperarea' },
        { nume: 'Foam rolling spate + picioare', durata: '10 min', nota: 'Lent, stai pe punctele tensionate' },
      ],
      racire: [],
      sfat2: 'Azi e ziua de socializa! Mergi cu un prieten sau ascultă un podcast motivațional.'
    } as any,
    {
      zi: 'Vineri', ziScurt: 'Vi', tip: 'forta', dificultate: 3,
      titlu: '💪 Forță — Upper Body Push (Piept + Umeri + Tricepși)',
      durata: eIncepator ? '45 min' : '60 min',
      calorii: caloriiForta,
      obiectivZi: 'Ziua de push completează echilibrul muscular. Piept + umeri + tricepși sunt esențiali pentru postură și forță funcțională.',
      sfat: 'Raportul pull:push ideal e 2:1 — de aceea avem mai multe zile de back. Azi mergem la push calitativ.',
      echipament: ['Haltere/gantere', 'Bara (opțional)', 'Bandă rezistență'],
      incalzire: [
        { nume: 'Flotări ușoare', serii: 2, repetari: '10', nota: 'Fără forțare' },
        { nume: 'Shoulder circles', durata: '30 sec per direcție' },
        { nume: 'Band pull-apart', serii: 2, repetari: '15' },
      ],
      antrenament: eIncepator ? [
        { nume: 'Flotări (knee push-ups ok)', serii: 3, repetari: 'Max - 2', pauza: '90 sec', nota: 'Coboară pieptul la sol' },
        { nume: 'Dumbbell chest press', serii: 3, repetari: '12', pauza: '75 sec' },
        { nume: 'Lateral raises', serii: 3, repetari: '12-15', pauza: '60 sec', nota: 'Greutate mica, forma perfecta' },
        { nume: 'Overhead press', serii: 3, repetari: '12', pauza: '75 sec' },
        { nume: 'Tricep extension', serii: 3, repetari: '15', pauza: '45 sec' },
      ] : [
        { nume: 'Bench press / Flotări cu greutate', serii: 4, repetari: '6-8', pauza: '2 min', nota: 'Greutate maximă cu formă bună' },
        { nume: 'Incline dumbbell press', serii: 3, repetari: '10-12', pauza: '90 sec' },
        { nume: 'Overhead press', serii: 4, repetari: '8-10', pauza: '90 sec' },
        { nume: 'Lateral raises', serii: 3, repetari: '15-20', pauza: '45 sec', nota: 'Contractie la varf' },
        { nume: 'Cable/band flyes', serii: 3, repetari: '12-15', pauza: '60 sec' },
        { nume: 'Tricep dips / Skull crushers', serii: 3, repetari: '10-12', pauza: '60 sec' },
      ],
      racire: [
        { nume: 'Chest stretch la perete', durata: '45 sec per parte' },
        { nume: 'Cross-arm shoulder stretch', durata: '30 sec per parte' },
        { nume: 'Tricep stretch overhead', durata: '30 sec per parte' },
      ]
    },
    {
      zi: 'Sâmbătă', ziScurt: 'Sb', tip: 'mixt', dificultate: 2,
      titlu: '⚡ Circuit complet + Sport fun',
      durata: '45-60 min',
      calorii: Math.round(caloriiCardio * 1.1),
      obiectivZi: 'Sâmbăta e pentru antrenament funcțional și sport care îți place. Circuit training + activitate în natură sau sport de echipă.',
      sfat: 'Studii arată că activitățile fizice cu element social (sport de echipă, dans, maraton cu prietenii) cresc aderența cu 80% față de sala singur.',
      echipament: ['Kettlebell', 'Bandă rezistență', 'Sau: teren de sport, bicicletă, pistă'],
      incalzire: [
        { nume: 'Jumping jacks', durata: '60 sec' },
        { nume: 'Squat + overhead reach', serii: 1, repetari: '10' },
        { nume: 'Inchworm', serii: 1, repetari: '5' },
      ],
      antrenament: [
        { nume: 'Circuit × 4 runde (30 sec per exercițiu, 10 sec pauza):', nota: 'Burpees → Kettlebell swing → Push-up → Jump squat → Mountain climbers → Plancă', durata: '20 min' },
        { nume: 'Activitate la alegere:', durata: '20-30 min', nota: 'Bicicletă, înot, fotbal, tenis, dans, hiking — orice îți face plăcere!' },
      ],
      racire: [
        { nume: 'Stretching full body', durata: '10 min' },
        { nume: 'Respirații profunde', durata: '3 min' },
      ]
    },
    {
      zi: 'Duminică', ziScurt: 'Du', tip: 'recuperare', dificultate: 1,
      titlu: '😴 Zi de odihnă activă & Reset',
      durata: '30 min',
      calorii: Math.round(caloriiCardio * 0.3),
      obiectivZi: 'Mușchii cresc în repaus, nu în antrenament. Duminica e sacră — corp odihnit = săptămână mai productivă.',
      sfat: 'HRV-ul tău e cel mai bun indicator de recuperare. Dacă e sub medie → odihnă completă. Dacă e normal → mobilitate ușoară.',
      echipament: ['Covoraș yoga', 'Foam roller'],
      incalzire: [],
      antrenament: [
        { nume: 'Mers ușor 20-30 min', durata: '20-30 min', nota: 'Fără ritm, relaxat' },
        { nume: 'Yoga restorative / Yin yoga', durata: '20 min', nota: 'YouTube: yin yoga recovery' },
        { nume: 'Baie rece / contrast (opțional)', durata: '5 min', nota: 'Reduce inflamația musculară cu 20%' },
        { nume: 'Meditație / Respirații', durata: '10 min', nota: 'Wim Hof, box breathing sau simplu relaxare' },
      ],
      racire: []
    }
  ]
}

// ── COMPONENTA ────────────────────────────────────────────────────────────────
export default function SportPage() {
  const supabase = createBrowserClient()
  const [profil, setProfil] = useState<any>(null)
  const [ziActiva, setZiActiva] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1)
  const [sectActiva, setSectActiva] = useState<'incalzire' | 'antrenament' | 'racire'>('antrenament')
  const [loading, setLoading] = useState(true)
  const [program, setProgram] = useState<AntrenamentZi[]>([])

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('utilizatori').select('profil_complet').eq('id', user.id).single()
      setProfil(data?.profil_complet || {})
      setProgram(genereazaSport(data?.profil_complet || {}))
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-3xl animate-pulse">💪</div>
    </div>
  )

  const zi = program[ziActiva]
  if (!zi) return null

  const tipColor: Record<string, string> = {
    forta: '#f87171', cardio: '#60a5fa', mixt: '#a78bfa', recuperare: '#4ade80', activ: '#86efac'
  }
  const tipLabel: Record<string, string> = {
    forta: '💪 Forță', cardio: '🏃 Cardio', mixt: '⚡ Circuit', recuperare: '😴 Recuperare', activ: '🚶 Activ'
  }
  const dificultateStelute = '★'.repeat(zi.dificultate) + '☆'.repeat(3 - zi.dificultate)

  const sectiuni = [
    { key: 'incalzire', label: '🔥 Încălzire', items: zi.incalzire },
    { key: 'antrenament', label: '💪 Antrenament', items: zi.antrenament },
    { key: 'racire', label: '🧘 Răcire', items: zi.racire },
  ].filter(s => s.items && s.items.length > 0)

  return (
    <div className="fade-in space-y-4 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white mb-1">🏋️ Programul tău de sport</h1>
        <p className="text-white/40 text-sm">Cardio + Forță + Recuperare · Echilibrat pe toată săptămâna · Personalizat</p>
      </div>

      {/* Selector zile */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {program.map((z, i) => (
          <button key={i} onClick={() => { setZiActiva(i); setSectActiva('antrenament') }}
            className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              ziActiva === i
                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                : 'text-white/35 hover:text-white/60 border border-white/[0.07]'
            }`}>
            <span className="text-base mb-0.5">
              {z.tip === 'forta' ? '💪' : z.tip === 'cardio' ? '🏃' : z.tip === 'mixt' ? '⚡' : z.tip === 'recuperare' ? '😴' : '🚶'}
            </span>
            <span>{z.ziScurt}</span>
          </button>
        ))}
      </div>

      {/* Card zi */}
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-lg font-semibold text-white mb-1">{zi.titlu}</div>
            <div className="flex items-center gap-3 text-xs">
              <span className="px-2 py-0.5 rounded-full font-medium" style={{ background: `${tipColor[zi.tip]}15`, color: tipColor[zi.tip], border: `1px solid ${tipColor[zi.tip]}30` }}>
                {tipLabel[zi.tip]}
              </span>
              <span className="text-white/40">⏱️ {zi.durata}</span>
              <span className="text-white/40">🔥 ~{zi.calorii} kcal</span>
            </div>
          </div>
          <div className="text-yellow-400 text-sm flex-shrink-0">{dificultateStelute}</div>
        </div>
        <p className="text-xs text-white/50 leading-relaxed mb-3">{zi.obiectivZi}</p>
        <div className="bg-green-500/[0.06] border border-green-500/[0.15] rounded-xl p-3">
          <div className="text-[10px] font-bold text-green-400 uppercase tracking-wider mb-1">💡 Sfatul zilei</div>
          <div className="text-xs text-white/60 leading-relaxed">{zi.sfat}</div>
        </div>
      </div>

      {/* Echipament */}
      {zi.echipament.length > 0 && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
          <div className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-2">🎒 Echipament necesar</div>
          <div className="flex flex-wrap gap-2">
            {zi.echipament.map((e, i) => (
              <span key={i} className="text-xs px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-full text-white/60">{e}</span>
            ))}
          </div>
        </div>
      )}

      {/* Tabs secțiuni */}
      {sectiuni.length > 1 && (
        <div className="flex gap-1.5">
          {sectiuni.map(s => (
            <button key={s.key} onClick={() => setSectActiva(s.key as any)}
              className={`flex-1 text-xs font-medium py-2 rounded-xl transition-all ${
                sectActiva === s.key
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : 'text-white/35 hover:text-white/60 border border-white/[0.07]'
              }`}>{s.label}</button>
          ))}
        </div>
      )}

      {/* Exerciții */}
      <div className="space-y-2">
        {sectiuni
          .filter(s => s.key === sectActiva || sectiuni.length === 1)
          .map(s => (
            <div key={s.key} className="space-y-2">
              {s.key !== sectActiva && sectiuni.length > 1 && (
                <div className="text-[10px] font-bold text-white/30 uppercase tracking-wider">{s.label}</div>
              )}
              {s.items.map((ex: Exercitiu, i: number) => (
                <div key={i} className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-400 text-xs font-bold">{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white/85">{ex.nume}</div>
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        {ex.serii && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                            {ex.serii} serii
                          </span>
                        )}
                        {ex.repetari && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {ex.repetari} rep
                          </span>
                        )}
                        {ex.durata && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            ⏱️ {ex.durata}
                          </span>
                        )}
                        {ex.pauza && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] text-white/40 border border-white/[0.1]">
                            💤 {ex.pauza}
                          </span>
                        )}
                        {ex.intensitate && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                            {ex.intensitate}
                          </span>
                        )}
                      </div>
                      {ex.nota && (
                        <div className="mt-2 text-xs text-white/40 italic">💡 {ex.nota}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
      </div>

      {/* Săptămâna overview */}
      <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-4">
        <div className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-3">📅 Structura săptămânii</div>
        <div className="space-y-1.5">
          {program.map((z, i) => (
            <div key={i} className={`flex items-center gap-3 py-1.5 px-2 rounded-xl transition-all cursor-pointer ${ziActiva === i ? 'bg-white/[0.04]' : ''}`}
              onClick={() => setZiActiva(i)}>
              <div className="w-6 text-center text-xs text-white/30 flex-shrink-0">{z.ziScurt}</div>
              <div className="flex-1 text-xs text-white/60">{z.titlu}</div>
              <div className="text-xs" style={{ color: tipColor[z.tip] }}>
                {z.tip === 'forta' ? '💪' : z.tip === 'cardio' ? '🏃' : z.tip === 'mixt' ? '⚡' : z.tip === 'recuperare' ? '😴' : '🚶'}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs text-white/20 text-center pb-4">
        ⚕️ Program adaptat profilului tău. Consultă un medic înainte de a începe dacă ai condiții medicale.
      </div>
    </div>
  )
}
