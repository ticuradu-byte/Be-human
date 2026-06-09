// src/app/api/stripe/checkout/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' })

const PRICES: Record<string, string> = {
  plus:    process.env.STRIPE_PRICE_PLUS!,
  pro:     process.env.STRIPE_PRICE_PRO!,
  familie: process.env.STRIPE_PRICE_FAMILIE!,
}

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Neautentificat' }, { status: 401 })

  const { plan } = await req.json()
  if (!PRICES[plan]) return NextResponse.json({ error: 'Plan invalid' }, { status: 400 })

  const { data: util } = await supabase.from('utilizatori')
    .select('stripe_customer_id, email, nume').eq('id', user.id).single()

  let customerId = util?.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: util?.email || user.email!,
      name:  util?.nume  || undefined,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id
    await supabase.from('utilizatori').update({ stripe_customer_id: customerId }).eq('id', user.id)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: PRICES[plan], quantity: 1 }],
    subscription_data: {
      trial_period_days: 14,
      metadata: { supabase_user_id: user.id, plan },
    },
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    locale: 'ro',
    success_url: `${appUrl}/dashboard/cont?upgrade=success&plan=${plan}`,
    cancel_url:  `${appUrl}/dashboard/cont?upgrade=cancelled`,
    metadata: { supabase_user_id: user.id, plan },
  })

  return NextResponse.json({ url: session.url })
}
