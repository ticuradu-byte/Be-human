# BE-HUMAN — Next.js App
## Setup complet în 30 minute

---

## Structura proiectului

```
be-human-next/
├── src/
│   ├── app/
│   │   ├── layout.tsx              ← Root layout + fonturi
│   │   ├── globals.css             ← Stiluri Tailwind
│   │   ├── page.tsx                ← Landing page (de creat)
│   │   ├── auth/
│   │   │   ├── login/page.tsx      ← Login Email + Google
│   │   │   ├── register/page.tsx   ← Înregistrare
│   │   │   └── callback/route.ts   ← OAuth callback
│   │   ├── dashboard/
│   │   │   ├── layout.tsx          ← Sidebar + nav + plan
│   │   │   ├── page.tsx            ← Dashboard home
│   │   │   ├── analiza/page.tsx    ← Analiză wellness (de creat)
│   │   │   ├── jurnal/page.tsx     ← Jurnal zilnic (de creat)
│   │   │   ├── wearables/page.tsx  ← Oura + Garmin (de creat)
│   │   │   ├── istoric/page.tsx    ← Trend + istoric (de creat)
│   │   │   └── cont/page.tsx       ← Profil + Stripe ✅
│   │   └── api/
│   │       └── stripe/
│   │           ├── checkout/route.ts ← POST checkout ✅
│   │           ├── webhook/route.ts  ← Stripe events ✅
│   │           └── portal/route.ts   ← Customer portal ✅
│   ├── lib/
│   │   └── supabase.ts             ← Client + tipuri + planuri ✅
│   └── middleware.ts               ← Protecție rute ✅
├── supabase_schema.sql             ← Schema DB completă ✅
├── .env.local.example
└── package.json
```

---

## Setup pas cu pas

### 1. Instalare

```bash
npm install
cp .env.local.example .env.local
# Completează variabilele
```

### 2. Supabase

```bash
# Rulează în Supabase SQL Editor:
supabase_schema.sql

# Activează Auth în Supabase Dashboard:
# Authentication → Providers:
# ✓ Email (Enable email provider)
# ✓ Google (Client ID + Secret din Google Cloud Console)

# URL-uri redirect autorizate:
# http://localhost:3000/auth/callback
# https://be-human.ro/auth/callback
```

### 3. Stripe

```bash
# dashboard.stripe.com → Products → Add product
# Plan Plus: 9€/lună recurring
# Plan Pro: 29€/lună recurring  
# Plan Familie: 49€/lună recurring
# Copiezi Price IDs în .env.local

# Webhook endpoint:
# https://be-human.ro/api/stripe/webhook
# Events: subscription.created, subscription.updated,
#         subscription.deleted, invoice.payment_succeeded,
#         invoice.payment_failed, checkout.session.completed

# Customer Portal → Settings → Billing → Customer portal
# Activează: cancel subscriptions, update payment methods

# Test local:
stripe listen --forward-to localhost:3000/api/stripe/webhook
stripe trigger checkout.session.completed
```

### 4. Development

```bash
# Terminal 1: Next.js
npm run dev

# Terminal 2: Wearables API (opțional)
cd ../be-human-wearables
uvicorn be-human-wearables-api:app --reload --port 8001

# Terminal 3: Stripe webhook (dacă testezi Stripe)
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### 5. Deploy Vercel

```bash
vercel --prod
# Setează env variables în Vercel Dashboard
# STRIPE_WEBHOOK_SECRET: ia de la dashboard.stripe.com/webhooks → producție
```

---

## Pagini de implementat în continuare

| Pagină | Prioritate | Note |
|--------|-----------|------|
| `dashboard/analiza/page.tsx` | 🔴 Înaltă | Copiezi logica din be-human-saptamana1.jsx |
| `dashboard/jurnal/page.tsx`  | 🔴 Înaltă | Jurnal simptome zilnic |
| `dashboard/wearables/page.tsx`| 🟡 Medie | Integrează WearablesPanel component |
| `dashboard/istoric/page.tsx` | 🟡 Medie | Grafice trend 90 zile |
| `app/page.tsx`               | 🟢 Scăzută | Landing page public |

---

## Carduri de test Stripe

```
Plată reușită:        4242 4242 4242 4242
Card refuzat:         4000 0000 0000 0002
Fonduri insuficiente: 4000 0000 0000 9995
3D Secure:            4000 0027 6000 3184

Data: orice viitoare (ex: 12/34)
CVC: orice 3 cifre
```

---

## Cost lunar (estimat)

| Serviciu | Cost |
|---------|------|
| Vercel (hosting Next.js) | 0€ gratuit → 20$/lună Pro |
| Railway (wearables API) | 5$/lună |
| Supabase (DB + Auth) | 0€ gratuit → 25$/lună Pro |
| Resend (email) | 0€ gratuit (3000/lună) |
| **Total lansare** | **~5$/lună** |
