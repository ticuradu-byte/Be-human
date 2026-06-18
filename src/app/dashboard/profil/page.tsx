'use client'
// src/app/dashboard/profil/page.tsx — v2 cu fix-uri font, fumat, body fat

import { useState, useEffect, useRef } from 'react'
import { createBrowserClient } from '@/lib/supabase'

const API_WEARABLES = process.env.NEXT_PUBLIC_WEARABLES_API_URL || 'http://localhost:8001'

const ACTIVITATI = [
  { val: 'sedentar',    label: 'Sedentar',       desc: 'Birou, fără sport' },
  { val: 'usor',       label: 'Ușor activ',      desc: '1-2 zile/săpt sport' },
  { val: 'moderat',    label: 'Moderat activ',   desc: '3-4 zile/săpt sport' },
  { val: 'activ',      label: 'Activ',           desc: '5-6 zile/săpt sport' },
  { val: 'very_activ', label: 'Foarte activ',    desc: 'Sportiv sau muncă fizică' },
]

const FUMAT_OPT = [
  { val: 'nefumator',  label: '🚭 Nefumător' },
  { val: 'renuntat',   label: '✅ Am renunțat' },
  { val: 'ocazional',  label: '🚬 Ocazional (câteva/lună)' },
  { val: '1_sapt',     label: '🚬 1 dată/săptămână' },
  { val: 'zilnic_putine', label: '🚬 Zilnic — puține (1-5/zi)' },
  { val: 'zilnic_mult', label: '🚬 Zilnic — multe (5+/zi)' },
]

const DIETA_OPT = [
  { val: 'omnivora',        label: '🍖 Omnivoră (mănânc orice)' },
  { val: 'mediteraneana',   label: '🫒 Mediteraneană' },
  { val: 'low_carb',        label: '🥩 Low-carb / Keto' },
  { val: 'paleo',           label: '🦴 Paleo' },
  { val: 'vegetariana',     label: '🥦 Vegetariană' },
  { val: 'vegana',          label: '🌱 Vegană' },
  { val: 'pescatariana',    label: '🐟 Pescatariană' },
  { val: 'fara_gluten',     label: '🌾 Fără gluten' },
  { val: 'fara_lactate',    label: '🥛 Fără lactate' },
  { val: 'intermittent',    label: '⏰ Post intermitent (IF)' },
  { val: 'whole_food',      label: '🥗 Whole Food Plant Based' },
]

const ALCOOL_OPT = [
  { val: 'niciodata',  label: '🚫 Niciodată' },
  { val: 'rar',        label: 'Rar (1x/lună)' },
  { val: 'ocazional',  label: 'Ocazional (câteva/lună)' },
  { val: 'social',     label: 'Social (weekenduri)' },
  { val: 'moderat',    label: 'Moderat (1-2/săpt)' },
  { val: 'frecvent',   label: 'Frecvent (3+/săpt)' },
  { val: 'zilnic',     label: 'Zilnic' },
]

const CONDITII_MEDICALE = [
  'Hashimoto / Hipotiroidism', 'Hipertiroidism', 'Diabet tip 2', 'Prediabet',
  'Hipertensiune', 'Colesterol crescut', 'Anemie / Deficit fier', 'PCOS',
  'Endometrioză', 'Rezistență insulinică', 'Sindrom metabolic', 'Depresie / Anxietate',
  'ADHD', 'Fibromialgie', 'Boală cardiovasculară', 'Artrită / Artroză',
  'IBS / Colon iritabil', 'Boală Crohn / Colită', 'Reflux / GERD', 'Apnee somn', 'Altele',
]

const ALERGII = ['Gluten', 'Lactoză', 'Nuci', 'Arahide', 'Ouă', 'Pește', 'Crustacee', 'Soia', 'Altele']

const OBIECTIVE = [
  { val: 'sanatate',       label: '🫀 Sănătate generală' },
  { val: 'longevitate',    label: '⏳ Longevitate' },
  { val: 'performanta',    label: '🏃 Performanță sportivă' },
  { val: 'slabire',        label: '⚖️ Slăbire' },
  { val: 'masa_musculara', label: '💪 Masă musculară' },
  { val: 'energie',        label: '⚡ Energie și focus' },
  { val: 'somn',           label: '😴 Somn mai bun' },
  { val: 'stres',          label: '🧠 Reducere stres' },
]

