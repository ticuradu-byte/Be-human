export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minute — necesar pentru analiza AI cu date multiple
import { NextRequest, NextResponse } from 'next/server'

// Listă parametri medicali cunoscuți, fiecare cu regex de identificare a etichetei.
// Formatul real al buletinelor (Regina Maria și majoritatea laboratoarelor RO) e
// "VALOARE ETICHETĂ UNITATE [INTERVAL]" — ex: "283 COLESTEROL TOTAL mg/dL [120-200]".
// Căutăm eticheta, apoi numărul IMEDIAT ÎNAINTE (valoarea) și unitatea + intervalul
// IMEDIAT DUPĂ. O etichetă poate apărea de mai multe ori (ex. ca titlu de secțiune
// fără valoare) — încercăm toate aparițiile până găsim una cu un număr valid înainte.
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

const UNITATE_REGEX = /(mg\/dL|mg\/dl|g\/L|g\/dL|ng\/mL|[µμ]?UI\/mL|mmol\/L|pg|fL|%|U\/L|mil\.\/[µμ]L|mii\/[µμ]L|[µμ]g\/dL|mm\/h|pmol\/L|ml\/min[^\s,]*|[µμ]U\/mL)/i

function extrageParametru(text: string, label: string, labelRegexBase: RegExp): string | null {
  const labelRegexGlobal = new RegExp(labelRegexBase.source, 'gi')
  let m: RegExpExecArray | null
  while ((m = labelRegexGlobal.exec(text)) !== null) {
    const idx = m.index
    const inainte = text.slice(Math.max(0, idx - 20), idx)
    const numarMatch = inainte.match(/(\d+[.,]\d+|\d+)\s*$/)
    if (numarMatch) {
      const valoare = numarMatch[1]
      const dupa = text.slice(idx, idx + m[0].length + 70)
      const unitateMatch = dupa.match(UNITATE_REGEX)
      const unitate = unitateMatch ? unitateMatch[0] : ''
      const rangeMatch = dupa.match(/[\[<≥≤>]\s*[\d.,\s\-≥≤<>]+\)?\]?/)
      const range = rangeMatch ? ' ' + rangeMatch[0].trim() : ''
      return `${label}: ${valoare} ${unitate}${range}`.trim()
    }
    // eticheta a apărut fără valoare validă înainte — probabil titlu de secțiune; încearcă următoarea apariție
  }
  return null
}

// Compresie date medicale — extrage doar valorile numerice relevante
function compressaMedicale(text: string): string {
  if (!text || text.length < 200) return text

  // Elimină complet secțiunea de ISTORIC ("evoluția în timp") — sursă principală
  // de confuzie: AI-ul putea citi o valoare veche (ex. dintr-un test din 2023)
  // și o confunda cu rezultatul curent.
  const evolutieIdx = text.search(/iata\s+evolu[tț]ia\s+in\s+timp/i)
  const textCurent = evolutieIdx > -1 ? text.slice(0, evolutieIdx) : text

  const rezultate: string[] = []
  for (const [label, regex] of PARAMETRI_MEDICALI) {
    const rezultat = extrageParametru(textCurent, label, regex)
    if (rezultat) rezultate.push(rezultat)
  }

  // Extragerea direcționată a găsit suficiente valori — o folosim, e mult mai
  // precisă decât orice filtrare generică pe linii.
  if (rezultate.length >= 3) {
    return rezultate.join('\n')
  }

  // Fallback: format necunoscut (alt laborator) — trimitem un fragment din
  // textul original (fără istoric) ca să nu pierdem complet datele.
  return textCurent.slice(0, 3000)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Compresie automată a surselor mari
    if (body.messages?.[0]?.content) {
      const content = body.messages[0].content
      if (typeof content === 'string' && content.length > 2000) {
        // Extrage și comprimă secțiunile mari
        body.messages[0].content = content.replace(
          /(ANALIZE MEDICALE|ANALIZE):\n([\s\S]{200,}?)(?=\n\n[A-Z]|$)/gi,
          (match: string, label: string, data: string) => {
            return label + ':\n' + compressaMedicale(data)
          }
        )
      }
    }

    // Prompt Caching pentru system prompt
    let requestBody: any = { ...body }
    if (body.system && typeof body.system === 'string') {
      requestBody.system = [
        {
          type: 'text',
          text: body.system,
          cache_control: { type: 'ephemeral' }
        }
      ]
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'prompt-caching-2024-07-31',
      },
      body: JSON.stringify(requestBody),
    })

    const data = await res.json()
    const raw = data.content?.[0]?.text || ''

    // Log cost info
    const usage = data.usage || {}
    console.log('=== COST INFO ===')
    console.log('Input tokens:', usage.input_tokens)
    console.log('Output tokens:', usage.output_tokens)
    console.log('Cache created:', usage.cache_creation_input_tokens || 0)
    console.log('Cache read:', usage.cache_read_input_tokens || 0)
    console.log('Stop reason:', data.stop_reason)
    console.log('=== RAW RESPONSE (3000):', raw.slice(0, 3000))
    console.log('=== MESAJ (2000):', JSON.stringify(body.messages?.[0]?.content || '').slice(0, 2000))
    console.log('=== MESAJ (2000):', JSON.stringify(body.messages?.[0]?.content || '').slice(0, 2000))

    const cleaned = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim()

    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')

    if (start === -1 || end === -1) {
      console.error('No JSON found:', cleaned.slice(0, 300))
      return NextResponse.json({ error: 'no_json', raw: cleaned.slice(0, 500) }, { status: 422 })
    }

    const jsonStr = cleaned.slice(start, end + 1)

    try {
      const parsed = JSON.parse(jsonStr)
      return NextResponse.json({ success: true, result: parsed })
    } catch (parseErr) {
      console.error('Parse error:', parseErr)
      console.error('JSON (500):', jsonStr.slice(0, 500))
      return NextResponse.json({ error: 'parse_failed', raw: jsonStr.slice(0, 500) }, { status: 422 })
    }

  } catch (e: any) {
    console.error('API Error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
