'use client'
// src/app/dashboard/analiza/page.tsx — v2 cu RAG + auto-populare din profil

import { useState, useRef, useCallback, useEffect } from 'react'
import { createBrowserClient, PLANURI } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { KNOWLEDGE_BASE_V2 } from '@/lib/knowledge-base-v2'
import { KNOWLEDGE_BASE_MEDICAL_V3 } from '@/lib/knowledge-base-medical'

// ── SYSTEM PROMPT EXTINS ──────────────────────────────────────────────────────
const SYSTEM_PROMPT_BASE = `Ești be-human, agent wellness funcțional. Analizează datele utilizatorului și returnează DOAR JSON valid, fără markdown, fără text în afara JSON-ului.

MEDICATIE SI BOLI: {MEDICATIE}
DATE UTILIZATOR: {DATE}

REGULI STRICTE:
- Returnează DOAR JSON, nimic altceva
- Texte SCURTE: max 15 cuvinte per câmp string
- Liste: max 3-4 items
- Nu repeta date din input

JSON OBLIGATORIU (completează toate câmpurile):
{"scor_wellness":75,"scor_label":"Bine","salut":"1 propoziție scurtă","diagnostic_functional":"max 2 propoziții","urmatorul_pas":"1 acțiune concretă","cercul_vicios":"optional scurt","cercul_virtuos":"optional scurt","alerte_medicale":[{"parametru":"nume","valoare":"X mg/dL","nivel":"rosu","mesaj":"scurt","actiune":"scurt","urgenta":"X zile"}],"insights":[{"icon":"emoji","titlu":"3-5 cuvinte","descriere":"max 15 cuvinte","actiune":"max 10 cuvinte","prioritate":"ridicata","categorie":"tip","mecanism":"scurt","citare":"","impact":"scurt"}],"nutritie":{"calorii_recomandate":2000,"proteine_g":150,"carbohidrati_g":200,"grasimi_g":70,"apa_litri":2.5,"alimente_prioritare":["item1","item2","item3"],"alimente_reduce":["item1","item2"],"plan_zi":{"dimineata":"scurt","pranz":"scurt","seara":"scurt"}},"hormoni":{"evaluare":"scurt","prioritati":["item1","item2"]},"sport":{"evaluare_curenta":"scurt","zona_recomandata":"scurt","plan_saptamana":"scurt","recuperare":"scurt"},"somn":{"evaluare":"scurt","protocoale":["item1","item2"],"ora_culcare":"22:30","suplimente_somn":"optional"},"sanatate_mintala":{"evaluare":"scurt","practici":["item1","item2"],"viata_sociala":"scurt"},"sanatate_sexuala":{"evaluare":"scurt","recomandari":["item1","item2"]},"anti_aging":{"varsta_biologica":"X ani","prioritati":["item1","item2"],"analize_recomandate":["item1","item2"]},"suplimente_sigure":[{"supliment":"Nume","doza":"Xmg","motiv":"scurt","timing":"dimineata","citare":""}],"suplimente_contraindicate":[],"mit_demontat":"max 20 cuvinte","disclaimer":"Informații educaționale. Urgențe: 112"}`

// ── TIPURI SURSE EXTINSE ──────────────────────────────────────────────────────
const TIPURI_SURSE = [
  { key: 'analize',      icon: '🧪', label: 'Analize Medicale',    placeholder: 'Feritina: 14 ng/mL\nVitamina D: 22 ng/mL\nTSH: 2.3\nGlucoză: 91\nApoB: 95 mg/dL' },
  { key: 'garmin',       icon: '⌚', label: 'Smartwatch/Wearable', placeholder: 'HRV: 38ms\nPași: 11,240\nSomn: 6.8h\nStres: 42/100\nVO2max: 42' },
  { key: 'nutritie',     icon: '🥗', label: 'Nutriție',            placeholder: 'Calorii: 1820 kcal\nProteine: 98g\nApă: 1.6L' },
  { key: 'vitale',       icon: '❤️', label: 'Vitale',              placeholder: 'Tensiune: 122/78\nSpO2: 97%\nHR: 62 bpm' },
  { key: 'ciclu',        icon: '🌙', label: 'Ciclu Menstrual',     placeholder: 'Ziua ciclului: 18\nDurata ciclu: 28 zile\nSimptome: ușoară tensiune sâni' },
  { key: 'cgm',          icon: '📈', label: 'Glicemie (CGM)',      placeholder: 'Glicemie medie: 92 mg/dL\nSpike maxim: 148 mg/dL\nTIR (70-140): 87%\nVariabilitate: 22%' },
  { key: 'suplimente',   icon: '💊', label: 'Suplimente în curs',  placeholder: 'Magneziu glicinat 400mg seara\nVitamina D3 4000UI\nOmega-3 2g/zi' },
  { key: 'screen',       icon: '📱', label: 'Screen Time',         placeholder: 'Total: 5.2h\nSocial media: 2.3h\nSeara >21:00: 85 min' },
  { key: 'medicamente',  icon: '🏥', label: 'Medicație & Boli',    placeholder: 'Levotiroxina 50mcg dimineața\nHashimoto diagnosticat 2022' },
  { key: 'altele',       icon: '📝', label: 'Note & Simptome',     placeholder: 'Oboseală matinala\nCeata mentala' },
]

