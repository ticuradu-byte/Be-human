#!/usr/bin/env python3
# apply-ui-fix.py — Adaugă afișarea câmpurilor noi în raport (overview + mental tab)
# Rulează din folderul be-human-complet: py apply-ui-fix.py

FILE = "src/app/dashboard/analiza/page.tsx"

with open(FILE, "r", encoding="utf-8") as f:
    content = f.read()

changes_made = []

# ── 1. Adaugă micro_actiune_azi în tab overview, înainte de insights ──────────
old_overview = """      {activeTab==='overview' && (
        <div className="space-y-3 fade-in">
          {result.insights?.slice(0, 3).map((ins: any, i: number) => {"""

new_overview = """      {activeTab==='overview' && (
        <div className="space-y-3 fade-in">
          {result.micro_actiune_azi && (
            <div className="rounded-xl p-4 bg-green-500/[0.1] border border-green-500/[0.25]">
              <div className="text-[10px] font-bold text-green-400 uppercase tracking-wider mb-1.5">⚡ Fă asta acum — sub 5 minute</div>
              <div className="text-sm text-white/85 font-medium leading-relaxed">{result.micro_actiune_azi}</div>
            </div>
          )}
          {result.insights?.slice(0, 3).map((ins: any, i: number) => {"""

if old_overview in content:
    content = content.replace(old_overview, new_overview)
    changes_made.append("micro_actiune_azi → tab overview")
else:
    print("⚠️  Nu am gasit blocul overview (poate a fost deja modificat)")

# ── 2. Adaugă lumina_naturala + conexiune_sociala în tab mental ───────────────
old_mental = """            {result.sanatate_mintala.viata_sociala && (
              <div className="mt-3 bg-purple-500/[0.06] border border-purple-500/[0.18] rounded-xl p-3 text-xs text-white/65">{result.sanatate_mintala.viata_sociala}</div>
            )}
          </div>
        </div>
      )}

      {activeTab==='sex' && result.sanatate_sexuala && ("""

new_mental = """            {result.sanatate_mintala.viata_sociala && (
              <div className="mt-3 bg-purple-500/[0.06] border border-purple-500/[0.18] rounded-xl p-3 text-xs text-white/65">{result.sanatate_mintala.viata_sociala}</div>
            )}
          </div>

          {result.lumina_naturala && (
            <div className="card p-5">
              <div className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider mb-2">☀️ Lumină naturală & Vitamina D</div>
              <p className="text-sm text-white/70 leading-relaxed mb-2">{result.lumina_naturala.recomandare}</p>
              {result.lumina_naturala.vitamina_d_status && (
                <div className="text-xs text-yellow-400/70 bg-yellow-500/[0.06] rounded-lg px-3 py-2 inline-block">
                  Status Vit. D: {result.lumina_naturala.vitamina_d_status}
                </div>
              )}
            </div>
          )}

          {result.conexiune_sociala && (
            <div className="card p-5">
              <div className="text-[10px] font-bold text-pink-400 uppercase tracking-wider mb-2">👥 Conexiune socială</div>
              <p className="text-sm text-white/70 leading-relaxed mb-2">{result.conexiune_sociala.evaluare}</p>
              {result.conexiune_sociala.actiune_saptamana && (
                <div className="text-xs text-pink-400/80 bg-pink-500/[0.06] border border-pink-500/[0.15] rounded-lg px-3 py-2">
                  ✅ {result.conexiune_sociala.actiune_saptamana}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab==='sex' && result.sanatate_sexuala && ("""

if old_mental in content:
    content = content.replace(old_mental, new_mental)
    changes_made.append("lumina_naturala + conexiune_sociala → tab mental")
else:
    print("⚠️  Nu am gasit blocul mental/sex (poate a fost deja modificat)")

with open(FILE, "w", encoding="utf-8") as f:
    f.write(content)

print()
if changes_made:
    print("✅ Modificari aplicate:")
    for c in changes_made:
        print("   - " + c)
else:
    print("❌ Nicio modificare aplicata. Verifica fisierul manual.")
