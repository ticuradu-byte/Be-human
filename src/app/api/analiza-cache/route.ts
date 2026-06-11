import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Hash simplu pentru date utilizator
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

export async function POST(req: NextRequest) {
  try {
    const { user_id, date_hash, rezultat } = await req.json()

    if (rezultat) {
      // Salvează în cache
      await supabase.from('analiza_cache').upsert({
        user_id,
        date_hash,
        rezultat_json: rezultat,
        creat_la: new Date().toISOString()
      }, { onConflict: 'user_id,date_hash' })
      return NextResponse.json({ saved: true })
    } else {
      // Citește din cache
      const { data } = await supabase
        .from('analiza_cache')
        .select('rezultat_json, creat_la')
        .eq('user_id', user_id)
        .eq('date_hash', date_hash)
        .gte('creat_la', new Date(Date.now() - 24*60*60*1000).toISOString()) // 24h
        .single()
      return NextResponse.json({ cached: data?.rezultat_json || null })
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
