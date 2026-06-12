export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  return NextResponse.json({ studiiGasite: 0, studiiContext: [], istoricAnalize: [] })
}
