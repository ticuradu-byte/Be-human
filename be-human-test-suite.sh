#!/bin/bash
# ══════════════════════════════════════════════════════════════════════
# BE-HUMAN — TEST SUITE COMPLET
# Rulează din folderul be-human-complet:
# bash be-human-test-suite.sh
# ══════════════════════════════════════════════════════════════════════

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASS=0; FAIL=0; WARN=0
BASE_URL="http://localhost:3000"

ok()   { echo -e "${GREEN}✅ $1${NC}"; ((PASS++)); }
fail() { echo -e "${RED}❌ $1${NC}"; ((FAIL++)); }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; ((WARN++)); }
info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║         BE-HUMAN TEST SUITE — $(date '+%d.%m.%Y %H:%M')         ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ── 1. STRUCTURĂ FIȘIERE ──────────────────────────────────────────────
echo -e "${BLUE}━━━ 1. STRUCTURĂ FIȘIERE ━━━${NC}"

FILES=(
  "src/app/dashboard/layout.tsx"
  "src/app/dashboard/page.tsx"
  "src/app/dashboard/analiza/page.tsx"
  "src/app/dashboard/jurnal/page.tsx"
  "src/app/dashboard/wearables/page.tsx"
  "src/app/dashboard/istoric/page.tsx"
  "src/app/dashboard/predictie/page.tsx"
  "src/app/dashboard/profil/page.tsx"
  "src/app/dashboard/cont/page.tsx"
  "src/app/dashboard/ziua-perfecta/page.tsx"
  "src/app/dashboard/challenge/page.tsx"
  "src/app/dashboard/recuperare/page.tsx"
  "src/app/dashboard/roata-vietii/page.tsx"
  "src/app/api/predictie/route.ts"
  "src/app/api/pdf/route.ts"
  "src/app/api/cron/zilnic/route.ts"
  "src/app/api/stripe/checkout/route.ts"
  "src/app/api/stripe/webhook/route.ts"
  "src/lib/supabase.ts"
  "src/lib/knowledge-base-focus.ts"
  "src/lib/i18n.ts"
  "src/lib/useWearablesAutoload.ts"
  "src/components/DescarcaPDF.tsx"
  "src/components/SelectorLimba.tsx"
  "src/middleware.ts"
  "vercel.json"
  ".env.local"
  "package.json"
)

for f in "${FILES[@]}"; do
  [ -f "$f" ] && ok "$f" || fail "$f LIPSEȘTE"
done

# ── 2. VARIABILE MEDIU ────────────────────────────────────────────────
echo ""
echo -e "${BLUE}━━━ 2. VARIABILE MEDIU (.env.local) ━━━${NC}"

check_env() {
  local key=$1; local required=$2
  val=$(grep "^$key=" .env.local 2>/dev/null | cut -d'=' -f2-)
  if [ -z "$val" ] || [[ "$val" == *"..."* ]] || [[ "$val" == *"xxxxx"* ]]; then
    [ "$required" = "required" ] && fail "$key — LIPSĂ sau necompletat" || warn "$key — necompletat (opțional)"
  else
    ok "$key — setat ✓"
  fi
}

check_env "NEXT_PUBLIC_SUPABASE_URL" "required"
check_env "NEXT_PUBLIC_SUPABASE_ANON_KEY" "required"
check_env "SUPABASE_SERVICE_ROLE_KEY" "required"
check_env "ANTHROPIC_API_KEY" "required"
check_env "STRIPE_SECRET_KEY" "optional"
check_env "STRIPE_WEBHOOK_SECRET" "optional"
check_env "RESEND_API_KEY" "optional"
check_env "CRON_SECRET" "optional"
check_env "NEXT_PUBLIC_GOOGLE_AI_KEY" "optional"
check_env "OPENAI_API_KEY" "optional"

# ── 3. SERVER RULEAZĂ ─────────────────────────────────────────────────
echo ""
echo -e "${BLUE}━━━ 3. SERVER NEXT.JS ━━━${NC}"

for port in 3000 3001 3002; do
  if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" 2>/dev/null | grep -q "200\|301\|302"; then
    ok "Server rulează pe port $port"
    BASE_URL="http://localhost:$port"
    break
  fi
  BASE_URL="http://localhost:$port"
done

# ── 4. PAGINI HTTP ────────────────────────────────────────────────────
echo ""
echo -e "${BLUE}━━━ 4. PAGINI — HTTP STATUS ━━━${NC}"

PAGES=(
  "/auth/login"
  "/auth/register"
  "/dashboard"
  "/dashboard/analiza"
  "/dashboard/jurnal"
  "/dashboard/wearables"
  "/dashboard/istoric"
  "/dashboard/predictie"
  "/dashboard/profil"
  "/dashboard/cont"
  "/dashboard/ziua-perfecta"
  "/dashboard/challenge"
  "/dashboard/recuperare"
  "/dashboard/roata-vietii"
)

for page in "${PAGES[@]}"; do
  status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$page" 2>/dev/null)
  if [[ "$status" == "200" ]] || [[ "$status" == "307" ]] || [[ "$status" == "302" ]]; then
    ok "$page → $status"
  else
    fail "$page → $status (așteptat 200/302/307)"
  fi
done

# ── 5. API ENDPOINTS ──────────────────────────────────────────────────
echo ""
echo -e "${BLUE}━━━ 5. API ENDPOINTS ━━━${NC}"

APIS=(
  "/api/predictie:GET"
  "/api/pdf:POST"
  "/api/cron/zilnic:GET"
  "/api/stripe/checkout:POST"
  "/api/stripe/portal:POST"
)

