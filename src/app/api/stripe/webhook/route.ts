// src/app/api/stripe/webhook/route.ts
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' })
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

function planDinPrice(priceId: string): string {
  if (priceId === process.env.STRIPE_PRICE_PLUS)    return 'plus'
  if (priceId === process.env.STRIPE_PRICE_PRO)     return 'pro'
  if (priceId === process.env.STRIPE_PRICE_FAMILIE) return 'familie'
  return 'free'
}

export async function POST(req: Request) {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch { return NextResponse.json({ error: 'Semnătură invalidă' }, { status: 400 }) }

  // Idempotență
  const { data: ex } = await sb.from('stripe_events').select('id').eq('id', event.id).single()
  if (ex) return NextResponse.json({ received: true, skipped: true })
  await sb.from('stripe_events').insert({ id: event.id, tip: event.type })

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const cid = sub.customer as string
        const plan = planDinPrice(sub.items.data[0]?.price.id)
        const activ = ['active', 'trialing'].includes(sub.status)

        await sb.from('utilizatori').update({
          plan:                    activ ? plan : 'free',
          stripe_subscription_id:  sub.id,
          plan_expires_at:         new Date(sub.current_period_end * 1000).toISOString(),
          trial_ends_at:           sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
          analize_luna:            0,
        }).eq('stripe_customer_id', cid)

        await sb.from('subscriptii').upsert({
          stripe_subscription_id: sub.id,
          stripe_customer_id:     cid,
          stripe_price_id:        sub.items.data[0]?.price.id,
          status: sub.status, plan,
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end:   new Date(sub.current_period_end * 1000).toISOString(),
          trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
          cancel_at_period_end: sub.cancel_at_period_end,
          actualizat_la: new Date().toISOString(),
        }, { onConflict: 'stripe_subscription_id' })
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await sb.from('utilizatori').update({
          plan: 'free', stripe_subscription_id: null, plan_expires_at: null,
        }).eq('stripe_customer_id', sub.customer as string)
        await sb.from('subscriptii').update({ status: 'canceled', canceled_at: new Date().toISOString() })
          .eq('stripe_subscription_id', sub.id)
        break
      }

      case 'invoice.payment_succeeded': {
        const inv = event.data.object as Stripe.Invoice
        const { data: util } = await sb.from('utilizatori').select('id, plan')
          .eq('stripe_customer_id', inv.customer as string).single()
        if (util) {
          await sb.from('plati').insert({
            user_id: util.id, stripe_invoice_id: inv.id,
            suma: inv.amount_paid, moneda: inv.currency,
            status: 'succeeded', plan_platit: util.plan,
          })
        }
        break
      }

      case 'invoice.payment_failed': {
        const inv = event.data.object as Stripe.Invoice
        const { data: util } = await sb.from('utilizatori').select('id')
          .eq('stripe_customer_id', inv.customer as string).single()
        if (util) {
          await sb.from('plati').insert({
            user_id: util.id, stripe_invoice_id: inv.id,
            suma: inv.amount_due, moneda: inv.currency, status: 'failed',
          })
        }
        break
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.CheckoutSession
        if (session.metadata?.supabase_user_id) {
          await sb.from('utilizatori').update({ stripe_customer_id: session.customer as string })
            .eq('id', session.metadata.supabase_user_id)
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