const EXEMPLU = {
  analize:    'Hemoglobina: 12.8 g/dL\nFeritina: 14 ng/mL\nVitamina D: 22 ng/mL\nTSH: 2.3 mUI/L\nT3 liber: 2.9 pg/mL\nAnti-TPO: 87 UI/mL\nGlucoză: 91 mg/dL\nHOMA-IR: 1.8\nApoB: 95 mg/dL\nCRP hs: 1.4 mg/L\nHomocisteina: 11 μmol/L',
  garmin:     'HRV noapte: 34ms\nSomn: 6.5h (calitate 62/100)\nPași: 11,240\nStres: 46/100\nVO2max: 42\nBody Battery max: 72\nSpO2: 97%',
  nutritie:   'Calorii: 1820 kcal (target 2100)\nProteine: 98g (target 130g)\nCarbohidrați: 210g\nGrăsimi: 68g\nApă: 1.6L\nPește: 1x/săpt',
  vitale:     'Tensiune: 118/76\nSpO2: 97%\nHR repaus: 62 bpm',
  ciclu:      'Ziua ciclului: 18\nDurata ciclu: 28 zile\nFaza: luteală\nSimptome: poftă de dulce crescută, ușoară iritabilitate',
  cgm:        '',
  suplimente: 'Magneziu glicinat 400mg seara\nVitamina D3 4000UI\nOmega-3 2g/zi',
  screen:     'Total: 5.2h\nSocial media: 2.3h\nDupa 21:00: 85 min',
  medicamente:'Anti-TPO crescut (Hashimoto incipient)\nFără medicație în curs',
  altele:     'Oboseală dimineața\nPoftă de dulce după-amiaza\nMă trezesc o dată pe noapte',
}

function scorColor(s: number) { return s >= 75 ? '#4ade80' : s >= 55 ? '#facc15' : '#f87171' }
function prColor(p: string) {
  if (p === 'ridicata') return { bg: 'rgba(248,113,113,.1)', bd: 'rgba(248,113,113,.25)', tx: '#f87171' }
  if (p === 'medie') return { bg: 'rgba(250,204,21,.08)', bd: 'rgba(250,204,21,.2)', tx: '#facc15' }
  return { bg: 'rgba(74,222,128,.07)', bd: 'rgba(74,222,128,.18)', tx: '#4ade80' }
}

// ── HELPER: construiește text profil din profil_complet ───────────────────────
function buildProfilText(p: any): string {
  if (!p) return ''
  const parts: string[] = []
  if (p.varsta)           parts.push(p.varsta + ' ani')
  if (p.data_nastere) {
    const age = new Date().getFullYear() - new Date(p.data_nastere).getFullYear()
    if (age > 0 && age < 120) parts.push(age + ' ani')
  }
  if (p.sex)              parts.push(p.sex === 'M' ? 'Masculin' : p.sex === 'F' ? 'Feminin' : p.sex)
  if (p.greutate_kg)      parts.push(p.greutate_kg + 'kg')
  if (p.inaltime_cm)      parts.push(p.inaltime_cm + 'cm')
  if (p.bmi)              parts.push('BMI: ' + p.bmi)
  if (p.activitate)       parts.push('Activitate: ' + p.activitate)
  if (p.obiective?.length) parts.push('Obiective: ' + (Array.isArray(p.obiective) ? p.obiective.join(', ') : p.obiective))
  if (p.greutate_target)  parts.push('Greutate țintă: ' + p.greutate_target + 'kg')
  return parts.join(', ')
}

// ── HELPER: construiește surse din profil_complet ─────────────────────────────
function buildSurseFromProfil(p: any): Record<string, string> {
  if (!p) return {}
  const surse: Record<string, string> = {}

  // MEDICATIE & BOLI
  const med: string[] = []
  const conditii = p.conditii_medicale || p.conditii || p.boli || []
  const medicamente = p.medicamente || p.medicatie || ''
  if (conditii?.length) med.push('Condiții diagnosticate: ' + (Array.isArray(conditii) ? conditii.join(', ') : conditii))
  if (medicamente) med.push('Medicamente: ' + medicamente)
  if (med.length) surse.medicamente = med.join('\n')

  // SUPLIMENTE
  const suplimente = p.suplimente || []
  if (suplimente.length > 0) {
    surse.suplimente = suplimente
      .filter((s: any) => s.nume)
      .map((s: any) => s.nume + ' ' + (s.doza || '') + (s.timing ? ' — ' + s.timing : ''))
      .join('\n')
  }

  // VITALE — tensiune, puls, spo2
  const vitale: string[] = []
  if (p.tensiune_sistolica && p.tensiune_diastolica)
    vitale.push('Tensiune: ' + p.tensiune_sistolica + '/' + p.tensiune_diastolica + ' mmHg')
  if (p.puls_repaus) vitale.push('Puls repaus: ' + p.puls_repaus + ' bpm')
  if (p.hr_repaus)   vitale.push('HR repaus: ' + p.hr_repaus + ' bpm')
  if (p.spo2)        vitale.push('SpO2: ' + p.spo2 + '%')
  if (vitale.length) surse.vitale = vitale.join('\n')

  // ANALIZE — PDF/text
  const analizeText = p.analize_text || ''
  if (analizeText) surse.analize = analizeText.slice(0, 1200)

  // STIL VIATA → note
  const note: string[] = []
  if (p.fumat)     note.push('Fumat: ' + p.fumat)
  if (p.alcool)    note.push('Alcool: ' + p.alcool)
  if (p.dieta)     note.push('Dietă: ' + p.dieta)
  if (p.tip_dieta) note.push('Dietă: ' + p.tip_dieta)
  if (p.somn_ore)  note.push('Somn: ' + p.somn_ore + 'h/noapte')
  if (p.stres)     note.push('Nivel stres: ' + p.stres)
  if (p.alergii?.length) note.push('Alergii: ' + p.alergii.join(', '))
  if (p.alte_alergii) note.push('Alte alergii: ' + p.alte_alergii)
  if (note.length) surse.altele = note.join('\n')

  // CICLU MENSTRUAL
  if (p.ciclu_ziua || p.ciclu_durata) {
    const ciclu: string[] = []
    if (p.ciclu_ziua)     ciclu.push('Ziua ciclului: ' + p.ciclu_ziua)
    if (p.ciclu_durata)   ciclu.push('Durata ciclu: ' + p.ciclu_durata + ' zile')
    if (p.ciclu_simptome) ciclu.push('Simptome: ' + p.ciclu_simptome)
    surse.ciclu = ciclu.join('\n')
  }

  return surse
}

