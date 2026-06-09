-- ══════════════════════════════════════════════════════════════════════════════
-- BE-HUMAN RAG — Schema pgvector pentru studii medicale
-- Rulează în Supabase SQL Editor DUPĂ schema principală
-- ══════════════════════════════════════════════════════════════════════════════

-- Activează extensia pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabela studii medicale cu embeddings
CREATE TABLE IF NOT EXISTS studii_medicale (
    id          BIGSERIAL PRIMARY KEY,
    titlu       TEXT NOT NULL,
    autori      TEXT,
    jurnal      TEXT,
    an          INTEGER,
    doi         TEXT,
    categorie   TEXT,  -- nutritie|sport|hormoni|somn|mental|suplimente|analize|antiaging|sexual
    subcategorie TEXT,
    rezumat     TEXT NOT NULL,
    concluzii   TEXT,
    dovezi_nivel TEXT CHECK (dovezi_nivel IN ('meta-analiza','RCT','cohort','observational','in-vitro')),
    relevanta   INTEGER DEFAULT 5 CHECK (relevanta BETWEEN 1 AND 10),
    embedding   vector(1536),  -- OpenAI text-embedding-3-small
    creat_la    TIMESTAMPTZ DEFAULT NOW()
);

-- Index pentru căutare semantică rapidă
CREATE INDEX IF NOT EXISTS idx_studii_embedding
    ON studii_medicale USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_studii_categorie ON studii_medicale(categorie);
CREATE INDEX IF NOT EXISTS idx_studii_relevanta ON studii_medicale(relevanta DESC);

-- Funcție căutare semantică
CREATE OR REPLACE FUNCTION cauta_studii(
    query_embedding vector(1536),
    categorii TEXT[] DEFAULT NULL,
    limit_rezultate INTEGER DEFAULT 5,
    min_relevanta INTEGER DEFAULT 6
)
RETURNS TABLE (
    id BIGINT,
    titlu TEXT,
    autori TEXT,
    jurnal TEXT,
    an INTEGER,
    categorie TEXT,
    rezumat TEXT,
    concluzii TEXT,
    dovezi_nivel TEXT,
    relevanta INTEGER,
    similaritate FLOAT
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id, s.titlu, s.autori, s.jurnal, s.an,
        s.categorie, s.rezumat, s.concluzii,
        s.dovezi_nivel, s.relevanta,
        1 - (s.embedding <=> query_embedding) AS similaritate
    FROM studii_medicale s
    WHERE
        (categorii IS NULL OR s.categorie = ANY(categorii))
        AND s.relevanta >= min_relevanta
        AND s.embedding IS NOT NULL
    ORDER BY s.embedding <=> query_embedding
    LIMIT limit_rezultate;
END;
$$;

-- RLS
ALTER TABLE studii_medicale ENABLE ROW LEVEL SECURITY;
CREATE POLICY "studii_publice" ON studii_medicale FOR SELECT USING (TRUE);
CREATE POLICY "studii_admin" ON studii_medicale FOR ALL USING (auth.role() = 'service_role');
