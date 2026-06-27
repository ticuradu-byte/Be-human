export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'

// Compresie date medicale — extrage doar valorile numerice relevante
function compressaMedicale(text: string): string {
  if (!text || text.length < 200) return text

  // 1) Elimină complet secțiunea de ISTORIC ("evoluția în timp") — sursă principală
  //    de confuzie: AI-ul putea citi o valoare veche (ex. dintr-un test din 2023)
  //    și o confunda cu rezultatul curent.
  const evolutieIdx = text.search(/iata\s+evolu[tț]ia\s+in\s+timp|evolu[tț]ia\s+in\s+timp\s+a\s+analizelor/i)
  if (evolutieIdx > -1) text = text.slice(0, evolutieIdx)

  // 2) Prefixe de linii BOILERPLATE (praguri de interpretare, nu rezultate reale)
  //    — acestea conțin des cuvinte cheie + unități, dar NU sunt valoarea pacientului.
  const boilerplatePrefixe = /^\s*(pentru\b|optim\b|acceptabil\b|borderline\b|crescut\b|scazut\b|sc[aă]zut\b|moderat\b|usor\b|u[șş]or\b|foarte\b|interval de referin[tț]a|interpretare\b|status normal|status prediabet|status diabet|diagnosticul\b|deficit\b|nivel\b|barbati\s*:|b[aă]rba[tț]i\s*:|femei\s*:|trimestrul\b|calcul realizat|unde\s*:|scr\s*=|k\s*=|a\s*=|atentionare|aten[tț]ionare|conform ghidului|conform\b|homa-ir scor|homa-b\b|eGFR\s*:|persoane v[aă]rstince|explorarea metabolismului|nivelul fierului|rezultatele analizelor trebuie|examinarile\/unitatile|datele dumneavoastra|pentru vizualizarea|recomandare generala|^\d{2}\.\d{2}\.\d{4})/i

  const lines = text.split('\n')

  // 3) Liniile cu REZULTAT REAL: Nume parametru + valoare + unitate pe aceeași linie
  //    (formatul standard al buletinelor: "COLESTEROL TOTAL 283 mg/dL [120 - 200]")
  const esteRezultatReal = (line: string) => {
    const l = line.toLowerCase()
    const areKeyword = /(hemoglobina|feritina|vitamina|tsh|glucoza|colesterol|ldl|hdl|trigliceride|creatinina|uree|alt|ast|ggt|apob|crp|homocisteina|homa|insulina|cortizol|testosteron|estradiol|progesteron|fsh|lh|prolactina|tiroida|ft3|ft4|anti|egfr|vsh|fibrinogen|trombocite|leucocite|eritrocite|hematocrit|mcv|mch|acid uric|calciu|magneziu|potasiu|sodiu|fier)/i.test(l)
    const areValoareUnitate = /\d+[.,]?\d*\s*(mg|g|dl|ng|ui|mmol|miu|pg|µmol|mm|bpm|%|kcal|kg|cm|ms|h\/|l\/)/i.test(line)
    return areKeyword && areValoareUnitate && !boilerplatePrefixe.test(line)
  }

  const rezultateReale: string[] = []
  const altRelevant: string[] = []

  for (const line of lines) {
    if (boilerplatePrefixe.test(line)) continue
    const l = line.toLowerCase()
    if (esteRezultatReal(line)) {
      rezultateReale.push(line)
    } else if (
      /\d+[.,]?\d*\s*(mg|g|dl|ng|ui|mmol|miu|pg|µmol|mm|bpm|%|kcal|kg|cm|ms|h\/|l\/)/i.test(line) ||
      /(hrv|pasi|somn|stres|vo2|spo2|tensiune|puls|hr |body battery)/i.test(l)
    ) {
      altRelevant.push(line)
    }
  }

  // Rezultatele reale au prioritate absolută — niciodată tăiate de limita de linii
  const compressed = [...rezultateReale, ...altRelevant].slice(0, 60).join('\n')
  return compressed.length > 100 ? compressed : text.slice(0, 600)
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
