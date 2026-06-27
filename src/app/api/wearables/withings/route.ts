export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'

const CLIENT_ID = process.env.WITHINGS_CLIENT_ID!
const REDIRECT_URI = 'https://be-human-gamma.vercel.app/auth/callback/withings'

const SCOPES = [
  'user.info',
  'user.metrics',   // greutate, compoziție corporală, tensiune arterială
  'user.activity',  // pași, somn (din traseul de activitate)
].join(',')

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('user_id')

  const authUrl = `https://account.withings.com/oauth2_user/authorize2?` +
    `response_type=code` +
    `&client_id=${CLIENT_ID}` +
    `&state=${userId}` +
    `&scope=${encodeURIComponent(SCOPES)}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`

  return NextResponse.redirect(authUrl)
}
