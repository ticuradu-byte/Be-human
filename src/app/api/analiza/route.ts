import { NextRequest, NextResponse } from 'next/server'

// Compresie date medicale — extrage doar valorile numerice relevante
function compressaMedicale(text: string): string {
  if (!text || text.length < 200) return text
  const lines = text.split('\n')
  const relevante = lines.filter(line => {
    const l = line.toLowerCase()
    return (
      /\d+[.,]?\d*\s*(mg|g|dl|ng|ui|mmol|miu|pg|µmol|mm|bpm|%|kcal|kg|cm|ms|h\/|l\/)/i.test(line) ||
      /(hemoglobina|feritina|vitamina|tsh|glucoza|colesterol|ldl|hdl|trigliceride|creatinina|uree|alt|ast|ggt|apob|crp|homocisteina|homa|insulina|cortizol|testosteron|estradiol|progesteron|fsh|lh|prolactina|tiroida|ft3|ft4|anti|egfr|vsh|fibrinogen|trombocite|leucocite|eritrocite|hematocrit|mcv|mch)/i.test(l) ||
      /(hrv|pasi|somn|stres|vo2|spo2|tensiune|puls|hr |body battery)/i.test(l)
    )
  })
  const compressed = relevante.slice(0, 60).join('\n')
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