const WEARABLES_LISTA = [
  // ── OAuth Direct ─────────────────────────────────────────────────────────
  { id: 'oura',       icon: '💍', label: 'Oura Ring',          desc: 'HRV, somn, temperatură, readiness',  tip: 'oauth' },
  { id: 'garmin',     icon: '⌚', label: 'Garmin Connect',     desc: 'Pași, VO2max, stres, somn',          tip: 'login' },
  { id: 'googlefit',  icon: '🔵', label: 'Google Fit',         desc: 'Pași, calorii, somn, activități',    tip: 'oauth_gfit' },
  { id: 'healthconn', icon: '❤️', label: 'Health Connect',     desc: 'Hub Android — toate dispozitivele',  tip: 'android_info' },
  // ── CSV Import ───────────────────────────────────────────────────────────
  { id: 'amazfit',    icon: '📱', label: 'Zepp / Amazfit',     desc: 'Export CSV din app Zepp',            tip: 'csv' },
  { id: 'samsung',    icon: '💙', label: 'Samsung Health',     desc: 'Export CSV din Samsung Health',      tip: 'csv' },
  { id: 'huawei',     icon: '🔴', label: 'Huawei Health',      desc: 'Export CSV din Huawei Health',       tip: 'csv' },
  { id: 'xiaomi',     icon: '🟡', label: 'Xiaomi / Mi Band',   desc: 'Export CSV din Mi Fitness',          tip: 'csv' },
  { id: 'fitcloudpro',icon: '🟠', label: 'FitCloudPro',        desc: 'Export CSV din FitCloudPro',         tip: 'csv' },
  { id: 'luckring',   icon: '💚', label: 'LuckRing',           desc: 'Export CSV din LuckRing app',        tip: 'csv' },
  { id: 'applehealth',icon: '🍎', label: 'Apple Health',       desc: 'Export XML din Health app iOS',      tip: 'csv' },
  { id: 'fitbit',     icon: '💚', label: 'Fitbit',             desc: 'Export CSV din fitbit.com',          tip: 'csv' },
  { id: 'whoop',      icon: '💪', label: 'WHOOP',              desc: 'Export CSV din app WHOOP',           tip: 'csv' },
  { id: 'strava',     icon: '🟠', label: 'Strava',             desc: 'Export CSV din strava.com',          tip: 'csv' },
  { id: 'myfitnesspal',icon: '🔵', label: 'MyFitnessPal',      desc: 'Export CSV din MFP',                 tip: 'csv' },
  { id: 'eattrack',   icon: '🥗', label: 'Eat & Track',        desc: 'Export CSV din Eat & Track',         tip: 'csv' },
  { id: 'hevy',       icon: '🏋️', label: 'Hevy',               desc: 'Export CSV antrenamente',            tip: 'csv' },
  { id: 'runalyze',   icon: '🏃', label: 'Runalyze',           desc: 'Export CSV activități',              tip: 'csv' },
  // ── În curând ────────────────────────────────────────────────────────────
  { id: 'withings',   icon: '⚖️', label: 'Withings',           desc: 'Cântar + tensiometru smart',         tip: 'soon' },
  { id: 'polar',      icon: '❄️', label: 'Polar Flow',         desc: 'În curând',                          tip: 'soon' },
]

const SECTIUNI = [
  { id: 'personal',  icon: '👤', label: 'Personal' },
  { id: 'corp',      icon: '⚖️', label: 'Corp & BF%' },
  { id: 'medical',   icon: '🏥', label: 'Medical' },
  { id: 'analize',   icon: '🧪', label: 'Analize' },
  { id: 'wearables', icon: '⌚', label: 'Wearables' },
  { id: 'obiective', icon: '🎯', label: 'Obiective' },
]

// ── CALCUL BODY FAT — Metoda US Navy ─────────────────────────────────────────
function calcBodyFat(sex: string, inaltime: number, talie: number, gat: number, sold?: number): number | null {
  if (!inaltime || !talie || !gat) return null
  if (sex === 'M') {
    const bf = 495 / (1.0324 - 0.19077 * Math.log10(talie - gat) + 0.15456 * Math.log10(inaltime)) - 450
    return Math.round(bf * 10) / 10
  } else if (sex === 'F' && sold) {
    const bf = 495 / (1.29579 - 0.35004 * Math.log10(talie + sold - gat) + 0.22100 * Math.log10(inaltime)) - 450
    return Math.round(bf * 10) / 10
  }
  return null
}

function bfCategorie(bf: number, sex: string): { label: string; color: string } {
  if (sex === 'M') {
    if (bf < 6)  return { label: 'Esențial', color: '#60a5fa' }
    if (bf < 14) return { label: 'Atletism 🏆', color: '#4ade80' }
    if (bf < 18) return { label: 'Fitness ✓', color: '#86efac' }
    if (bf < 25) return { label: 'Mediu', color: '#facc15' }
    return { label: 'Obezitate', color: '#f87171' }
  } else {
    if (bf < 14) return { label: 'Esențial', color: '#60a5fa' }
    if (bf < 21) return { label: 'Atletism 🏆', color: '#4ade80' }
    if (bf < 25) return { label: 'Fitness ✓', color: '#86efac' }
    if (bf < 32) return { label: 'Mediu', color: '#facc15' }
    return { label: 'Obezitate', color: '#f87171' }
  }
}

// ── STILURI SELECT fix culoare text ──────────────────────────────────────────
const selectStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,.04)',
  border: '1px solid rgba(255,255,255,.1)',
  borderRadius: '12px',
  color: '#e2ddd6',
  fontFamily: 'inherit',
  fontSize: '13px',
  padding: '10px 13px',
  width: '100%',
  outline: 'none',
}