// ══════════════════════════════════════════════════════════════════════════════
export default function AnalizaPageV2() {
  const supabase = createBrowserClient()
  const router   = useRouter()
  const fileRef  = useRef<HTMLInputElement>(null)

  const [profil, setProfil]           = useState('')
  const [surse, setSurse]             = useState<Record<string, string>>({})
  const [sursaActiva, setSursaActiva] = useState('analize')
  const [loading, setLoading]         = useState(false)
  const [loadMsg, setLoadMsg]         = useState('')
  const [result, setResult]           = useState<any>(null)
  const [activeTab, setActiveTab]     = useState<'overview'|'insights'|'nutritie'|'hormoni'|'sport'|'somn'|'mental'|'sex'|'antiaging'|'ciclu'|'suplimente'|'mit'>('overview')
  const [activeInsight, setActiveInsight] = useState<number|null>(null)
  const [pdfLoading, setPdfLoading]   = useState(false)
  const [util, setUtil]               = useState<any>(null)
  const [studiiGasite, setStudiiGasite] = useState(0)
  const [usaRAG, setUsaRAG]           = useState(false)
  const [profilIncarcat, setProfilIncarcat] = useState(false)

  // ── AUTO-POPULARE DIN PROFIL ─────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return

      supabase.from('utilizatori').select('*').eq('id', user.id).single()
        .then(({ data }) => {
          setUtil(data)

          if (data?.profil_complet) {
            const p = data.profil_complet

            // Auto-populare câmp profil text
            const profilText = buildProfilText(p)
            if (profilText) setProfil(profilText)

            // Auto-populare surse
            const surseNoi = buildSurseFromProfil(p)
            if (Object.keys(surseNoi).length > 0) {
              setSurse(surseNoi)
              setProfilIncarcat(true)
            }
          }
        })
    })
  }, [])

  const ensurePdf = useCallback(() => new Promise<void>(resolve => {
    if ((window as any).pdfjsLib) return resolve()
    const s = document.createElement('script')
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
    s.onload = () => {
      ;(window as any).pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
      resolve()
    }
    document.head.appendChild(s)
  }), [])

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setPdfLoading(true)
    try {
      if (file.type === 'application/pdf') {
        await ensurePdf()
        const arr = new Uint8Array(await file.arrayBuffer())
        const pdf = await (window as any).pdfjsLib.getDocument({ data: arr }).promise
        let txt = ''
        for (let i = 1; i <= Math.min(pdf.numPages, 15); i++) {
          const page = await pdf.getPage(i)
          const content = await page.getTextContent()
          txt += content.items.map((s: any) => s.str).join(' ') + '\n'
        }
        setSurse(p => ({ ...p, [sursaActiva]: txt.trim() }))
      } else {
        const reader = new FileReader()
        reader.onload = ev => setSurse(p => ({ ...p, [sursaActiva]: ev.target?.result as string }))
        reader.readAsText(file)
      }
    } finally { setPdfLoading(false); e.target.value = '' }
  }

  const analizeaza = async () => {
    if (util?.plan === 'free' && (util?.analize_luna || 0) >= 10) {
      router.push('/dashboard/cont'); return
    }

    setLoading(true)
    const msgs = [
      'Caut studii relevante în baza de date...',
      'Aplic medicina funcțională...',
      'Coreleze datele cu istoricul tău...',
      'Generez recomandări personalizate...',
      'Finalizez raportul...',
    ]
    let mi = 0; setLoadMsg(msgs[0])
    const iv = setInterval(() => { mi = (mi+1)%msgs.length; setLoadMsg(msgs[mi]) }, 2200)

    try {
      const ctx = [
        profil && `PROFIL: ${profil}`,
        ...TIPURI_SURSE.filter(s => surse[s.key]?.trim()).map(s => `${s.label.toUpperCase()}:\n${surse[s.key].slice(0, 600)}`),
      ].filter(Boolean).join('\n\n')

      let studiiContext = ''
      let memorieContext = ''

      try {
        const ragResponse = await fetch('/api/rag', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dateUtilizator: ctx }),
        })
        if (ragResponse.ok) {
          const ragData = await ragResponse.json()
          setStudiiGasite(ragData.studiiGasite || 0)
          setUsaRAG(true)

          if (ragData.studiiContext?.length) {
            studiiContext = `
STUDII MEDICALE RELEVANTE (citează-le specific):
${ragData.studiiContext.map((s: any) => `
• ${s.titlu} — ${s.autori || ''} (${s.jurnal}, ${s.an})
  Nivel: ${s.dovezi_nivel} | Concluzii: ${s.concluzii}
`).join('')}`
          }

          if (ragData.istoricAnalize?.length) {
            memorieContext = `
ISTORICUL ANALIZELOR:
${ragData.istoricAnalize.map((a: any, i: number) => `
Analiza ${i+1} (${new Date(a.creat_la).toLocaleDateString('ro-RO')}):
Scor: ${a.scor_wellness}/100 | ${a.rezultat_json?.urmatorul_pas?.slice(0, 80) || ''}
`).join('')}`
          }
        }
      } catch {
        setUsaRAG(false)
      }

      const systemPrompt = SYSTEM_PROMPT_BASE
        .replace('{MEDICATIE}', surse.medicamente || 'Nicio medicație declarată.')
        .replace('{DATE}', ctx)

      const res = await fetch('/api/analiza', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 5000,
          system: systemPrompt,
          messages: [{ role: 'user', content: 'Analizează complet datele mele și returnează JSON.' }],
        }),
      })

      const data = await res.json()
      const parsed = data.result || JSON.parse((data.content?.[0]?.text || "{}").replace(/```json|```/g, "").trim())


      setResult(parsed)
      setActiveTab('overview')

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('analize_bh').insert({
          user_id: user.id, scor_wellness: parsed.scor_wellness,
          surse_date: Object.keys(surse).filter(k => surse[k]?.trim()),
          rezultat_json: parsed, alerte: parsed.alerte_medicale,
        })
        await supabase.from('utilizatori')
          .update({ analize_luna: (util?.analize_luna || 0) + 1 }).eq('id', user.id)
      }
    } catch (e) {
      alert('Eroare la analiză. Încearcă din nou.')
    } finally {
      clearInterval(iv); setLoading(false)
    }
  }

  const hasDate = Object.values(surse).some(v => v.trim()) || profil.trim()
  const surseActive = TIPURI_SURSE.filter(s => surse[s.key]?.trim()).length
  const areCiclu = !!surse.ciclu?.trim()
  const areCGM   = !!surse.cgm?.trim()

  const TABS_RESULT = [
    ['overview', '📊 Overview'],
    ['insights', '💡 Insights'],
    ['nutritie', '🥗 Nutriție'],
    areCiclu ? ['ciclu', '🌙 Ciclu'] : null,
    areCGM   ? ['cgm_tab', '📈 Glicemie'] : null,
    ['hormoni', '⚗️ Hormoni'],
    ['suplimente', '💊 Suplimente'],
    ['sport', '🏃 Sport'],
    ['somn', '😴 Somn'],
    ['mental', '🧠 Mental'],
    ['sex', '🌹 Sexual'],
    ['antiaging', '⏳ Anti-aging'],
    ['mit', '🚫 Mituri'],
  ].filter(Boolean) as string[][]

  // ── RESULT VIEW ─────────────────────────────────────────────────────────────
  if (result) return (
    <div className="fade-in space-y-4 max-w-3xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <button onClick={() => setResult(null)} className="text-white/40 text-sm hover:text-white/70 mb-1 block">← Analiză nouă</button>
          <h1 className="text-xl font-semibold text-white">Raportul tău wellness</h1>
        </div>
        <div className="flex items-center gap-3 text-xs text-white/30">
          {usaRAG && studiiGasite > 0 && (
            <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full">
              🔬 {studiiGasite} studii citate
            </span>
          )}
          <span>{new Date().toLocaleDateString('ro-RO')}</span>
        </div>
      </div>

      {result.alerte_medicale?.length > 0 && (
        <div className="space-y-2">
          {result.alerte_medicale.map((a: any, i: number) => (
            <div key={i} style={{
              background: a.nivel==='rosu' ? 'rgba(239,68,68,.08)' : 'rgba(250,204,21,.06)',
              border: `1px solid ${a.nivel==='rosu' ? 'rgba(239,68,68,.35)' : 'rgba(250,204,21,.25)'}`,
              borderLeft: `4px solid ${a.nivel==='rosu' ? '#ef4444' : '#facc15'}`,
            }} className="rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-xl">{a.nivel==='rosu' ? '🚨' : '⚠️'}</span>
                <div>
                  <div className="text-sm font-bold mb-1" style={{ color: a.nivel==='rosu' ? '#f87171' : '#facc15' }}>
                    {a.nivel==='rosu' ? 'Consultă un medic urgent' : 'Consult medical recomandat'} — {a.parametru}: {a.valoare}
                  </div>
                  <div className="text-xs text-white/65 leading-relaxed mb-1">{a.mesaj}</div>
                  <div className="text-xs font-semibold" style={{ color: a.nivel==='rosu' ? '#f87171' : '#facc15' }}>→ {a.actiune} · {a.urgenta}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card-green p-6">
        <div className="flex items-center gap-5 flex-wrap mb-4">
          <div className="relative flex-shrink-0">
            <svg width="84" height="84" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="42" cy="42" r="34" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="7"/>
              <circle cx="42" cy="42" r="34" fill="none" stroke={scorColor(result.scor_wellness)} strokeWidth="7"
                strokeDasharray={`${(result.scor_wellness/100)*214} 214`} strokeLinecap="round"/>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ marginTop: 8 }}>
              <span className="font-fraunces text-2xl font-bold leading-none" style={{ color: scorColor(result.scor_wellness) }}>{result.scor_wellness}</span>
              <span className="text-[9px] text-white/30 uppercase tracking-wide">/100</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="font-fraunces text-lg font-bold mb-1" style={{ color: scorColor(result.scor_wellness) }}>{result.scor_label}</div>
            <p className="text-sm text-white/65 leading-relaxed">{result.salut}</p>
          </div>
        </div>
        {result.diagnostic_functional && (
          <div className="border-t border-white/[0.06] pt-4 space-y-2">
            <p className="text-sm text-white/60 leading-relaxed">{result.diagnostic_functional}</p>
            {result.cercul_vicios && (
              <div className="bg-red-500/[0.06] border border-red-500/[0.15] rounded-xl p-3">
                <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">⚠️ Ciclu Negativ</div>
                <div className="text-xs text-white/55 leading-relaxed">{result.cercul_vicios}</div>
              </div>
            )}
            {result.cercul_virtuos && (
              <div className="bg-green-500/[0.06] border border-green-500/[0.15] rounded-xl p-3">
                <div className="text-[10px] font-bold text-green-400 uppercase tracking-wider mb-1">✨ Ciclu Virtuos</div>
                <div className="text-xs text-white/55 leading-relaxed">{result.cercul_virtuos}</div>
              </div>
            )}
          </div>
        )}
        <div className="mt-4 bg-green-500/[0.08] border border-green-500/[0.2] rounded-xl p-3">
          <div className="text-[10px] font-bold text-green-400/80 uppercase tracking-wider mb-1">⚡ Cel mai important lucru AZI</div>
          <div className="text-sm text-white/90 font-medium leading-relaxed">{result.urmatorul_pas}</div>
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {TABS_RESULT.map(([k, l]) => (
          <button key={k} onClick={() => setActiveTab(k as any)}
            className={`flex-shrink-0 text-xs font-medium px-3 py-2 rounded-lg transition-all ${
              activeTab===k ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'text-white/35 hover:text-white/60'
            }`}>{l}</button>
        ))}
      </div>

      {activeTab==='overview' && (
        <div className="space-y-3 fade-in">
          {result.insights?.slice(0, 3).map((ins: any, i: number) => {
            const c = prColor(ins.prioritate)
            return (
              <div key={i} className="rounded-xl p-4" style={{ background: c.bg, border: `1px solid ${c.bd}` }}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{ins.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white/85 truncate">{ins.titlu}</div>
                    <div className="text-xs text-white/45 mt-0.5 leading-relaxed line-clamp-1">{ins.descriere}</div>
                    {ins.citare && <div className="text-[10px] text-indigo-400/70 mt-1 italic">{ins.citare}</div>}
                  </div>
                </div>
                <div className="mt-2 text-xs text-green-400/80 bg-green-500/[0.05] rounded-lg px-3 py-2">✅ {ins.actiune}</div>
              </div>
            )
          })}
          <button onClick={() => setActiveTab('insights')} className="w-full text-center text-xs text-green-400/60 hover:text-green-400 py-2">
            Toate insights-urile →
          </button>
        </div>
      )}

      {activeTab==='insights' && (
        <div className="space-y-2 fade-in">
          {result.insights?.map((ins: any, i: number) => {
            const c = prColor(ins.prioritate)
            return (
              <div key={i} className="rounded-xl p-4 cursor-pointer hover:translate-x-0.5 transition-all"
                style={{ background: activeInsight===i ? c.bg : 'rgba(255,255,255,.02)', border: `1px solid ${activeInsight===i ? c.bd : 'rgba(255,255,255,.06)'}` }}
                onClick={() => setActiveInsight(activeInsight===i ? null : i)}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-xl flex-shrink-0">{ins.icon}</span>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white/85 truncate">{ins.titlu}</div>
                      <div className="text-[10px] text-white/30 mt-0.5">{ins.categorie}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: c.bg, color: c.tx, border: `1px solid ${c.bd}` }}>{ins.prioritate}</span>
                    <span className="text-white/20 text-xs">{activeInsight===i ? '▲' : '▼'}</span>
                  </div>
                </div>
                {activeInsight===i && (
                  <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-2">
                    {ins.mecanism && <div className="text-xs bg-indigo-500/[0.06] border border-indigo-500/[0.15] rounded-lg px-3 py-2 text-indigo-300/80">🔬 {ins.mecanism}</div>}
                    <p className="text-sm text-white/65 leading-relaxed">{ins.descriere}</p>
                    {ins.citare && (
                      <div className="text-xs text-indigo-400/70 italic bg-indigo-500/[0.04] px-3 py-2 rounded-lg">
                        📚 {ins.citare}
                      </div>
                    )}
                    <div className="bg-green-500/[0.06] border border-green-500/[0.15] rounded-lg px-3 py-2">
                      <div className="text-[10px] font-bold text-green-400 uppercase tracking-wider mb-1">✅ Acțiune concretă</div>
                      <div className="text-sm text-white/80">{ins.actiune}</div>
                    </div>
                    {ins.impact && <div className="text-xs text-yellow-400/70">🎯 {ins.impact}</div>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {activeTab==='nutritie' && result.nutritie && (
        <div className="space-y-3 fade-in">
          <div className="card p-5">
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { l:'Calorii', v:`${result.nutritie.calorii_recomandate}`, c:'#facc15' },
                { l:'Proteine', v:`${result.nutritie.proteine_g}g`, c:'#f87171' },
                { l:'Carbohidrați', v:`${result.nutritie.carbohidrati_g}g`, c:'#60a5fa' },
                { l:'Grăsimi', v:`${result.nutritie.grasimi_g}g`, c:'#4ade80' },
                { l:'Apă', v:`${result.nutritie.apa_litri}L`, c:'#38bdf8' },
              ].map((m,i) => (
                <div key={i} className="text-center p-3 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                  <div className="font-fraunces text-xl font-bold leading-none" style={{ color: m.c }}>{m.v}</div>
                  <div className="text-[9px] text-white/35 uppercase tracking-wide mt-1">{m.l}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-500/[0.05] border border-green-500/[0.15] rounded-xl p-3">
                <div className="text-[10px] font-bold text-green-400 uppercase tracking-wider mb-2">+ Prioritar</div>
                {result.nutritie.alimente_prioritare?.map((a: string,i: number) => (
                  <div key={i} className="text-xs text-white/60 mb-1.5 pl-2 border-l-2 border-green-500/30 leading-relaxed">{a}</div>
                ))}
              </div>
              <div className="bg-red-500/[0.05] border border-red-500/[0.15] rounded-xl p-3">
                <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-2">− Reduce</div>
                {result.nutritie.alimente_reduce?.map((a: string,i: number) => (
                  <div key={i} className="text-xs text-white/60 mb-1.5 pl-2 border-l-2 border-red-500/30 leading-relaxed">{a}</div>
                ))}
              </div>
            </div>
          </div>
          {result.nutritie.plan_zi && (
            <div className="card p-4">
              <div className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-3">🍽️ Plan mâine</div>
              {[{icon:'🌅',l:'Dimineața',v:result.nutritie.plan_zi.dimineata},{icon:'☀️',l:'Prânz',v:result.nutritie.plan_zi.pranz},{icon:'🌙',l:'Seara',v:result.nutritie.plan_zi.seara}].map((item,i) => (
                <div key={i} className={`flex gap-3 py-3 ${i<2?'border-b border-white/[0.05]':''}`}>
                  <span className="text-lg flex-shrink-0">{item.icon}</span>
                  <div><div className="text-[10px] font-bold text-white/30 uppercase mb-1">{item.l}</div><div className="text-sm text-white/70 leading-relaxed">{item.v}</div></div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab==='ciclu' && (
        <div className="space-y-3 fade-in">
          {result.ciclu_menstrual ? (
            <>
              <div className="bg-purple-500/[0.06] border border-purple-500/[0.18] rounded-xl p-5">
                <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-3">🌙 Faza ta curentă</div>
                <div className="font-fraunces text-lg font-bold text-white/85 mb-2">{result.ciclu_menstrual.faza_curenta}</div>
                <p className="text-sm text-white/65 leading-relaxed">{result.ciclu_menstrual.descriere_faza}</p>
              </div>
              {result.ciclu_menstrual.nutritie_recomandata && (
                <div className="card p-4">
                  <div className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-3">🥗 Nutriție specifică fazei</div>
                  {result.ciclu_menstrual.nutritie_recomandata.map((n: string,i: number) => (
                    <div key={i} className="flex gap-2 py-2 border-b border-white/[0.04]">
                      <span className="text-purple-400 flex-shrink-0 text-sm">→</span>
                      <span className="text-sm text-white/65 leading-relaxed">{n}</span>
                    </div>
                  ))}
                </div>
              )}
              {result.ciclu_menstrual.sport_recomandat && (
                <div className="card p-4">
                  <div className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-3">🏃 Sport adaptat fazei</div>
                  <p className="text-sm text-white/65 leading-relaxed">{result.ciclu_menstrual.sport_recomandat}</p>
                  {result.ciclu_menstrual.atentionare_sport && (
                    <div className="mt-3 bg-yellow-500/[0.06] border border-yellow-500/[0.18] rounded-xl p-3 text-xs text-yellow-400/80">
                      ⚠️ {result.ciclu_menstrual.atentionare_sport}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-white/30">
              <div className="text-4xl mb-3">🌙</div>
              <div className="text-sm">Adaugă ziua ciclului în secțiunea "Ciclu Menstrual" pentru recomandări specifice fazei</div>
            </div>
          )}
        </div>
      )}

      {activeTab==='suplimente' && (
        <div className="space-y-3 fade-in">
          {result.suplimente_sigure?.length > 0 && (
            <div className="card p-5">
              <div className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-3">✅ Suplimente recomandate (verificate cu medicatia)</div>
              {result.suplimente_sigure.map((s: any, i: number) => (
                <div key={i} className="flex gap-3 py-3 border-b border-white/[0.05]">
                  <span className="text-xl flex-shrink-0">💊</span>
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-semibold text-white/85">{s.supliment}</span>
                      <span className="text-xs text-green-400 bg-green-500/[0.1] px-2 py-0.5 rounded-full border border-green-500/[0.2]">{s.doza}</span>
                    </div>
                    <div className="text-xs text-white/55 leading-relaxed">{s.motiv}</div>
                    {s.timing && <div className="text-[10px] text-indigo-400/70 mt-1">⏰ {s.timing}</div>}
                    {s.citare && <div className="text-[10px] text-white/30 italic mt-1">📚 {s.citare}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {result.suplimente_contraindicate?.length > 0 && (
            <div className="bg-red-500/[0.06] border border-red-500/[0.2] rounded-xl p-5">
              <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-3">⛔ Contraindicate cu medicatia ta</div>
              {result.suplimente_contraindicate.map((s: any, i: number) => (
                <div key={i} className="py-2 border-b border-red-500/[0.1]">
                  <div className="text-sm font-semibold text-red-400 mb-1">🚫 {s.supliment}</div>
                  <div className="text-xs text-white/55">{s.motivul}</div>
                  {s.alternativa && <div className="text-xs text-green-400/70 mt-1">✅ Alternativă: {s.alternativa}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab==='hormoni' && result.hormoni && (
        <div className="space-y-3 fade-in">
          <div className="card p-5">
            <div className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-3">⚗️ Evaluare hormonală</div>
            <p className="text-sm text-white/70 leading-relaxed mb-3">{result.hormoni.evaluare}</p>
            {result.hormoni.prioritati?.map((h: string,i: number) => (
              <div key={i} className="flex gap-2 py-2 border-t border-white/[0.05]">
                <span className="text-green-400 flex-shrink-0 text-sm">→</span>
                <span className="text-sm text-white/65 leading-relaxed">{h}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab==='sport' && result.sport && (
        <div className="space-y-2 fade-in">
          {[{icon:'📊',l:'Evaluare',v:result.sport.evaluare_curenta},{icon:'🎯',l:'Zona HR',v:result.sport.zona_recomandata},{icon:'📅',l:'Plan săptămânal',v:result.sport.plan_saptamana},{icon:'😴',l:'Recuperare',v:result.sport.recuperare}].filter(i=>i.v).map((item,i) => (
            <div key={i} className="card p-4 flex gap-3">
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              <div><div className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-1">{item.l}</div><div className="text-sm text-white/70 leading-relaxed">{item.v}</div></div>
            </div>
          ))}
        </div>
      )}

      {activeTab==='somn' && result.somn && (
        <div className="space-y-3 fade-in">
          <div className="card p-5">
            <p className="text-sm text-white/70 leading-relaxed mb-3">{result.somn.evaluare}</p>
            {result.somn.protocoale?.map((p: string,i: number) => (
              <div key={i} className="flex gap-2 py-2 border-t border-white/[0.05]">
                <span className="text-blue-400">🌙</span>
                <span className="text-sm text-white/60 leading-relaxed">{p}</span>
              </div>
            ))}
            <div className="flex gap-2 mt-3 flex-wrap">
              {result.somn.ora_culcare && <span className="text-xs text-green-400 bg-green-500/[0.08] border border-green-500/[0.2] px-3 py-1 rounded-full">🕙 {result.somn.ora_culcare}</span>}
              {result.somn.suplimente_somn && <span className="text-xs text-white/45 bg-white/[0.04] border border-white/[0.1] px-3 py-1 rounded-full">💊 {result.somn.suplimente_somn}</span>}
            </div>
          </div>
        </div>
      )}

      {activeTab==='mental' && result.sanatate_mintala && (
        <div className="space-y-3 fade-in">
          <div className="card p-5">
            <p className="text-sm text-white/70 leading-relaxed mb-3">{result.sanatate_mintala.evaluare}</p>
            {result.sanatate_mintala.practici?.map((p: string,i: number) => (
              <div key={i} className="flex gap-2 py-2 border-t border-white/[0.05]">
                <span className="text-purple-400">→</span>
                <span className="text-sm text-white/60 leading-relaxed">{p}</span>
              </div>
            ))}
            {result.sanatate_mintala.viata_sociala && (
              <div className="mt-3 bg-purple-500/[0.06] border border-purple-500/[0.18] rounded-xl p-3 text-xs text-white/65">{result.sanatate_mintala.viata_sociala}</div>
            )}
          </div>
        </div>
      )}

      {activeTab==='sex' && result.sanatate_sexuala && (
        <div className="space-y-3 fade-in">
          <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl text-xs text-white/30 leading-relaxed">
            🌹 Informații educaționale bazate pe studii clinice. Consultați un specialist pentru probleme specifice.
          </div>
          <div className="card p-5">
            <p className="text-sm text-white/70 leading-relaxed mb-3">{result.sanatate_sexuala.evaluare}</p>
            {result.sanatate_sexuala.recomandari?.map((r: string,i: number) => (
              <div key={i} className="flex gap-2 py-2 border-t border-white/[0.05]">
                <span className="text-green-400 flex-shrink-0">🌿</span>
                <span className="text-sm text-white/65 leading-relaxed">{r}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab==='antiaging' && result.anti_aging && (
        <div className="space-y-3 fade-in">
          <div className="bg-purple-500/[0.06] border border-purple-500/[0.18] rounded-xl p-5">
            <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-2">⏳ Vârstă biologică estimată</div>
            <div className="font-fraunces text-lg font-bold text-white/85">{result.anti_aging.varsta_biologica}</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-500/[0.05] border border-green-500/[0.15] rounded-xl p-4">
              <div className="text-[10px] font-bold text-green-400 uppercase tracking-wider mb-2">✓ Pro-longevitate</div>
              {result.anti_aging.prioritati?.map((p: string,i: number) => (
                <div key={i} className="text-xs text-white/60 mb-1.5 pl-2 border-l-2 border-green-500/30 leading-relaxed">{p}</div>
              ))}
            </div>
            <div className="bg-indigo-500/[0.05] border border-indigo-500/[0.15] rounded-xl p-4">
              <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-2">📋 Analize recomandate</div>
              {result.anti_aging.analize_recomandate?.map((a: string,i: number) => (
                <div key={i} className="text-xs text-white/55 mb-1.5 pl-2 border-l-2 border-indigo-500/30 leading-relaxed">{a}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab==='mit' && result.mit_demontat && (
        <div className="card p-5 fade-in">
          <div className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-3">🚫 Mitul demolat</div>
          <p className="text-sm text-white/70 leading-relaxed">{result.mit_demontat}</p>
        </div>
      )}

      <div className="card p-4">
        <div className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-2">⚕️ Disclaimer</div>
        <p className="text-xs text-white/25 leading-relaxed">{result.disclaimer} Urgențe: <strong className="text-white/40">112</strong></p>
      </div>
    </div>
  )

  // ── INPUT VIEW ─────────────────────────────────────────────────────────────
  return (
    <div className="fade-in space-y-4 max-w-2xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white mb-1">Analiză Wellness</h1>
          <p className="text-white/40 text-sm">Medicină funcțională · Studii reale citate · Personalizat</p>
        </div>
        <button onClick={() => { setSurse(EXEMPLU); setProfil('34 ani, femeie, 63kg, 168cm, alerg 3x/săpt, Hashimoto incipient') }}
          className="btn-ghost text-xs py-2 px-4">✨ Exemplu</button>
      </div>

      {/* Banner profil auto-incarcat */}
      {profilIncarcat && (
        <div className="flex items-center gap-3 p-3 bg-green-500/[0.08] border border-green-500/[0.2] rounded-xl">
          <span className="text-green-400 text-lg">✅</span>
          <div className="flex-1">
            <div className="text-xs font-semibold text-green-400">Profil încărcat automat</div>
            <div className="text-xs text-white/40 mt-0.5">Datele din Profilul meu au fost preluate. Poți adăuga date suplimentare mai jos.</div>
          </div>
          <Link href="/dashboard/profil" className="text-xs text-white/30 hover:text-white/60 flex-shrink-0">Editează →</Link>
        </div>
      )}

      {util?.plan === 'free' && (
        <div className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/[0.07] rounded-xl text-sm">
          <span className="text-white/40">{util?.analize_luna || 0}/10 analize luna aceasta</span>
          {(util?.analize_luna || 0) >= 10 && <Link href="/dashboard/cont" className="text-green-400 text-xs ml-auto">Upgrade →</Link>}
        </div>
      )}

      {/* Profil text */}
      <div className="card p-4">
        <label className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-2 block">👤 Profilul tău</label>
        <textarea rows={2} value={profil} onChange={e => setProfil(e.target.value)}
          className="input text-sm" placeholder="Vârstă, sex, greutate, înălțime, activitate fizică, obiective, medicație..." />
      </div>

      {/* Selector surse */}
      <div className="card p-4">
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {TIPURI_SURSE.map(s => (
            <button key={s.key} onClick={() => setSursaActiva(s.key)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                sursaActiva === s.key
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : surse[s.key]?.trim()
                    ? 'bg-white/[0.05] text-white/70 border border-white/[0.1]'
                    : 'text-white/30 hover:text-white/50'
              }`}>
              <span>{s.icon}</span>
              <span className="hidden sm:inline">{s.label.split(' ')[0]}</span>
              {surse[s.key]?.trim() && <span className="text-green-400 text-[10px]">✓</span>}
            </button>
          ))}
        </div>

        {TIPURI_SURSE.map(s => sursaActiva === s.key && (
          <div key={s.key}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-wider">{s.icon} {s.label}</label>
              <div className="flex gap-2">
                <input ref={fileRef} type="file" accept=".pdf,.txt,.csv" className="hidden" onChange={handleFile} />
                <button onClick={() => fileRef.current?.click()} disabled={pdfLoading} className="text-xs text-white/30 hover:text-white/60">
                  {pdfLoading ? '⏳' : '📎 Upload'}
                </button>
              </div>
            </div>
            <textarea rows={5} value={surse[s.key] || ''} onChange={e => setSurse(p => ({ ...p, [s.key]: e.target.value }))}
              className="input text-sm font-mono-dm" placeholder={s.placeholder} />
          </div>
        ))}
      </div>

      {/* Status surse */}
      <div className="flex flex-wrap gap-2">
        {TIPURI_SURSE.map(s => (
          <span key={s.key} className={`text-xs px-2.5 py-1 rounded-full ${
            surse[s.key]?.trim()
              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
              : 'bg-white/[0.03] text-white/25 border border-white/[0.07]'
          }`}>
            {s.icon} {surse[s.key]?.trim() ? '✓' : ''}
          </span>
        ))}
        {hasDate && <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/15 text-green-400 border border-green-500/30 font-semibold">{surseActive} surse active</span>}
      </div>

      <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
        <p className="text-xs text-white/28 leading-relaxed">
          ⚕️ <strong className="text-white/40">be-human nu este un serviciu medical.</strong> Rapoartele sunt educaționale. Urgențe: 112
        </p>
      </div>

      <button onClick={analizeaza}
        disabled={loading || !hasDate || (util?.plan === 'free' && (util?.analize_luna || 0) >= 10)}
        className="btn-green w-full py-4 text-base">
        {loading ? `⏳ ${loadMsg}` : '🌿 Analizează cu Medicina Funcțională v2'}
      </button>
    </div>
  )
}
