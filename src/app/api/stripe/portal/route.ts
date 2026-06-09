// src/app/api/stripe/portal/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' })

export async function POST() {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Neautentificat' }, { status: 401 })

  const { data: util } = await supabase.from('utilizatori')
    .select('stripe_customer_id').eq('id', user.id).single()

  if (!util?.stripe_customer_id)
    return NextResponse.json({ error: 'Niciun abonament activ' }, { status: 400 })

  const session = await stripe.billingPortal.sessions.create({
    customer:   util.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/cont`,
  })

  return NextResponse.json({ url: session.url })
}