export default function ProfilPage() {
  const supabase = createBrowserClient()
  const fileRef  = useRef<HTMLInputElement>(null)

  const [userId, setUserId]     = useState('')
  const [sectiune, setSectiune] = useState('personal')
  const [saving, setSaving]     = useState(false)
  const [salvat, setSalvat]     = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [garminForm, setGarminForm] = useState({ email: '', password: '' })
  const [showGarminForm, setShowGarminForm] = useState(false)
  const [wearableStatus, setWearableStatus] = useState<Record<string, boolean>>({})
  const [bodyFat, setBodyFat]   = useState<number | null>(null)
  const [masaSlaba, setMasaSlaba] = useState<number | null>(null)
  const [masaGrasa, setMasaGrasa] = useState<number | null>(null)

  const [profil, setProfil] = useState({
    prenume: '', nume: '', data_nastere: '', sex: '',
    inaltime_cm: '', greutate_kg: '', greutate_target: '', bmi: '',
    circumferinta_talie: '', circumferinta_gat: '', circumferinta_sold: '',
    activitate: '', fumat: '', alcool: '', dieta: '',
    conditii_medicale: [] as string[],
    medicamente: '',
    alergii: [] as string[], alte_alergii: '',
    obiective: [] as string[],
    analize_text: '',
    analize_fisiere: [] as { nume: string; data: string; continut: string }[],
    tensiune_sistolica: '',
    tensiune_diastolica: '',
    puls_repaus: '',
    suplimente: [] as { nume: string; doza: string; timing: string; motiv: string }[],
  })

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase.from('utilizatori').select('*').eq('id', user.id).single()
      if (data?.profil_complet) {
        setProfil(p => ({ ...p, ...data.profil_complet }))
        if (data.profil_complet.google_fit_conectat) {
          setWearableStatus(p => ({ ...p, googlefit: true, healthconn: true }))
        }
      }
      if (data?.nume) setProfil(p => ({ ...p, prenume: data.nume }))
      try {
        const [o, g] = await Promise.all([
          fetch(`${API_WEARABLES}/oura/status/${user.id}`).then(r => r.json()).catch(() => ({ conectat: false })),
          fetch(`${API_WEARABLES}/garmin/status/${user.id}`).then(r => r.json()).catch(() => ({ conectat: false })),
        ])
        setWearableStatus(prev => ({ ...prev, oura: o.conectat, garmin: g.conectat }))
      } catch {}
    }
    load()
  }, [])

  // BMI automat
  useEffect(() => {
    const h = parseFloat(profil.inaltime_cm)
    const w = parseFloat(profil.greutate_kg)
    if (h && w) f('bmi', (w / ((h / 100) ** 2)).toFixed(1))
  }, [profil.inaltime_cm, profil.greutate_kg])

  // Body Fat automat (US Navy)
  useEffect(() => {
    const h  = parseFloat(profil.inaltime_cm)
    const t  = parseFloat(profil.circumferinta_talie)
    const g  = parseFloat(profil.circumferinta_gat)
    const s  = parseFloat(profil.circumferinta_sold)
    const bf = calcBodyFat(profil.sex, h, t, g, s)
    setBodyFat(bf)
    if (bf && profil.greutate_kg) {
      const w = parseFloat(profil.greutate_kg)
      setMasaGrasa(Math.round(w * bf / 100 * 10) / 10)
      setMasaSlaba(Math.round(w * (1 - bf / 100) * 10) / 10)
    } else { setMasaGrasa(null); setMasaSlaba(null) }
  }, [profil.inaltime_cm, profil.greutate_kg, profil.circumferinta_talie, profil.circumferinta_gat, profil.circumferinta_sold, profil.sex])

  const f = (k: string, v: any) => setProfil(p => ({ ...p, [k]: v }))
  const toggleItem = (key: string, val: string) => {
    const arr = profil[key as keyof typeof profil] as string[]
    f(key, arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val])
  }

  const salveaza = async () => {
    setSaving(true)
    await supabase.from('utilizatori').update({ nume: profil.prenume, profil_complet: profil }).eq('id', userId)
    setSalvat(true); setTimeout(() => setSalvat(false), 2000); setSaving(false)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files; if (!files) return
    setPdfLoading(true)
    for (const file of Array.from(files)) {
      try {
        if (file.type === 'application/pdf') {
          if (!(window as any).pdfjsLib) {
            await new Promise<void>(resolve => {
              const s = document.createElement('script')
              s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
              s.onload = () => { ;(window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; resolve() }
              document.head.appendChild(s)
            })
          }
          const arr = new Uint8Array(await file.arrayBuffer())
          const pdf = await (window as any).pdfjsLib.getDocument({ data: arr }).promise
          let text = ''
          for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
            const page = await pdf.getPage(i)
            const content = await page.getTextContent()
            text += content.items.map((s: any) => s.str).join(' ') + '\n'
          }
          f('analize_fisiere', [...profil.analize_fisiere, { nume: file.name, data: new Date().toLocaleDateString('ro-RO'), continut: text.trim() }])
          f('analize_text', profil.analize_text + '\n\n=== ' + file.name + ' ===\n' + text.trim())
        } else if (file.type.startsWith('image/')) {
          const reader = new FileReader()
          reader.onload = async (ev) => {
            const base64 = (ev.target?.result as string).split(',')[1]
            const res = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 1000, messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: file.type, data: base64 } }, { type: 'text', text: 'Extrage TOATE valorile din această analiză medicală. Format: Parametru: Valoare Unitate pentru fiecare, câte una pe linie. Nimic altceva.' }] }] })
            })
            const data = await res.json()
            const text = data.content?.[0]?.text || ''
            f('analize_fisiere', [...profil.analize_fisiere, { nume: file.name, data: new Date().toLocaleDateString('ro-RO'), continut: text }])
            f('analize_text', profil.analize_text + '\n\n=== ' + file.name + ' ===\n' + text)
          }
          reader.readAsDataURL(file)
        }
      } catch {}
    }
    setPdfLoading(false); e.target.value = ''
  }

  const conecteazaGarmin = async () => {
    if (!garminForm.email || !garminForm.password) return
    try {
      const res = await fetch(`${API_WEARABLES}/garmin/conecteaza/${userId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(garminForm) })
      if (res.ok) { setWearableStatus(p => ({ ...p, garmin: true })); setShowGarminForm(false); setGarminForm({ email: '', password: '' }) }
    } catch {}
  }

  const bmiColor = () => { const b = parseFloat(profil.bmi); if (!b) return 'rgba(255,255,255,.4)'; if (b < 18.5) return '#60a5fa'; if (b < 25) return '#4ade80'; if (b < 30) return '#facc15'; return '#f87171' }
  const bmiLabel = () => { const b = parseFloat(profil.bmi); if (!b) return ''; if (b < 18.5) return 'Subponderal'; if (b < 25) return 'Normal ✓'; if (b < 30) return 'Supraponderal'; return 'Obezitate' }
  const bfInfo = bodyFat ? bfCategorie(bodyFat, profil.sex) : null

  // Stiluri comune
  const inputCls = "w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2.5 text-[#e2ddd6] text-sm outline-none focus:border-green-500/40 placeholder:text-white/20 font-[inherit]"
  const labelCls = "text-xs text-white/40 mb-1.5 block"
  const cardCls  = "bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5"
  const secTitleCls = "text-[10px] font-bold text-white/30 uppercase tracking-wider mb-4"

  return (
    <div className="fade-in space-y-4 max-w-2xl" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white mb-1">👤 Profilul meu</h1>
          <p className="text-white/40 text-sm">Date medicale, corp, wearables și obiective</p>
        </div>
        <button onClick={salveaza} disabled={saving} className="btn-green py-2.5 px-6 text-sm">
          {saving ? '⏳ Salvez...' : salvat ? '✓ Salvat!' : '💾 Salvează tot'}
        </button>
      </div>

      {/* Nav */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {SECTIUNI.map(s => (
          <button key={s.id} onClick={() => setSectiune(s.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              sectiune === s.id ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'text-white/40 hover:text-white/65 border border-white/[0.07]'
            }`}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* ── PERSONAL ── */}
      {sectiune === 'personal' && (
        <div className="space-y-3 fade-in">
          <div className={cardCls}>
            <div className={secTitleCls}>Informații personale</div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className={labelCls}>Prenume</label>
                <input value={profil.prenume} onChange={e => f('prenume', e.target.value)} className={inputCls} placeholder="ex: Radu" />
              </div>
              <div>
                <label className={labelCls}>Nume de familie</label>
                <input value={profil.nume} onChange={e => f('nume', e.target.value)} className={inputCls} placeholder="ex: Popescu" />
              </div>
              <div>
                <label className={labelCls}>Data nașterii</label>
                <input type="date" value={profil.data_nastere} onChange={e => f('data_nastere', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Sex biologic</label>
                <div className="grid grid-cols-2 gap-2">
                  {[['M','♂ Masculin'],['F','♀ Feminin']].map(([v,l]) => (
                    <div key={v} onClick={() => f('sex', v)}
                      className={`py-2.5 rounded-xl border text-center text-xs cursor-pointer transition-all ${
                        profil.sex === v ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-white/[0.03] border-white/10 text-white/55 hover:text-white/75'
                      }`}>{l}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Activitate */}
          <div className={cardCls}>
            <div className={secTitleCls}>Nivel activitate fizică</div>
            <div className="space-y-2">
              {ACTIVITATI.map(a => (
                <div key={a.val} onClick={() => f('activitate', a.val)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                    profil.activitate === a.val ? 'bg-green-500/10 border-green-500/25 text-green-400' : 'bg-white/[0.02] border-white/[0.07] text-white/60 hover:bg-white/[0.04]'
                  }`}>
                  <span className="text-sm font-medium">{a.label}</span>
                  <span className="text-xs text-white/35">{a.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stil viata */}
          <div className={cardCls}>
            <div className={secTitleCls}>Stil de viață</div>

            {/* Fumat */}
            <div className="mb-4">
              <label className={labelCls}>🚬 Fumat</label>
              <div className="grid grid-cols-2 gap-2">
                {FUMAT_OPT.map(o => (
                  <div key={o.val} onClick={() => f('fumat', o.val)}
                    className={`py-2.5 px-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      profil.fumat === o.val ? 'bg-yellow-500/10 border-yellow-500/25 text-yellow-400' : 'bg-white/[0.02] border-white/[0.07] text-white/55 hover:bg-white/[0.04]'
                    }`}>{o.label}</div>
                ))}
              </div>
            </div>

            {/* Alcool */}
            <div className="mb-4">
              <label className={labelCls}>🍷 Alcool</label>
              <div className="grid grid-cols-2 gap-2">
                {ALCOOL_OPT.map(o => (
                  <div key={o.val} onClick={() => f('alcool', o.val)}
                    className={`py-2.5 px-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      profil.alcool === o.val ? 'bg-blue-500/10 border-blue-500/25 text-blue-400' : 'bg-white/[0.02] border-white/[0.07] text-white/55 hover:bg-white/[0.04]'
                    }`}>{o.label}</div>
                ))}
              </div>
            </div>

            {/* Dieta */}
            <div>
              <label className={labelCls}>🥗 Tip dietă</label>
              <div className="grid grid-cols-2 gap-2">
                {DIETA_OPT.map(o => (
                  <div key={o.val} onClick={() => f('dieta', o.val)}
                    className={`py-2.5 px-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      profil.dieta === o.val ? 'bg-green-500/10 border-green-500/25 text-green-400' : 'bg-white/[0.02] border-white/[0.07] text-white/55 hover:bg-white/[0.04]'
                    }`}>{o.label}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CORP & BODY FAT ── */}
      {sectiune === 'corp' && (
        <div className="space-y-3 fade-in">
          <div className={cardCls}>
            <div className={secTitleCls}>Măsurători corporale</div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className={labelCls}>Înălțime (cm)</label>
                <input type="number" value={profil.inaltime_cm} onChange={e => f('inaltime_cm', e.target.value)} className={inputCls} placeholder="ex: 181" />
              </div>
              <div>
                <label className={labelCls}>Greutate actuală (kg)</label>
                <input type="number" step="0.5" value={profil.greutate_kg} onChange={e => f('greutate_kg', e.target.value)} className={inputCls} placeholder="ex: 82" />
              </div>
              <div>
                <label className={labelCls}>Greutate țintă (kg)</label>
                <input type="number" step="0.5" value={profil.greutate_target} onChange={e => f('greutate_target', e.target.value)} className={inputCls} placeholder="ex: 76" />
              </div>
              <div>
                <label className={labelCls}>BMI calculat automat</label>
                <div className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2.5 flex items-center justify-between">
                  <span className="text-sm font-bold" style={{ color: bmiColor() }}>{profil.bmi || '—'}</span>
                  <span className="text-xs" style={{ color: bmiColor() }}>{bmiLabel()}</span>
                </div>
              </div>
            </div>

            {/* BMI bar */}
            {profil.bmi && (
              <div className="p-3 rounded-xl mb-4" style={{ background: `${bmiColor()}10`, border: `1px solid ${bmiColor()}25` }}>
                <div className="flex justify-between text-[9px] text-white/30 mb-1.5">
                  <span>&lt;18.5</span><span>18.5-25</span><span>25-30</span><span>&gt;30</span>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden relative flex">
                  <div className="h-full bg-blue-400 opacity-50" style={{ width: '27%' }}/>
                  <div className="h-full bg-green-400 opacity-50" style={{ width: '27%' }}/>
                  <div className="h-full bg-yellow-400 opacity-50" style={{ width: '20%' }}/>
                  <div className="h-full bg-red-400 opacity-50" style={{ width: '26%' }}/>
                  <div className="absolute top-0 h-full w-1 bg-white rounded-full shadow-lg"
                    style={{ left: `${Math.min(95, Math.max(2, ((parseFloat(profil.bmi) - 15) / 25) * 100))}%` }}/>
                </div>
                {profil.greutate_target && profil.greutate_kg && (
                  <div className="text-xs text-white/40 text-center mt-1.5">
                    De dat jos: <strong className="text-white/65">{Math.max(0, parseFloat(profil.greutate_kg) - parseFloat(profil.greutate_target)).toFixed(1)} kg</strong>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Body Fat Calculator — US Navy */}
          <div className={cardCls}>
            <div className={secTitleCls}>📐 Body Fat % — Metoda US Navy</div>
            <div className="p-3 bg-indigo-500/[0.06] border border-indigo-500/[0.18] rounded-xl mb-4 text-xs text-white/45 leading-relaxed">
              Cea mai precisă metodă non-invazivă. Măsoară circumferințele cu un metru textil.
              {profil.sex === 'F' && ' Femei: necesită și circumferința șoldului.'}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className={labelCls}>Circumferință talie (cm)</label>
                <input type="number" step="0.5" value={profil.circumferinta_talie} onChange={e => f('circumferinta_talie', e.target.value)}
                  className={inputCls} placeholder="Măsurată la buric" />
              </div>
              <div>
                <label className={labelCls}>Circumferință gât (cm)</label>
                <input type="number" step="0.5" value={profil.circumferinta_gat} onChange={e => f('circumferinta_gat', e.target.value)}
                  className={inputCls} placeholder="Sub mărul lui Adam" />
              </div>
              {profil.sex === 'F' && (
                <div className="col-span-2">
                  <label className={labelCls}>Circumferință șolduri (cm) — doar femei</label>
                  <input type="number" step="0.5" value={profil.circumferinta_sold} onChange={e => f('circumferinta_sold', e.target.value)}
                    className={inputCls} placeholder="Partea cea mai lată a șoldurilor" />
                </div>
              )}
            </div>

            {/* Rezultat Body Fat */}
            {bodyFat !== null && bfInfo && (
              <div className="rounded-2xl p-5" style={{ background: `${bfInfo.color}10`, border: `1px solid ${bfInfo.color}30` }}>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <div>
                    <div className="text-[10px] text-white/35 uppercase tracking-wider mb-1">Body Fat % (US Navy)</div>
                    <div className="font-fraunces text-4xl font-bold" style={{ color: bfInfo.color }}>{bodyFat}%</div>
                    <div className="text-sm font-semibold mt-1" style={{ color: bfInfo.color }}>{bfInfo.label}</div>
                  </div>
                  <div className="space-y-2 text-right">
                    {masaGrasa && <div>
                      <div className="font-bold text-lg text-orange-400">{masaGrasa} kg</div>
                      <div className="text-xs text-white/35">Masă grasă</div>
                    </div>}
                    {masaSlaba && <div>
                      <div className="font-bold text-lg text-green-400">{masaSlaba} kg</div>
                      <div className="text-xs text-white/35">Masă slabă (mușchi + oase)</div>
                    </div>}
                  </div>
                </div>

                {/* Referințe */}
                <div className="grid grid-cols-4 gap-2 text-center">
                  {(profil.sex === 'M'
                    ? [['<6%','Esențial','#60a5fa'],['6-13%','Atletism','#4ade80'],['14-17%','Fitness','#86efac'],['18-24%','Mediu','#facc15'],['25%+','Obez','#f87171']]
                    : [['<14%','Esențial','#60a5fa'],['14-20%','Atletism','#4ade80'],['21-24%','Fitness','#86efac'],['25-31%','Mediu','#facc15'],['32%+','Obez','#f87171']]
                  ).map(([range, label, color], i) => (
                    <div key={i} className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                      <div className="text-[10px] font-bold" style={{ color }}>{range}</div>
                      <div className="text-[9px] text-white/35 mt-0.5">{label}</div>
                    </div>
                  ))}
                </div>

                {profil.greutate_target && masaSlaba && (
                  <div className="mt-3 p-3 bg-white/[0.03] rounded-xl text-xs text-white/50 text-center">
                    💡 La greutatea țintă de <strong className="text-white/70">{profil.greutate_target}kg</strong>:
                    masă slabă păstrată <strong className="text-green-400">{masaSlaba}kg</strong> →
                    BF estimat <strong style={{ color: bfInfo.color }}>
                      {Math.round((masaGrasa! / parseFloat(profil.greutate_target)) * 100 * 10) / 10}%
                    </strong>
                  </div>
                )}
              </div>
            )}

            {!bodyFat && profil.inaltime_cm && (
              <div className="text-center py-4 text-xs text-white/30">
                Completează circumferința taliei și gâtului pentru calcul BF%
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MEDICAL ── */}
      {sectiune === 'medical' && (
        <div className="space-y-3 fade-in">
          <div className={cardCls}>
            <div className={secTitleCls}>🏥 Condiții medicale diagnosticate</div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {CONDITII_MEDICALE.map(c => (
                <div key={c} onClick={() => toggleItem('conditii_medicale', c)}
                  className={`py-2 px-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    profil.conditii_medicale.includes(c) ? 'bg-yellow-500/10 border-yellow-500/25 text-yellow-400' : 'bg-white/[0.02] border-white/[0.07] text-white/55 hover:bg-white/[0.04]'
                  }`}>
                  {profil.conditii_medicale.includes(c) ? '✓ ' : ''}{c}
                </div>
              ))}
            </div>
          </div>

          <div className={cardCls}>
            <div className={secTitleCls}>❤️ Tensiune arterială & Puls</div>
            <div className="p-3 bg-blue-500/[0.06] border border-blue-500/[0.15] rounded-xl mb-3 text-xs text-white/45">Normal: &lt;120/80 mmHg · Optim: 110-120/70-80 · HTA grad 1: 130-139/80-89</div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className={labelCls}>Sistolică (mmHg)</label><input type="number" value={profil.tensiune_sistolica} onChange={e => f('tensiune_sistolica', e.target.value)} className={inputCls} placeholder="125" /></div>
              <div><label className={labelCls}>Diastolică (mmHg)</label><input type="number" value={profil.tensiune_diastolica} onChange={e => f('tensiune_diastolica', e.target.value)} className={inputCls} placeholder="82" /></div>
              <div><label className={labelCls}>Puls repaus (bpm)</label><input type="number" value={profil.puls_repaus} onChange={e => f('puls_repaus', e.target.value)} className={inputCls} placeholder="68" /></div>
            </div>
          </div>

          <div className={cardCls}>
            <div className={secTitleCls}>💊 Medicamente în curs</div>
            <textarea rows={4} value={profil.medicamente} onChange={e => f('medicamente', e.target.value)}
              className={inputCls} style={{ resize: 'vertical' }}
              placeholder="ex: Levotiroxina 50mcg dimineața&#10;Metformin 500mg 2x/zi&#10;Vitamina D3 4000UI" />
            <div className="text-[10px] text-white/25 mt-1">✅ Verificate automat față de suplimentele recomandate</div>
          </div>

          <div className={cardCls}>
            <div className={secTitleCls}>🌿 Suplimente în curs</div>
            <div className="p-3 bg-green-500/[0.06] border border-green-500/[0.15] rounded-xl mb-3 text-xs text-white/45 leading-relaxed">💡 D3+K2 cu masă grasă · Magneziu seara · Zinc pe stomac gol · Omega-3 cu masă · Berberin înainte de masă 15min</div>
            {(profil.suplimente || []).map((s: any, i: number) => (
              <div key={i} className="grid grid-cols-4 gap-2 mb-2 p-3 bg-white/[0.02] rounded-xl border border-white/[0.07]">
                <input value={s.nume} onChange={e => { const arr = [...(profil.suplimente||[])]; arr[i] = {...arr[i], nume: e.target.value}; f('suplimente', arr) }} className={inputCls} placeholder="Magneziu" />
                <input value={s.doza} onChange={e => { const arr = [...(profil.suplimente||[])]; arr[i] = {...arr[i], doza: e.target.value}; f('suplimente', arr) }} className={inputCls} placeholder="400mg" />
                <select value={s.timing} onChange={e => { const arr = [...(profil.suplimente||[])]; arr[i] = {...arr[i], timing: e.target.value}; f('suplimente', arr) }} style={selectStyle}>
                  <option value="">Timing</option>
                  <option value="dimineata_gol">Dimineața stomac gol</option>
                  <option value="dimineata_masa">Dimineața cu masă grasă</option>
                  <option value="inainte_masa">Înainte masă 15min</option>
                  <option value="dupa_masa">După masă</option>
                  <option value="seara">Seara</option>
                  <option value="seara_gol">Seara stomac gol</option>
                  <option value="sport">Înainte de sport</option>
                </select>
                <button onClick={() => f('suplimente', (profil.suplimente||[]).filter((_: any, j: number) => j !== i))} className="text-red-400/60 hover:text-red-400 text-sm px-2">✕</button>
              </div>
            ))}
            <button onClick={() => f('suplimente', [...(profil.suplimente||[]), { nume: '', doza: '', timing: '', motiv: '' }])} className="w-full py-2.5 border border-dashed border-white/15 rounded-xl text-xs text-white/40 hover:text-white/60 hover:border-green-500/30 transition-all">+ Adaugă supliment</button>
          </div>

          <div className={cardCls}>
            <div className={secTitleCls}>⚠️ Alergii și intoleranțe</div>
            <div className="flex flex-wrap gap-2 mb-3">
              {ALERGII.map(a => (
                <div key={a} onClick={() => toggleItem('alergii', a)}
                  className={`py-1.5 px-3 rounded-full border text-xs cursor-pointer transition-all ${
                    profil.alergii.includes(a) ? 'bg-red-500/10 border-red-500/25 text-red-400' : 'bg-white/[0.02] border-white/[0.07] text-white/55'
                  }`}>{a}</div>
              ))}
            </div>
            <input className={inputCls} value={profil.alte_alergii} onChange={e => f('alte_alergii', e.target.value)}
              placeholder="Alte alergii sau intoleranțe..." />
          </div>
        </div>
      )}

      {/* ── ANALIZE ── */}
      {sectiune === 'analize' && (
        <div className="space-y-3 fade-in">
          <div className={cardCls}>
            <div className={secTitleCls}>📎 Încarcă analize medicale</div>
            <input ref={fileRef} type="file" accept=".pdf,image/*" multiple className="hidden" onChange={handleFileUpload} />
            <div onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-white/15 rounded-2xl p-8 text-center cursor-pointer hover:border-green-500/30 hover:bg-green-500/[0.03] transition-all mb-4">
              {pdfLoading ? (
                <div><div className="text-2xl animate-pulse mb-2">🔬</div><div className="text-sm text-white/50">Extrag valorile din analiză cu AI...</div></div>
              ) : (
                <div>
                  <div className="text-3xl mb-2">📄</div>
                  <div className="text-sm text-white/60 font-medium mb-1">Click sau drag & drop</div>
                  <div className="text-xs text-white/30">PDF, JPG, PNG — analize sânge, buletine medicale</div>
                  <div className="text-xs text-green-400/60 mt-1">✨ AI extrage valorile automat</div>
                </div>
              )}
            </div>

            {profil.analize_fisiere.length > 0 && (
              <div className="space-y-2 mb-4">
                {profil.analize_fisiere.map((fi, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-green-500/[0.05] border border-green-500/[0.15] rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">📄</span>
                      <div>
                        <div className="text-sm text-white/75">{fi.nume}</div>
                        <div className="text-xs text-white/35">{fi.data} · {fi.continut.split(' ').length} cuvinte extrase</div>
                      </div>
                    </div>
                    <button onClick={() => f('analize_fisiere', profil.analize_fisiere.filter((_, j) => j !== i))}
                      className="text-red-400/60 hover:text-red-400 text-sm">✕</button>
                  </div>
                ))}
              </div>
            )}

            <div>
              <div className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-2">✏️ Sau introdu manual</div>
              <textarea rows={7} value={profil.analize_text} onChange={e => f('analize_text', e.target.value)}
                className={inputCls} style={{ resize: 'vertical', fontFamily: 'DM Mono, monospace' }}
                placeholder="Feritina: 14 ng/mL&#10;Vitamina D: 22 ng/mL&#10;TSH: 2.3 mUI/L&#10;Glucoză: 91 mg/dL&#10;Hemoglobina: 12.8 g/dL&#10;CRP hs: 1.4 mg/L&#10;ApoB: 95 mg/dL&#10;Homocisteina: 11 μmol/L" />
            </div>
          </div>
        </div>
      )}

      {/* ── WEARABLES ── */}
      {sectiune === 'wearables' && (
        <div className="space-y-3 fade-in">
          <div className="p-3 bg-indigo-500/[0.06] border border-indigo-500/[0.18] rounded-xl text-xs text-white/45 leading-relaxed">
            🔗 Conectează dispozitivele pentru date automate zilnice — fără export manual
          </div>
          {WEARABLES_LISTA.map(w => (
            <div key={w.id} className={cardCls}>
              <div className="flex items-center gap-4">
                <div className="text-2xl flex-shrink-0">{w.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-semibold text-white/85">{w.label}</span>
                    {wearableStatus[w.id] && <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">✓ Conectat</span>}
                    {w.tip === 'soon' && <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-white/30">În curând</span>}
                  </div>
                  <div className="text-xs text-white/35">{w.desc}</div>
                </div>
                {w.tip === 'oauth' && !wearableStatus[w.id] && (
                  <button onClick={() => window.location.href = `${API_WEARABLES}/oura/auth/${userId}`}
                    className="btn-green text-xs py-2 px-4 flex-shrink-0">Conectează →</button>
                )}
                {w.tip === 'oauth' && wearableStatus[w.id] && <span className="text-green-400 text-lg">✓</span>}
                {w.tip === 'login' && !wearableStatus[w.id] && (
                  <button onClick={() => setShowGarminForm(!showGarminForm)} className="btn-ghost text-xs py-2 px-4 flex-shrink-0">
                    {showGarminForm ? 'Anulează' : 'Conectează →'}
                  </button>
                )}
                {w.tip === 'login' && wearableStatus[w.id] && <span className="text-green-400 text-lg">✓</span>}
                {w.tip === 'android' && <span className="text-xs text-white/25 flex-shrink-0">Via app Android</span>}
                {w.tip === 'csv' && (
                  <a href="/dashboard/analiza" className="btn-ghost text-xs py-2 px-4 flex-shrink-0">📎 Import CSV →</a>
                )}
                {w.tip === 'oauth_gfit' && !wearableStatus[w.id] && (
                  <button onClick={() => window.location.href = `/api/wearables/google-fit?user_id=${userId}`}
                    className="btn-green text-xs py-2 px-4 flex-shrink-0">Conectează →</button>
                )}
                {w.tip === 'oauth_gfit' && wearableStatus[w.id] && (
                  <span className="text-green-400 text-sm font-medium">✅ Conectat</span>
                )}
                {w.tip === 'android_info' && (
                  <span className="text-white/25 text-xs">Via Google Fit</span>
                )}
                {w.tip === 'csv' && (
                  <a href="/dashboard/analiza" className="btn-ghost text-xs py-2 px-4 flex-shrink-0">📎 Import CSV →</a>
                )}
              </div>
              {w.id === 'garmin' && showGarminForm && !wearableStatus.garmin && (
                <div className="mt-3 pt-3 border-t border-white/[0.07] space-y-2">
                  <div className="text-xs text-white/35">Email + parola contului Garmin Connect · Stocat criptat AES-256</div>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="email" value={garminForm.email} onChange={e => setGarminForm(p => ({ ...p, email: e.target.value }))}
                      className={inputCls} placeholder="Email Garmin" />
                    <input type="password" value={garminForm.password} onChange={e => setGarminForm(p => ({ ...p, password: e.target.value }))}
                      className={inputCls} placeholder="Parolă Garmin" />
                  </div>
                  <button onClick={conecteazaGarmin} disabled={!garminForm.email || !garminForm.password}
                    className="btn-green text-sm py-2.5 w-full">🔗 Conectează Garmin</button>
                </div>
              )}
            </div>
          ))}
          <div className="bg-indigo-500/[0.06] border border-indigo-500/[0.18] rounded-xl p-4">
            <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-2">📱 Android — Google Health Connect</div>
            <p className="text-xs text-white/50 leading-relaxed mb-3">
              Conectează automat Amazfit, Xiaomi Mi Band, Samsung, Huawei și orice device Android prin Google Health Connect.
            </p>
            <button className="btn-ghost text-xs py-2 px-4">📲 Descarcă app Android be-human</button>
          </div>
        </div>
      )}

      {/* ── OBIECTIVE ── */}
      {sectiune === 'obiective' && (
        <div className="space-y-3 fade-in">
          <div className={cardCls}>
            <div className={secTitleCls}>🎯 Obiectivele tale de sănătate</div>
            <div className="grid grid-cols-2 gap-2">
              {OBIECTIVE.map(o => (
                <div key={o.val} onClick={() => toggleItem('obiective', o.val)}
                  className={`py-3 px-4 rounded-xl border text-sm cursor-pointer transition-all ${
                    profil.obiective.includes(o.val) ? 'bg-green-500/10 border-green-500/25 text-green-400' : 'bg-white/[0.02] border-white/[0.07] text-white/55 hover:bg-white/[0.04]'
                  }`}>
                  {profil.obiective.includes(o.val) ? '✓ ' : ''}{o.label}
                </div>
              ))}
            </div>
          </div>
          {profil.obiective.length > 0 && (
            <div className="bg-green-500/[0.06] border border-green-500/[0.18] rounded-xl p-4">
              <div className="text-[10px] font-bold text-green-400 uppercase tracking-wider mb-2">✅ Rapoartele be-human sunt adaptate pentru:</div>
              <div className="flex flex-wrap gap-2">
                {profil.obiective.map(o => {
                  const obj = OBIECTIVE.find(x => x.val === o)
                  return obj ? <span key={o} className="text-xs px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">{obj.label}</span> : null
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <button onClick={salveaza} disabled={saving} className="btn-green w-full py-4 text-base">
        {saving ? '⏳ Salvez...' : salvat ? '✓ Profil salvat!' : '💾 Salvează profilul'}
      </button>

      <div className="text-xs text-white/20 text-center pb-4">
        🔒 Date stocate în UE (Frankfurt) · GDPR compliant · contact@be-human.ro
      </div>
    </div>
  )
}
