'use client'
// src/app/dashboard/analiza/page.tsx — v2 cu RAG + auto-populare din profil

import { useState, useRef, useCallback, useEffect } from 'react'
import { createBrowserClient, PLANURI } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { KNOWLEDGE_BASE_V2 } from '@/lib/knowledge-base-v2'
import { KNOWLEDGE_BASE_MEDICAL_V3 } from '@/lib/knowledge-base-medical'


function parseCSVUniversal(csvText: string): string {
  const lines = csvText.split('\n').filter(l => l.trim())
  if (lines.length < 2) return csvText.slice(0, 600)
  const headers = lines[0].split(/[,;\t]/).map(h => h.trim().toLowerCase().replace(/['"]/g, ''))
  const COLOANE: Record<string, string> = {
    'hrv':'HRV','heart_rate_variability':'HRV','hrv_avg':'HRV',
    'steps':'Pași','step_count':'Pași','pasi':'Pași',
    'sleep':'Somn','sleep_duration':'Somn','total_sleep':'Somn',
    'spo2':'SpO2','blood_oxygen':'SpO2','oxygen':'SpO2',
    'heart_rate':'HR','hr':'HR','pulse':'HR','resting_hr':'HR repaus',
    'calories':'Calorii','kcal':'Calorii','active_calories':'Calorii active',
    'stress':'Stres','stress_score':'Stres',
    'weight':'Greutate','body_weight':'Greutate',
    'temperature':'Temperatură','skin_temp':'Temp piele',
    'vo2max':'VO2max','vo2_max':'VO2max',
    'body_fat':'Body Fat %','fat_percentage':'Body Fat %',
    'deep_sleep':'Somn profund','rem_sleep':'Somn REM',
    'readiness':'Readiness','recovery':'Recovery',
  }
  const relevant: {idx: number, label: string}[] = []
  headers.forEach((h, idx) => {
    const label = COLOANE[h] || COLOANE[h.replace(/ /g,'_')]
    if (label) relevant.push({ idx, label })
  })
  if (relevant.length === 0) return csvText.slice(0, 600)
  const sums: Record<string, {sum: number, count: number}> = {}
  relevant.forEach(r => { sums[r.label] = { sum: 0, count: 0 } })
  lines.slice(1, 31).forEach(line => {
    const cols = line.split(/[,;\t]/).map(c => c.trim().replace(/['"]/g,''))
    relevant.forEach(r => {
      const val = parseFloat(cols[r.idx])
      if (!isNaN(val) && val > 0) { sums[r.label].sum += val; sums[r.label].count++ }
    })
  })
  const results: string[] = []
  relevant.forEach(r => {
    const d = sums[r.label]
    if (d.count > 0) {
      const avg = Math.round((d.sum/d.count)*10)/10
      results.push(`${r.label}: ${avg} (medie ${d.count} zile)`)
    }
  })
  return results.length > 0 ? 'Date importate din dispozitiv:\n' + results.join('\n') : csvText.slice(0, 600)
}

// ── SYSTEM PROMPT EXTINS ──────────────────────────────────────────────────────
const SYSTEM_PROMPT_BASE = `Ești be-human, agent wellness funcțional. Analizează datele utilizatorului și returnează DOAR JSON valid, fără markdown, fără text în afara JSON-ului.

MEDICATIE SI BOLI: {MEDICATIE}
DATE UTILIZATOR: {DATE}

REGULI STRICTE:
- Returnează DOAR JSON, nimic altceva
- Texte SCURTE: max 15 cuvinte per câmp string
- Liste: max 3-4 items
- Nu repeta date din input

CÂMPURILE lumina_naturala, conexiune_sociala, sanatate_sexuala și micro_actiune_azi sunt OBLIGATORII în orice raport, chiar dacă utilizatorul nu a dat date despre ele — completează cu recomandare generală bazată pe profil (vârstă/sex). Nu le poți omite sau lăsa goale.

Câmpul sanatate_sexuala.frecventa_recomandata este OBLIGATORIU: o recomandare CONCRETĂ de frecvență (ex. "1-2 ori/săptămână") calculată exact din vârsta și sexul din profilul utilizatorului, menționând scurt beneficiul (cardiovascular, hormonal, longevitate) — niciodată generică, niciodată omisă.

Câmpul hormoni.optimizare_naturala este OBLIGATORIU: minim 3 sfaturi concrete dovedite clinic pentru optimizarea naturală a hormonilor (testosteron/DHEA la bărbați, estrogen/progesteron la femei) — somn 7-9h, antrenament de forță, vitamina D, zinc/magneziu, reducere cortizol/stres, alimentație cu grăsimi sănătoase. Câmpul hormoni.hormoni_de_verificat trebuie să recomande analize specifice adaptate sexului din profil (bărbați: testosteron total/liber, SHBG, DHEA, cortizol; femei: estrogen, progesteron, TSH, prolactină).

Câmpul sanatate_mintala.practici trebuie să conțină MINIM 5 practici diverse și dovedite științific (somn, mișcare, respirație, conexiune socială, expunere la natură/lumină, mindfulness, jurnal de recunoștință) — nu doar 2.

ANALIZE MULTIPLE / TREND: dacă în datele de analize medicale apare textul "ATENȚIE: există MULTIPLE analize din date diferite" cu mai multe buletine etichetate cu dată, FOLOSEȘTE valorile din buletinul marcat "CEL MAI RECENT" ca status ACTUAL al pacientului (acelea intră în scor_wellness, alerte_medicale, diagnostic_functional). NU ignora însă buletinele mai vechi — menționează explicit evoluția/trendul în diagnostic_functional (ex. "Colesterolul a crescut de la 262 la 283 mg/dL în 20 de zile" sau "Glicemia s-a îmbunătățit ușor"). Dacă o valoare s-a deteriorat semnificativ între cele două date, tratează asta ca un semnal de alertă suplimentar în alerte_medicale.

Câmpul sanatate_sexuala.etapa_viata este OBLIGATORIU: identifică etapa de viață relevantă din vârsta și sexul din profil (ex. "Adult tânăr" sub 35 ani, "Adult activ" 35-44 ani, "Andropauză" pentru bărbați 45+, "Perimenopauză"/"Menopauză" pentru femei 45+/55+) și adaptează evaluarea și recomandările specific acestei etape — nu generic pentru toate vârstele.

Câmpul sanatate_sexuala.comparatie_populationala este OBLIGATORIU: un mesaj de normalizare bazat pe date populaționale pentru grupa de vârstă/sex din profil (ex. "Frecvența ta este în intervalul normal raportat pentru bărbați 45-50 ani"). Scopul este reducerea anxietății prin context, NU presiune sau judecată.

Câmpul hormoni.etapa_hormonala este OBLIGATORIU: similar cu etapa_viata, context hormonal specific (ex. "Andropauză incipientă", "Perimenopauză", "Adult tânăr cu hormoni stabili").

Câmpul hormoni.medicatie_libido_alert: generează acest câmp DOAR dacă în MEDICATIE SI BOLI există un medicament din clase cunoscute cu efect asupra libidoului — antidepresive ISRS (sertralină, fluoxetină, paroxetină, escitalopram), beta-blocante, anticoncepționale hormonale, finasteridă, antihipertensive. Format: {"medicament":"nume identificat","efect_posibil":"scurt","recomandare":"discută cu medicul despre alternative, nu întrerupe tratamentul fără sfat medical"}. Dacă nu există medicație relevantă în input, OMITE complet acest câmp (nu-l completa cu null sau gol).

PONDERE ÎN SCORUL GENERAL: secțiunile sanatate_sexuala și hormoni au pondere crescută (≈15-20% combinat) în calculul scor_wellness și în diagnostic_functional ATUNCI CÂND utilizatorul a completat date de profil relevante (vârstă, sex, medicație, simptome hormonale) — nu le trata ca secțiuni secundare/decorative. Dacă diagnostic_functional sau cercul_vicios/cercul_virtuos pot integra un element hormonal/sexual relevant (ex. stres → cortizol → libido → relație), fă legătura explicit, nu le trata izolat.

JSON OBLIGATORIU (completează toate câmpurile, NU omite niciun câmp de mai jos):
{"scor_wellness":75,"scor_label":"Bine","salut":"1 propoziție scurtă","micro_actiune_azi":"1 lucru sub 5 minute de făcut chiar acum","lumina_naturala":{"recomandare":"X min soare dimineața","vitamina_d_status":"optim/suboptim"},"conexiune_sociala":{"evaluare":"scurt","actiune_saptamana":"1 acțiune concretă"},"sanatate_sexuala":{"evaluare":"scurt adaptat sex/vârstă","etapa_viata":"Adult activ/Andropauză/Perimenopauză — calculat din vârstă+sex","frecventa_recomandata":"X ori/săptămână — calculat din vârsta și sexul din profil, bazat pe studii (beneficii CV, hormonale, longevitate)","comparatie_populationala":"mesaj de normalizare bazat pe date populaționale pentru grupa de vârstă/sex","recomandari":["item1","item2"]},"diagnostic_functional":"max 2 propoziții","urmatorul_pas":"1 acțiune concretă","cercul_vicios":"optional scurt","cercul_virtuos":"optional scurt","alerte_medicale":[{"parametru":"nume","valoare":"X mg/dL","nivel":"rosu","mesaj":"scurt","actiune":"scurt","urgenta":"X zile"}],"insights":[{"icon":"emoji","titlu":"3-5 cuvinte","descriere":"max 15 cuvinte","actiune":"max 10 cuvinte","prioritate":"ridicata","categorie":"tip","mecanism":"scurt","citare":"","impact":"scurt"}],"nutritie":{"calorii_recomandate":2000,"proteine_g":150,"carbohidrati_g":200,"grasimi_g":70,"apa_litri":2.5,"alimente_prioritare":["item1","item2","item3"],"alimente_reduce":["item1","item2"],"plan_zi":{"dimineata":"scurt","pranz":"scurt","seara":"scurt"}},"hormoni":{"evaluare":"scurt","etapa_hormonala":"Andropauză incipientă/Perimenopauză/Adult tânăr stabil","prioritati":["item1","item2"],"optimizare_naturala":["sfat1 dovedit clinic pentru creșterea testosteronului/hormonilor benefici, adaptat sex/vârstă","sfat2","sfat3"],"hormoni_de_verificat":["analiza1 adaptată sexului din profil","analiza2"],"medicatie_libido_alert":{"medicament":"OMITE complet câmpul dacă nu există medicație relevantă","efect_posibil":"scurt","recomandare":"discută cu medicul despre alternative"}},"sport":{"evaluare_curenta":"scurt","zona_recomandata":"scurt","plan_saptamana":"scurt","recuperare":"scurt","outdoor_specific":"recomandare concretă în aer liber: parc, traseu, lac — nu generic 'cardio'"},"somn":{"evaluare":"scurt","protocoale":["item1","item2"],"ora_culcare":"22:30","suplimente_somn":"optional"},"lumina_naturala":{"recomandare":"min minute soare dimineața + motivul","vitamina_d_status":"optim/suboptim bazat pe analize sau generic"},"conexiune_sociala":{"evaluare":"scurt, bazat pe ce a declarat sau generic","actiune_saptamana":"1 acțiune socială concretă: cină, apel, activitate cu prieten"},"sanatate_mintala":{"evaluare":"scurt","practici":["item1 (somn)","item2 (miscare)","item3 (respiratie)","item4 (conexiune sociala/natura)","item5 (mindfulness)"],"viata_sociala":"scurt"},"sanatate_sexuala":{"evaluare":"scurt, adaptat sex/vârstă, generic dacă fără date","etapa_viata":"Adult activ/Andropauză/Perimenopauză — calculat din vârstă+sex","frecventa_recomandata":"recomandare specifică de frecvență (X ori/săptămână) bazată pe studii, adaptată exact la vârsta și sexul din profil — nu generic","comparatie_populationala":"mesaj de normalizare bazat pe date populaționale pentru grupa de vârstă/sex","recomandari":["item1","item2"]},"anti_aging":{"varsta_biologica":"X ani","prioritati":["item1","item2"],"analize_recomandate":["item1","item2"]},"suplimente_sigure":[{"supliment":"Nume","doza":"Xmg","motiv":"scurt","timing":"dimineata","citare":""}],"suplimente_contraindicate":[],"mit_demontat":"max 20 cuvinte","disclaimer":"Informații educaționale. Urgențe: 112"}`

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

// ── EXTRAGERE VALORI ANALIZE MEDICALE ─────────────────────────────────────────
// Formatul real extras din PDF-uri (Regina Maria și majoritatea laboratoarelor RO)
// e "VALOARE ETICHETĂ UNITATE [INTERVAL]" (ex: "283 COLESTEROL TOTAL mg/dL [120-200]"),
// totul concatenat fără linii separate. Căutăm explicit fiecare parametru cunoscut,
// ca să trimitem către AI doar valorile reale, compact — nu textul brut (care poate
// avea 8000+ caractere și se taie înainte să ajungă la rezultatele relevante).
const PARAMETRI_MEDICALI: [string, RegExp][] = [
  ['Colesterol total', /colesterol total/i],
  ['HDL colesterol', /hdl colesterol/i],
  ['LDL colesterol', /ldl colesterol/i],
  ['Colesterol non-HDL', /colesterol non-hdl|nonhdl/i],
  ['Trigliceride', /trigliceride/i],
  ['Glicemie', /glucoza serica \(glicemie\)|glicemie/i],
  ['HbA1c', /hemoglobina glicozilata|hb a1c/i],
  ['Creatinina', /creatinina seric/i],
  ['Uree', /\buree\b/i],
  ['Acid uric', /acid uric/i],
  ['Calciu', /calciu seric/i],
  ['Magneziu', /magneziu seric/i],
  ['Potasiu', /potasiu seric/i],
  ['Sodiu', /sodiu seric/i],
  ['Fier seric', /fier seric/i],
  ['TSH', /\btsh\b/i],
  ['FT4', /\bft4\b/i],
  ['FT3', /\bft3\b/i],
  ['Vitamina D', /(?:25-oh-)?vitamina d/i],
  ['Hemoglobina', /hemoglobina \(hgb\)/i],
  ['Hematocrit', /hematocrit/i],
  ['Leucocite', /numar de leucocite/i],
  ['Trombocite', /numar de trombocite/i],
  ['VSH', /\bvsh\b/i],
  ['ALT', /alaninaminotransferaza/i],
  ['AST', /aspartataminotransferaza/i],
  ['Apolipoproteina A1', /apolipoproteina a1/i],
  ['Apolipoproteina B', /apolipoproteina b/i],
  ['Insulina', /\binsulina\b/i],
  ['HOMA-IR', /homa-ir/i],
  ['HOMA-B', /\bhoma b\b|homa-b/i],
  ['eGFR', /rata estimata a filtrarii glomerulare|\begfr\b/i],
  ['Creatinkinaza', /creatinkinaza/i],
  ['Anti-TPO', /anticorpi anti-tpo/i],
  ['Feritina', /\bferitina\b/i],
  ['CRP', /proteina c reactiva|\bcrp\b/i],
  ['Testosteron', /testosteron/i],
  ['Cortizol', /\bcortizol\b/i],
  ['Estradiol', /estradiol/i],
  ['Progesteron', /progesteron/i],
  ['Homocisteina', /homocisteina/i],
]

const UNITATE_REGEX_ANALIZE = /(mg\/dL|mg\/dl|g\/L|g\/dL|ng\/mL|[µμ]?UI\/mL|mmol\/L|pg|fL|%|U\/L|mil\.\/[µμ]L|mii\/[µμ]L|[µμ]g\/dL|mm\/h|pmol\/L|ml\/min[^\s,]*|[µμ]U\/mL)/i

function extrageParametruMedical(text: string, label: string, labelRegexBase: RegExp): string | null {
  const labelRegexGlobal = new RegExp(labelRegexBase.source, 'gi')
  let m: RegExpExecArray | null
  while ((m = labelRegexGlobal.exec(text)) !== null) {
    const idx = m.index
    const inainte = text.slice(Math.max(0, idx - 20), idx)
    const numarMatch = inainte.match(/(\d+[.,]\d+|\d+)\s*$/)
    if (numarMatch) {
      const valoare = numarMatch[1]
      const dupa = text.slice(idx, idx + m[0].length + 70)
      const unitateMatch = dupa.match(UNITATE_REGEX_ANALIZE)
      const unitate = unitateMatch ? unitateMatch[0] : ''
      const rangeMatch = dupa.match(/[\[<≥≤>]\s*[\d.,\s\-≥≤<>]+\)?\]?/)
      const range = rangeMatch ? ' ' + rangeMatch[0].trim() : ''
      return `${label}: ${valoare} ${unitate}${range}`.trim()
    }
  }
  return null
}

function extrageDinBlocUnic(textBrut: string): string[] {
  if (!textBrut || textBrut.length < 200) return []
  const evolutieIdx = textBrut.search(/iata\s+evolu[tț]ia\s+in\s+timp/i)
  const textCurent = evolutieIdx > -1 ? textBrut.slice(0, evolutieIdx) : textBrut

  const rezultate: string[] = []
  for (const [label, regex] of PARAMETRI_MEDICALI) {
    const r = extrageParametruMedical(textCurent, label, regex)
    if (r) rezultate.push(r)
  }
  return rezultate
}

function extrageDataDinNumeFisier(numeBloc: string): string {
  // Caută un model de dată în numele fișierului: 2026_06_29, 2026-06-29, 29.06.2026 etc.
  const m1 = numeBloc.match(/(\d{4})[_\-](\d{2})[_\-](\d{2})/)
  if (m1) return `${m1[3]}.${m1[2]}.${m1[1]}`
  const m2 = numeBloc.match(/(\d{2})[.\-](\d{2})[.\-](\d{4})/)
  if (m2) return `${m2[1]}.${m2[2]}.${m2[3]}`
  return numeBloc
}

// Extrage DATA REALĂ a analizei din conținutul PDF-ului (nu din numele fișierului —
// numele poate fi greșit/arbitrar, ex. un fișier salvat ca "...2026_06_09.pdf" poate
// conține de fapt o analiză din 25.02.2026). Caută explicit "Data - ora recoltare"
// sau "Data - ora cerere", care sunt câmpurile standard din buletinele românești.
function extrageDataDinContinut(text: string): string | null {
  const m = text.match(/Data\s*-?\s*ora\s*(?:recoltare|cerere)\s*:?\s*(\d{2})[.\-](\d{2})[.\-](\d{4})/i)
  if (m) return `${m[1]}.${m[2]}.${m[3]}`
  return null
}

function dataLaTimestamp(dataStr: string): number {
  // Convertește "DD.MM.YYYY" în timestamp, pentru sortare cronologică corectă
  const m = dataStr.match(/(\d{2})\.(\d{2})\.(\d{4})/)
  if (!m) return 0
  return new Date(`${m[3]}-${m[2]}-${m[1]}`).getTime()
}

function extrageAnalizeMedicale(textBrut: string): string {
  if (!textBrut || textBrut.length < 200) return textBrut

  // Detectează markerii "=== Buletin ... ===" care separă fișiere uploadate distinct.
  // Dacă există MAI MULTE buletine, le procesăm separat și le prezentăm cu dată,
  // ca AI-ul să poată compara valori (trend), nu doar să citească primul găsit.
  const markerRegex = /===\s*(.+?)\s*===/g
  const markere: { titlu: string; index: number }[] = []
  let mm: RegExpExecArray | null
  while ((mm = markerRegex.exec(textBrut)) !== null) {
    markere.push({ titlu: mm[1], index: mm.index })
  }

  if (markere.length >= 2) {
    const blocuri: { eticheta: string; rezultate: string[]; timestamp: number }[] = []
    for (let i = 0; i < markere.length; i++) {
      const start = markere[i].index
      const end = i + 1 < markere.length ? markere[i + 1].index : textBrut.length
      const blocText = textBrut.slice(start, end)
      const rezultateBloc = extrageDinBlocUnic(blocText)
      if (rezultateBloc.length > 0) {
        // PRIORITATE: data reală din conținutul PDF-ului. Doar dacă nu se găsește,
        // recurge la numele fișierului (poate fi greșit/arbitrar).
        const dataConinut = extrageDataDinContinut(blocText)
        const data = dataConinut || extrageDataDinNumeFisier(markere[i].titlu)
        blocuri.push({ eticheta: `${data} (${markere[i].titlu})`, rezultate: rezultateBloc, timestamp: dataLaTimestamp(data) })
      }
    }
    if (blocuri.length >= 2) {
      // Sortare CRONOLOGICĂ reală (nu ordinea uploadului) — cel mai recent e
      // determinat de data efectivă a analizei, nu de ordinea în care au fost încărcate
      blocuri.sort((a, b) => a.timestamp - b.timestamp)
      const parti = blocuri.map((b, i) =>
        `📅 ${b.eticheta}${i === blocuri.length - 1 ? ' — CEL MAI RECENT' : ''}:\n${b.rezultate.join('\n')}`
      )
      return (
        'ATENȚIE: există MULTIPLE analize din date diferite mai jos, sortate cronologic. ' +
        'Folosește valorile din cel mai recent buletin ca status ACTUAL, dar COMPARĂ cu cele ' +
        'vechi și menționează explicit evoluția/trendul (ce a crescut, ce a scăzut, ce s-a ' +
        'îmbunătățit) — calculează diferența de timp REALĂ dintre datele indicate.\n\n' +
        parti.join('\n\n')
      )
    }
  }

  // Un singur buletin (sau format fără markere) — comportament normal
  const rezultate = extrageDinBlocUnic(textBrut)
  if (rezultate.length >= 3) return rezultate.join('\n')
  const evolutieIdx = textBrut.search(/iata\s+evolu[tț]ia\s+in\s+timp/i)
  const textCurent = evolutieIdx > -1 ? textBrut.slice(0, evolutieIdx) : textBrut
  return textCurent.slice(0, 4000)
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

  // ANALIZE — PDF/text (extragere directionată, nu trunchiere brută)
  const analizeText = p.analize_text || ''
  if (analizeText) surse.analize = extrageAnalizeMedicale(analizeText)

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
  const gfitTxtRef = useRef('')
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
        .then(async ({ data }) => {
          // Auto-load toate wearables conectate
          try {
            const syncRes = await fetch(`/api/wearables/sync?user_id=${user.id}`)
            const syncData = await syncRes.json()
            if (syncData.ok && syncData.zile?.length > 0) {
              const zile = syncData.zile
              const azi = syncData.azi
              const zile7 = zile.slice(-7)
              const zile30 = zile

              // Calculează statistici per perioadă
              const stat = (arr: any[]) => ({
                pasi: Math.round(arr.reduce((a: number, z: any) => a + (z.pasi||0), 0) / arr.length),
                calorii: Math.round(arr.reduce((a: number, z: any) => a + (z.calorii||0), 0) / arr.length),
                hr: Math.round(arr.filter((z: any) => z.hr_medie > 0).reduce((a: number, z: any) => a + z.hr_medie, 0) / Math.max(1, arr.filter((z: any) => z.hr_medie > 0).length)),
                min: Math.round(arr.reduce((a: number, z: any) => a + (z.minute_active||0), 0) / arr.length),
              })

              const s7 = stat(zile7)
              const s30 = stat(zile30)

              const dataAzi = new Date().toLocaleDateString('ro-RO')
              const txt = `CONTEXT TEMPORAL IMPORTANT:
- Data analizei: ${dataAzi}
- Analizele medicale uploadate pot fi din urmă cu 1-6 luni — interpretează valorile ținând cont că starea fizică actuală poate fi diferită
- Datele wearables sunt RECENTE (ultimele 30 zile) și reflectă starea fizică ACTUALĂ
- Dacă există discrepanță între analize și wearables — menționează că analizele sunt mai vechi

Date wearables (${syncData.surse_active?.join(' + ') || 'Google Fit'}):

Ultima zi (${azi?.data}):
- Pași: ${azi?.pasi?.toLocaleString()} | Calorii: ${azi?.calorii} kcal | HR: ${syncData.hr_medie || '—'} bpm | Minute active: ${azi?.minute_active} min${syncData.greutate ? ` | Greutate: ${syncData.greutate} kg` : ''}

Medie ultimele 7 zile:
- Pași: ${s7.pasi.toLocaleString()} | Calorii: ${s7.calorii} kcal | HR: ${s7.hr} bpm | Minute active: ${s7.min} min

Medie ultimele 30 zile:
- Pași: ${s30.pasi.toLocaleString()} | Calorii: ${s30.calorii} kcal | HR: ${s30.hr} bpm | Minute active: ${s30.min} min`

              gfitTxtRef.current = txt
              setSurse(p => ({ ...p, garmin: txt }))
            }
          } catch(e) { console.log('Sync wearables error:', e) }

          if (data?.profil_complet) {
            const p = data.profil_complet

            // Auto-populare câmp profil text
            const profilText = buildProfilText(p)
            if (profilText) setProfil(profilText)

            // Auto-populare surse
            const surseNoi = buildSurseFromProfil(p)
            if (Object.keys(surseNoi).length > 0) {
              setSurse(prev => ({ ...prev, ...surseNoi, ...(gfitTxtRef.current ? { garmin: gfitTxtRef.current } : {}) }))
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
        reader.onload = ev => {
          const text = ev.target?.result as string
          const ext = file.name.split('.').pop()?.toLowerCase()
          const parsed = (ext === 'csv' || ext === 'txt') ? parseCSVUniversal(text) : text
          setSurse(p => ({ ...p, [sursaActiva]: parsed }))
        }
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
          model: 'claude-sonnet-4-5',
          max_tokens: 8000,
          system: systemPrompt,
          messages: [{ role: 'user', content: 'Analizează datele mele. JSON OBLIGATORIU să conțină TOATE câmpurile din schemă inclusiv: micro_actiune_azi, lumina_naturala, conexiune_sociala, sanatate_sexuala. Completează cu recomandări generale dacă lipsesc datele specifice.' }],
        }),
      })

      const data = await res.json()
      console.log("DATA FROM API:", JSON.stringify(data).slice(0, 500)); const parsed = data.result || JSON.parse((data.content?.[0]?.text || "{}").replace(/```json|```/g, "").trim())


      console.log("RESULT COMPLET:", JSON.stringify(parsed, null, 2)); setResult(parsed)
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
    ['overview', '📊', 'Overview'],
    ['insights', '💡', 'Insights'],
    ['nutritie', '🥗', 'Nutriție'],
    areCiclu ? ['ciclu', '🌙', 'Ciclu'] : null,
    areCGM   ? ['cgm_tab', '📈', 'Glicemie'] : null,
    ['hormoni', '⚗️', 'Hormoni'],
    ['suplimente', '💊', 'Suplimente'],
    ['sport', '🏃', 'Sport'],
    ['somn', '😴', 'Somn'],
    ['mental', '🧠', 'Mental'],
    ['sex', '🌹', 'Sexual'],
    ['antiaging', '⏳', 'Anti-aging'],
    ['mit', '🚫', 'Mituri'],
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
        {TABS_RESULT.map(([k, icon, label]) => (
          <button key={k} onClick={() => setActiveTab(k as any)}
            title={label}
            className={`flex-shrink-0 font-medium px-3 py-2.5 rounded-xl transition-all flex flex-col items-center gap-0.5 min-w-[48px] ${
              activeTab===k
                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04] border border-transparent'
            }`}>
            <span className="text-lg leading-none">{icon}</span>
            <span className="text-[9px] uppercase tracking-wide leading-none">{label?.slice(0,6)}</span>
          </button>
        ))}
      </div>

      {activeTab==='overview' && (
        <div className="space-y-3 fade-in">
          {result.micro_actiune_azi && (
            <div className="rounded-xl p-4 bg-green-500/[0.1] border border-green-500/[0.25]">
              <div className="text-[10px] font-bold text-green-400 uppercase tracking-wider mb-1.5">⚡ Fă asta acum — sub 5 minute</div>
              <div className="text-sm text-white/85 font-medium leading-relaxed">{result.micro_actiune_azi}</div>
            </div>
          )}
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
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="text-[10px] font-bold text-white/30 uppercase tracking-wider">⚗️ Evaluare hormonală</div>
              {result.hormoni.etapa_hormonala && (
                <span className="text-[10px] text-purple-300 bg-purple-500/[0.12] border border-purple-500/[0.25] px-2.5 py-1 rounded-full">{result.hormoni.etapa_hormonala}</span>
              )}
            </div>
            <p className="text-sm text-white/70 leading-relaxed mb-3">{result.hormoni.evaluare}</p>
            {result.hormoni.prioritati?.map((h: string,i: number) => (
              <div key={i} className="flex gap-2 py-2 border-t border-white/[0.05]">
                <span className="text-green-400 flex-shrink-0 text-sm">→</span>
                <span className="text-sm text-white/65 leading-relaxed">{h}</span>
              </div>
            ))}
          </div>
          {result.hormoni.medicatie_libido_alert && (
            <div style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.3)', borderLeft: '4px solid #ef4444' }} className="rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-xl">💊</span>
                <div>
                  <div className="text-sm font-bold text-red-400 mb-1">Posibilă interacțiune medicație ↔ libido: {result.hormoni.medicatie_libido_alert.medicament}</div>
                  <div className="text-xs text-white/65 leading-relaxed mb-1">{result.hormoni.medicatie_libido_alert.efect_posibil}</div>
                  <div className="text-xs font-semibold text-red-400">→ {result.hormoni.medicatie_libido_alert.recomandare}</div>
                </div>
              </div>
            </div>
          )}
          {result.hormoni.optimizare_naturala?.length > 0 && (
            <div className="bg-amber-500/[0.06] border border-amber-500/[0.18] rounded-xl p-5">
              <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-3">⚡ Optimizare hormonală naturală</div>
              {result.hormoni.optimizare_naturala.map((o: string,i: number) => (
                <div key={i} className="flex gap-2 py-2 border-t border-amber-500/[0.1]">
                  <span className="text-amber-400 flex-shrink-0">💪</span>
                  <span className="text-sm text-white/65 leading-relaxed">{o}</span>
                </div>
              ))}
            </div>
          )}
          {result.hormoni.hormoni_de_verificat?.length > 0 && (
            <div className="bg-indigo-500/[0.06] border border-indigo-500/[0.15] rounded-xl p-5">
              <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-3">🧪 Hormoni de verificat (analize)</div>
              {result.hormoni.hormoni_de_verificat.map((h: string,i: number) => (
                <div key={i} className="text-xs text-white/55 mb-1.5 pl-2 border-l-2 border-indigo-500/30 leading-relaxed">{h}</div>
              ))}
            </div>
          )}
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

          {result.lumina_naturala && (
            <div className="card p-5">
              <div className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider mb-2">☀️ Lumină naturală & Vitamina D</div>
              <p className="text-sm text-white/70 leading-relaxed mb-2">{result.lumina_naturala.recomandare}</p>
              {result.lumina_naturala.vitamina_d_status && (
                <div className="text-xs text-yellow-400/70 bg-yellow-500/[0.06] rounded-lg px-3 py-2 inline-block">
                  Status Vit. D: {result.lumina_naturala.vitamina_d_status}
                </div>
              )}
            </div>
          )}

          {result.conexiune_sociala && (
            <div className="card p-5">
              <div className="text-[10px] font-bold text-pink-400 uppercase tracking-wider mb-2">👥 Conexiune socială</div>
              <p className="text-sm text-white/70 leading-relaxed mb-2">{result.conexiune_sociala.evaluare}</p>
              {result.conexiune_sociala.actiune_saptamana && (
                <div className="text-xs text-pink-400/80 bg-pink-500/[0.06] border border-pink-500/[0.15] rounded-lg px-3 py-2">
                  ✅ {result.conexiune_sociala.actiune_saptamana}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab==='sex' && result.sanatate_sexuala && (
        <div className="space-y-3 fade-in">
          <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl text-xs text-white/30 leading-relaxed flex items-center justify-between flex-wrap gap-2">
            <span>🌹 Informații educaționale bazate pe studii clinice. Consultați un specialist pentru probleme specifice.</span>
            {result.sanatate_sexuala.etapa_viata && (
              <span className="text-[10px] text-pink-300 bg-pink-500/[0.12] border border-pink-500/[0.25] px-2.5 py-1 rounded-full flex-shrink-0">{result.sanatate_sexuala.etapa_viata}</span>
            )}
          </div>
          {result.sanatate_sexuala.frecventa_recomandata && (
            <div className="bg-pink-500/[0.08] border border-pink-500/[0.2] rounded-xl p-4">
              <div className="text-[10px] font-bold text-pink-400 uppercase tracking-wider mb-1.5">💕 Frecvență recomandată pentru profilul tău</div>
              <div className="text-sm text-white/85 font-medium leading-relaxed">{result.sanatate_sexuala.frecventa_recomandata}</div>
            </div>
          )}
          {result.sanatate_sexuala.comparatie_populationala && (
            <div className="bg-green-500/[0.06] border border-green-500/[0.18] rounded-xl p-4">
              <div className="text-[10px] font-bold text-green-400 uppercase tracking-wider mb-1.5">📊 Context — nu ești singur(ă)</div>
              <div className="text-sm text-white/75 leading-relaxed">{result.sanatate_sexuala.comparatie_populationala}</div>
            </div>
          )}
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
                <input ref={fileRef} type="file" accept=".pdf,.txt,.csv,.json" className="hidden" onChange={handleFile} />
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
