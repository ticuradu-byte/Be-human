// src/app/api/rag/route.ts
// RAG endpoint — caută studii relevante și generează răspuns cu citări reale

import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

const openai    = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Categorii detectate din datele utilizatorului
function detectCategorii(dateUtilizator: string): string[] {
  const cat: string[] = []
  const d = dateUtilizator.toLowerCase()
  if (d.includes('feritina') || d.includes('hemoglobina') || d.includes('vitamina') || d.includes('tsh') || d.includes('analiz')) cat.push('nutritie', 'hormoni')
  if (d.includes('hrv') || d.includes('pasi') || d.includes('antrenament') || d.includes('sport') || d.includes('alergare')) cat.push('sport')
  if (d.includes('somn') || d.includes('hrv') || d.includes('oura')) cat.push('somn')
  if (d.includes('stres') || d.includes('anxietate') || d.includes('depresie') || d.includes('mood')) cat.push('mental')
  if (d.includes('testosteron') || d.includes('cortizol') || d.includes('tsh') || d.includes('hormoni')) cat.push('hormoni')
  if (d.includes('supliment') || d.includes('magneziu') || d.includes('omega') || d.includes('vitamina')) cat.push('suplimente')
  if (d.includes('ciclu') || d.includes('menstrual') || d.includes('pms') || d.includes('ovulatie')) cat.push('nutritie', 'sport')
  if (d.includes('anti-aging') || d.includes('longevitate') || d.includes('sauna')) cat.push('antiaging')
  if (d.includes('libido') || d.includes('erectil') || d.includes('sexual')) cat.push('sexual')
  return cat.length > 0 ? [...new Set(cat)] : ['nutritie', 'sport', 'somn', 'mental']
}

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Neautentificat' }, { status: 401 })

  const { dateUtilizator, tipAnaliza } = await req.json()

  try {
    // 1. Generează embedding pentru datele utilizatorului
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: dateUtilizator.slice(0, 2000), // limitez la 2000 chars
    })
    const embedding = embeddingResponse.data[0].embedding

    // 2. Caută studii relevante în pgvector
    const categorii = detectCategorii(dateUtilizator)
    const { data: studii, error: studiiError } = await supabase.rpc('cauta_studii', {
      query_embedding: embedding,
      categorii: categorii,
      limit_rezultate: 6,
      min_relevanta: 7,
    })

    if (studiiError) console.error('RAG error:', studiiError)

    // 3. Construiește contextul cu studiile găsite
    const contextStudii = (studii || []).map((s: any) => `
STUDIU: ${s.titlu}
Autori: ${s.autori || 'N/A'} | ${s.jurnal} (${s.an})
Nivel dovezi: ${s.dovezi_nivel} | Relevanță: ${s.relevanta}/10
Rezumat: ${s.rezumat}
Concluzii: ${s.concluzii}
---`).join('\n')

    // 4. Obține istoricul analizelor pentru comparație
    const { data: istoricAnalize } = await supabase
      .from('analize_bh')
      .select('scor_wellness, creat_la, rezultat_json')
      .eq('user_id', user.id)
      .order('creat_la', { ascending: false })
      .limit(3)

    const contextIstoric = istoricAnalize?.length ? `
ISTORICUL ANALIZELOR UTILIZATORULUI (ultimele ${istoricAnalize.length}):
${istoricAnalize.map((a: any, i: number) => `
Analiza ${i + 1} (${new Date(a.creat_la).toLocaleDateString('ro-RO')}):
- Scor wellness: ${a.scor_wellness}/100
- Diagnostic funcțional: ${a.rezultat_json?.diagnostic_functional?.slice(0, 150) || 'N/A'}
- Pasul cheie recomandat: ${a.rezultat_json?.urmatorul_pas?.slice(0, 100) || 'N/A'}
`).join('')}` : ''

    // 5. System prompt cu RAG + memorie
    const systemPrompt = `Ești be-human — agentul personal de wellness bazat pe medicina funcțională.

STUDII MEDICALE RELEVANTE PENTRU ACEASTĂ PERSOANĂ (citează-le specific în răspuns):
${contextStudii || 'Fără studii specifice găsite — folosește cunoștințele generale.'}

${contextIstoric}

INSTRUCȚIUNI CITARE:
- Când faci o recomandare susținută de un studiu din lista de mai sus, citează-l explicit
- Format citare: (Autor et al., Jurnal, An)
- Exemplu: "Exercițiul aerob reduce DE (Gerbild et al., Journal of Sexual Medicine, 2018)"
- Nu inventa studii — citează NUMAI din lista furnizată
- Dacă nu ai studiu specific, scrie "dovezi generale" sau "experiență clinică"

INSTRUCȚIUNI MEMORIE:
${istoricAnalize?.length ? `- Compară cu istoricul: scor anterior ${istoricAnalize[0]?.scor_wellness}/100 vs acum` : '- Prima analiză a acestui utilizator'}
- Menționează ce s-a îmbunătățit și ce stagnează față de analizele anterioare

Returnează DOAR JSON valid fără markdown cu toate câmpurile specificate.`

    return NextResponse.json({
      systemPrompt,
      studiiGasite: (studii || []).length,
      studiiContext: studii || [],
      istoricAnalize: istoricAnalize || [],
    })

  } catch (error: any) {
    console.error('RAG route error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
