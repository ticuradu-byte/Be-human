-- ══════════════════════════════════════════════════════════════════════════════
-- BE-HUMAN — Schema Supabase completă
-- Rulează în Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

-- 1. UTILIZATORI
CREATE TABLE IF NOT EXISTS utilizatori (
    id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email                 TEXT NOT NULL,
    nume                  TEXT,
    avatar_url            TEXT,
    plan                  TEXT DEFAULT 'free' CHECK (plan IN ('free','plus','pro','familie')),
    analize_luna          INTEGER DEFAULT 0,
    luna_curenta          TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM'),
    -- Stripe
    stripe_customer_id    TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE,
    plan_expires_at       TIMESTAMPTZ,
    trial_ends_at         TIMESTAMPTZ,
    -- Preferințe
    email_zilnic          BOOLEAN DEFAULT FALSE,
    ora_email             TEXT DEFAULT '07:00',
    -- Timestamps
    creat_la              TIMESTAMPTZ DEFAULT NOW(),
    actualizat_la         TIMESTAMPTZ DEFAULT NOW()
);

-- 2. JURNAL SIMPTOME ZILNIC
CREATE TABLE IF NOT EXISTS jurnal_zilnic (
    id              BIGSERIAL PRIMARY KEY,
    user_id         UUID REFERENCES utilizatori(id) ON DELETE CASCADE,
    data_zi         DATE NOT NULL DEFAULT CURRENT_DATE,
    energie         SMALLINT CHECK (energie BETWEEN 1 AND 5),
    mood            SMALLINT CHECK (mood BETWEEN 1 AND 5),
    foame           TEXT CHECK (foame IN ('scazuta','normala','ridicata')),
    dureri          TEXT,
    alte            TEXT,
    scor_wellness   SMALLINT,
    creat_la        TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, data_zi)
);

-- 3. DATE WEARABLES (cache)
CREATE TABLE IF NOT EXISTS wearable_date_zilnice (
    id          BIGSERIAL PRIMARY KEY,
    user_id     UUID REFERENCES utilizatori(id) ON DELETE CASCADE,
    data_zi     DATE NOT NULL,
    provider    TEXT NOT NULL,
    date_raw    JSONB,
    date_norm   JSONB NOT NULL,
    creat_la    TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, data_zi, provider)
);

-- 4. WEARABLE TOKENS
CREATE TABLE IF NOT EXISTS wearable_tokens (
    id              BIGSERIAL PRIMARY KEY,
    user_id         UUID REFERENCES utilizatori(id) ON DELETE CASCADE,
    provider        TEXT NOT NULL,
    access_token    TEXT,
    refresh_token   TEXT,
    token_expires   TIMESTAMPTZ,
    garmin_email    TEXT,
    garmin_password TEXT,
    activ           BOOLEAN DEFAULT TRUE,
    ultima_sync     TIMESTAMPTZ,
    creat_la        TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, provider)
);

-- 5. ANALIZE BE-HUMAN (istoricul rapoartelor)
CREATE TABLE IF NOT EXISTS analize_bh (
    id              BIGSERIAL PRIMARY KEY,
    user_id         UUID REFERENCES utilizatori(id) ON DELETE CASCADE,
    data_zi         DATE DEFAULT CURRENT_DATE,
    scor_wellness   SMALLINT,
    surse_date      JSONB,      -- ce surse au fost folosite
    rezultat_json   JSONB,      -- raportul complet
    alerte          JSONB,      -- alertele detectate
    creat_la        TIMESTAMPTZ DEFAULT NOW()
);

