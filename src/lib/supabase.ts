import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const createBrowserClient = () => createClientComponentClient()

export type Plan = 'free' | 'plus' | 'pro' | 'familie'

export const PLANURI: Record<Plan, any> = {
  free:    { label:'Free',    pret:'0€',      pret_lunar:0,  analize:2,      features:['2 analize/lună','Jurnal zilnic','Score wellness'], stripe_price_env:'' },
  plus:    { label:'Plus',    pret:'9€/lună', pret_lunar:9,  analize:999999, features:['Analize nelimitate','Email zilnic','Oura+Garmin'], stripe_price_env:'STRIPE_PRICE_PLUS' },
  pro:     { label:'Pro',     pret:'29€/lună',pret_lunar:29, analize:999999, features:['Plus + Siguranță med.','Anti-aging'], stripe_price_env:'STRIPE_PRICE_PRO' },
  familie: { label:'Familie', pret:'49€/lună',pret_lunar:49, analize:999999, features:['Pro pentru 4 persoane'], stripe_price_env:'STRIPE_PRICE_FAMILIE' },
}

export function areAcces(plan: Plan, feature: string): boolean {
  const m: Record<string, Plan[]> = {
    'analize_nelimitate':['plus','pro','familie'],
    'email_zilnic':['plus','pro','familie'],
    'wearables_api':['plus','pro','familie'],
    'historic_90_zile':['plus','pro','familie'],
    'siguranta_medicamentos':['pro','familie'],
    'anti_aging':['pro','familie'],
  }
  return m[feature]?.includes(plan) ?? false
}