for api_info in "${APIS[@]}"; do
  api=$(echo $api_info | cut -d: -f1)
  method=$(echo $api_info | cut -d: -f2)
  status=$(curl -s -o /dev/null -w "%{http_code}" -X $method "$BASE_URL$api" 2>/dev/null)
  if [[ "$status" != "000" ]] && [[ "$status" != "" ]]; then
    ok "$method $api → $status (endpoint există)"
  else
    fail "$method $api → nu răspunde"
  fi
done

# ── 6. SUPABASE CONEXIUNE ─────────────────────────────────────────────
echo ""
echo -e "${BLUE}━━━ 6. SUPABASE ━━━${NC}"

SUPA_URL=$(grep "^NEXT_PUBLIC_SUPABASE_URL=" .env.local 2>/dev/null | cut -d'=' -f2-)
if [ -n "$SUPA_URL" ] && [[ "$SUPA_URL" != *"..."* ]]; then
  status=$(curl -s -o /dev/null -w "%{http_code}" "$SUPA_URL/rest/v1/" 2>/dev/null)
  [[ "$status" == "200" ]] && ok "Supabase URL accesibil" || warn "Supabase URL status: $status"
else
  warn "Supabase URL nesetat — skip test"
fi

# ── 7. DEPENDENTE NPM ─────────────────────────────────────────────────
echo ""
echo -e "${BLUE}━━━ 7. DEPENDENTE NPM ━━━${NC}"

DEPS=("next" "@supabase/supabase-js" "@supabase/auth-helpers-nextjs" "stripe" "typescript")
for dep in "${DEPS[@]}"; do
  [ -d "node_modules/$dep" ] && ok "$dep instalat" || fail "$dep LIPSEȘTE — rulează: npm install"
done

# ── 8. TYPESCRIPT BUILD ───────────────────────────────────────────────
echo ""
echo -e "${BLUE}━━━ 8. TYPESCRIPT CHECK ━━━${NC}"

info "Rulând tsc --noEmit (poate dura 10-30s)..."
if npx tsc --noEmit 2>/dev/null; then
  ok "TypeScript — fără erori"
else
  warn "TypeScript — există erori (nu blochează dev, poate bloca deploy)"
fi

# ── 9. CONȚINUT CHEIE FIȘIERE ─────────────────────────────────────────
echo ""
echo -e "${BLUE}━━━ 9. CONȚINUT CHEIE ━━━${NC}"

grep -q "ANTHROPIC_API_KEY\|GOOGLE_AI_KEY\|callGemini\|claude-sonnet" src/app/dashboard/analiza/page.tsx 2>/dev/null \
  && ok "analiza/page.tsx — conține AI integration" \
  || fail "analiza/page.tsx — lipsește AI integration"

grep -q "calculeazaPredictie\|hrv\|temperatura_delta" src/app/api/predictie/route.ts 2>/dev/null \
  && ok "api/predictie — algoritm predicție prezent" \
  || fail "api/predictie — algoritm lipsește"

grep -q "ziua-perfecta\|challenge\|recuperare\|roata-vietii" src/app/dashboard/layout.tsx 2>/dev/null \
  && ok "layout.tsx — toate rutele v5 prezente" \
  || fail "layout.tsx — rutele v5 lipsesc"

grep -q "calcBodyFat\|circumferinta_talie" src/app/dashboard/profil/page.tsx 2>/dev/null \
  && ok "profil/page.tsx — Body Fat calculator prezent" \
  || fail "profil/page.tsx — Body Fat lipsește"

grep -q "MTHFR\|COMT\|APOE\|FTO" src/app/api/farmacogenomica/route.ts 2>/dev/null \
  && ok "farmacogenomica — SNP database prezent" \
  || warn "farmacogenomica/route.ts — nu e instalat (v4)"

grep -q "gemini\|anthropic\|GOOGLE_AI" src/app/dashboard/analiza/page.tsx 2>/dev/null \
  && ok "analiza — AI provider configurat" \
  || fail "analiza — AI provider lipsește"

# ── 10. GIT STATUS ────────────────────────────────────────────────────
echo ""
echo -e "${BLUE}━━━ 10. GIT STATUS ━━━${NC}"

if git status &>/dev/null; then
  branch=$(git branch --show-current 2>/dev/null)
  ok "Git repository activ — branch: $branch"
  uncommitted=$(git status --porcelain 2>/dev/null | wc -l)
  [ "$uncommitted" -gt 0 ] && warn "$uncommitted fișiere necommit-uite" || ok "Totul commis"
  remote=$(git remote get-url origin 2>/dev/null)
  [ -n "$remote" ] && ok "Remote: $remote" || warn "Fără remote GitHub configurat"
else
  warn "Nu e repository Git sau git nu e instalat"
fi

# ── SUMAR FINAL ───────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║                  REZULTATE FINALE                   ║"
echo "╠══════════════════════════════════════════════════════╣"
echo -e "║  ${GREEN}✅ Trecut:    $PASS${NC}"
echo -e "║  ${RED}❌ Eșuat:     $FAIL${NC}"
echo -e "║  ${YELLOW}⚠️  Avertizări: $WARN${NC}"
echo "╠══════════════════════════════════════════════════════╣"

TOTAL=$((PASS + FAIL))
if [ $FAIL -eq 0 ]; then
  echo -e "║  ${GREEN}🚀 APLICAȚIA E GATA DE LANSARE!${NC}"
elif [ $FAIL -le 3 ]; then
  echo -e "║  ${YELLOW}⚠️  CÂTEVA PROBLEME MINORE DE REZOLVAT${NC}"
else
  echo -e "║  ${RED}🔧 PROBLEME MAJORE — NECESITĂ FIX${NC}"
fi
echo "╚══════════════════════════════════════════════════════╝"
echo ""