-- 6. STRIPE SUBSCRIPȚII
CREATE TABLE IF NOT EXISTS subscriptii (
    id                      BIGSERIAL PRIMARY KEY,
    user_id                 UUID REFERENCES utilizatori(id) ON DELETE CASCADE,
    stripe_subscription_id  TEXT UNIQUE,
    stripe_customer_id      TEXT,
    stripe_price_id         TEXT,
    status                  TEXT,
    plan                    TEXT,
    current_period_start    TIMESTAMPTZ,
    current_period_end      TIMESTAMPTZ,
    trial_end               TIMESTAMPTZ,
    cancel_at_period_end    BOOLEAN DEFAULT FALSE,
    canceled_at             TIMESTAMPTZ,
    creat_la                TIMESTAMPTZ DEFAULT NOW(),
    actualizat_la           TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PLĂȚI
CREATE TABLE IF NOT EXISTS plati (
    id                      BIGSERIAL PRIMARY KEY,
    user_id                 UUID REFERENCES utilizatori(id) ON DELETE SET NULL,
    stripe_invoice_id       TEXT UNIQUE,
    stripe_payment_intent   TEXT UNIQUE,
    suma                    INTEGER,    -- cenți
    moneda                  TEXT DEFAULT 'eur',
    status                  TEXT,
    plan_platit             TEXT,
    creat_la                TIMESTAMPTZ DEFAULT NOW()
);

-- 8. STRIPE WEBHOOK EVENTS (idempotență)
CREATE TABLE IF NOT EXISTS stripe_events (
    id          TEXT PRIMARY KEY,
    tip         TEXT NOT NULL,
    procesat_la TIMESTAMPTZ DEFAULT NOW()
);

-- ── SCORE ZILNIC (view calculat) ──────────────────────────────────────────────
CREATE OR REPLACE VIEW scoruri_sapt AS
SELECT
    j.user_id,
    j.data_zi,
    j.scor_wellness,
    j.energie,
    j.mood,
    LAG(j.scor_wellness) OVER (PARTITION BY j.user_id ORDER BY j.data_zi) AS scor_ieri,
    AVG(j.scor_wellness) OVER (
        PARTITION BY j.user_id
        ORDER BY j.data_zi
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) AS medie_7_zile
FROM jurnal_zilnic j
WHERE j.scor_wellness IS NOT NULL;

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE utilizatori ENABLE ROW LEVEL SECURITY;
ALTER TABLE jurnal_zilnic ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_date_zilnice ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE analize_bh ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptii ENABLE ROW LEVEL SECURITY;
ALTER TABLE plati ENABLE ROW LEVEL SECURITY;

-- Politici: fiecare user vede doar datele lui
CREATE POLICY "propriu" ON utilizatori FOR ALL USING (auth.uid() = id);
CREATE POLICY "propriu" ON jurnal_zilnic FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "propriu" ON wearable_date_zilnice FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "propriu" ON wearable_tokens FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "propriu" ON analize_bh FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "propriu" ON subscriptii FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "propriu" ON plati FOR SELECT USING (auth.uid() = user_id);

-- ── INDECȘI ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_jurnal_user_data ON jurnal_zilnic(user_id, data_zi DESC);
CREATE INDEX IF NOT EXISTS idx_wearable_user_data ON wearable_date_zilnice(user_id, data_zi DESC, provider);
CREATE INDEX IF NOT EXISTS idx_analize_user ON analize_bh(user_id, creat_la DESC);
CREATE INDEX IF NOT EXISTS idx_util_stripe ON utilizatori(stripe_customer_id);

-- ── FUNCȚIE: reset analize lunare ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION reset_analize_luna()
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
    UPDATE utilizatori
    SET analize_luna = 0, luna_curenta = TO_CHAR(NOW(), 'YYYY-MM')
    WHERE luna_curenta != TO_CHAR(NOW(), 'YYYY-MM');
END;
$$;

-- ── FUNCȚIE: actualizare plan după Stripe ─────────────────────────────────────
CREATE OR REPLACE FUNCTION actualizeaza_plan(
    p_customer_id TEXT,
    p_plan TEXT,
    p_sub_id TEXT DEFAULT NULL,
    p_expires_at TIMESTAMPTZ DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
    UPDATE utilizatori SET
        plan = p_plan,
        stripe_subscription_id = COALESCE(p_sub_id, stripe_subscription_id),
        plan_expires_at = p_expires_at,
        analize_luna = 0,
        actualizat_la = NOW()
    WHERE stripe_customer_id = p_customer_id;
END;
$$;
