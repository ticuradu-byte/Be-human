'use client'
// src/components/RaportComplet.tsx
// Afișează raportul wellness COMPLET — toate secțiunile vizibile simultan,
// una sub alta (fără tab-uri clicabile). Folosit pe Dashboard, sub cardul wearables.
// Extras din src/app/dashboard/analiza/page.tsx — păstrează exact același styling.

import DescarcaPDF from './DescarcaPDF'

function scorColor(s: number) { return s >= 75 ? '#4ade80' : s >= 55 ? '#facc15' : '#f87171' }
function prColor(p: string) {
  if (p === 'ridicata') return { bg: 'rgba(248,113,113,.1)', bd: 'rgba(248,113,113,.25)', tx: '#f87171' }
  if (p === 'medie') return { bg: 'rgba(250,204,21,.08)', bd: 'rgba(250,204,21,.2)', tx: '#facc15' }
  return { bg: 'rgba(74,222,128,.07)', bd: 'rgba(74,222,128,.18)', tx: '#4ade80' }
}

function SectionTitle({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <span className="text-base">{icon}</span>
      <span className="text-xs font-bold text-white/40 uppercase tracking-wider">{label}</span>
      <div className="flex-1 h-px bg-white/[0.06]" />
    </div>
  )
}

interface RaportCompletProps {
  result: any
  analizaId?: number
  dataAnaliza?: string
}

export default function RaportComplet({ result, analizaId, dataAnaliza }: RaportCompletProps) {
  if (!result) return null

  return (
    <div className="space-y-4 fade-in">
      {/* Header: titlu + buton PDF */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="text-[10px] font-bold text-white/30 uppercase tracking-wider">
          🌿 Ultimul raport wellness complet{dataAnaliza ? ` · ${dataAnaliza}` : ''}
        </div>
        <DescarcaPDF
          analizaId={analizaId}
          tip="complet"
          label="📄 Descarcă raport PDF"
          className="text-green-400/70 hover:text-green-400"
        />
      </div>

      {/* Alerte medicale */}
      {result.alerte_medicale?.length > 0 && (
        <div className="space-y-2">
          {result.alerte_medicale.map((a: any, i: number) => (
            <div key={i} style={{
              background: a.nivel === 'rosu' ? 'rgba(239,68,68,.08)' : 'rgba(250,204,21,.06)',
              border: `1px solid ${a.nivel === 'rosu' ? 'rgba(239,68,68,.35)' : 'rgba(250,204,21,.25)'}`,
              borderLeft: `4px solid ${a.nivel === 'rosu' ? '#ef4444' : '#facc15'}`,
            }} className="rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-xl">{a.nivel === 'rosu' ? '🚨' : '⚠️'}</span>
                <div>
                  <div className="text-sm font-bold mb-1" style={{ color: a.nivel === 'rosu' ? '#f87171' : '#facc15' }}>
                    {a.nivel === 'rosu' ? 'Consultă un medic urgent' : 'Consult medical recomandat'} — {a.parametru}: {a.valoare}
                  </div>
                  <div className="text-xs text-white/65 leading-relaxed mb-1">{a.mesaj}</div>
                  <div className="text-xs font-semibold" style={{ color: a.nivel === 'rosu' ? '#f87171' : '#facc15' }}>→ {a.actiune} · {a.urgenta}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Scor + salut + cercuri + micro acțiune */}
      <div className="card-green p-6">
        <div className="flex items-center gap-5 flex-wrap mb-4">
          <div className="relative flex-shrink-0">
            <svg width="84" height="84" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="42" cy="42" r="34" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="7" />
              <circle cx="42" cy="42" r="34" fill="none" stroke={scorColor(result.scor_wellness)} strokeWidth="7"
                strokeDasharray={`${(result.scor_wellness / 100) * 214} 214`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ marginTop: 8 }}>
              <span className="font-fraunces text-2xl font-bold leading-none" style={{ color: scorColor(result.scor_wellness) }}>{result.scor_wellness}</span>
              <span className="text-[9px] text-white/30 uppercase tracking-wide">/100</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="font-fraunces text-lg font-bold mb-1" style={{ color: scorColor(result.scor_wellness) }}>{result.scor_label}</div>
            <p className="text-sm text-white/65 leading-relaxed">{result.salut}</p>
          </div>
        </div>
        {result.diagnostic_functional && (
          <div className="border-t border-white/[0.06] pt-4 space-y-2">
            <p className="text-sm text-white/60 leading-relaxed">{result.diagnostic_functional}</p>
            {result.cercul_vicios && (
              <div className="bg-red-500/[0.06] border border-red-500/[0.15] rounded-xl p-3">
                <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">⚠️ Ciclu Negativ</div>
                <div className="text-xs text-white/55 leading-relaxed">{result.cercul_vicios}</div>
              </div>
            )}
            {result.cercul_virtuos && (
              <div className="bg-green-500/[0.06] border border-green-500/[0.15] rounded-xl p-3">
                <div className="text-[10px] font-bold text-green-400 uppercase tracking-wider mb-1">✨ Ciclu Virtuos</div>
                <div className="text-xs text-white/55 leading-relaxed">{result.cercul_virtuos}</div>
              </div>
            )}
          </div>
        )}
        <div className="mt-4 bg-green-500/[0.08] border border-green-500/[0.2] rounded-xl p-3">
          <div className="text-[10px] font-bold text-green-400/80 uppercase tracking-wider mb-1">⚡ Cel mai important lucru AZI</div>
          <div className="text-sm text-white/90 font-medium leading-relaxed">{result.urmatorul_pas}</div>
        </div>
      </div>

      {result.micro_actiune_azi && (
        <div className="rounded-xl p-4 bg-green-500/[0.1] border border-green-500/[0.25]">
          <div className="text-[10px] font-bold text-green-400 uppercase tracking-wider mb-1.5">⚡ Fă asta acum — sub 5 minute</div>
          <div className="text-sm text-white/85 font-medium leading-relaxed">{result.micro_actiune_azi}</div>
        </div>
      )}

      {/* Insights — toate, nu doar primele 3 */}
      {result.insights?.length > 0 && (
        <>
          <SectionTitle icon="💡" label="Insights" />
          <div className="space-y-2">
            {result.insights.map((ins: any, i: number) => {
              const c = prColor(ins.prioritate)
              return (
                <div key={i} className="rounded-xl p-4" style={{ background: c.bg, border: `1px solid ${c.bd}` }}>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{ins.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white/85 truncate">{ins.titlu}</div>
                      <div className="text-xs text-white/45 mt-0.5 leading-relaxed">{ins.descriere}</div>
                      {ins.mecanism && <div className="text-xs bg-indigo-500/[0.06] border border-indigo-500/[0.15] rounded-lg px-3 py-2 mt-2 text-indigo-300/80">🔬 {ins.mecanism}</div>}
                      {ins.citare && <div className="text-[10px] text-indigo-400/70 mt-1 italic">📚 {ins.citare}</div>}
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-green-400/80 bg-green-500/[0.05] rounded-lg px-3 py-2">✅ {ins.actiune}</div>
                  {ins.impact && <div className="mt-1 text-xs text-yellow-400/70">🎯 {ins.impact}</div>}
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Nutriție */}
      {result.nutritie && (
        <>
          <SectionTitle icon="🥗" label="Nutriție" />
          <div className="card p-5">
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { l: 'Calorii', v: `${result.nutritie.calorii_recomandate}`, c: '#facc15' },
                { l: 'Proteine', v: `${result.nutritie.proteine_g}g`, c: '#f87171' },
                { l: 'Carbohidrați', v: `${result.nutritie.carbohidrati_g}g`, c: '#60a5fa' },
                { l: 'Grăsimi', v: `${result.nutritie.grasimi_g}g`, c: '#4ade80' },
                { l: 'Apă', v: `${result.nutritie.apa_litri}L`, c: '#38bdf8' },
              ].map((m, i) => (
                <div key={i} className="text-center p-3 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                  <div className="font-fraunces text-xl font-bold leading-none" style={{ color: m.c }}>{m.v}</div>
                  <div className="text-[9px] text-white/35 uppercase tracking-wide mt-1">{m.l}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-500/[0.05] border border-green-500/[0.15] rounded-xl p-3">
                <div className="text-[10px] font-bold text-green-400 uppercase tracking-wider mb-2">+ Prioritar</div>
                {result.nutritie.alimente_prioritare?.map((a: string, i: number) => (
                  <div key={i} className="text-xs text-white/60 mb-1.5 pl-2 border-l-2 border-green-500/30 leading-relaxed">{a}</div>
                ))}
              </div>
              <div className="bg-red-500/[0.05] border border-red-500/[0.15] rounded-xl p-3">
                <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-2">− Reduce</div>
                {result.nutritie.alimente_reduce?.map((a: string, i: number) => (
                  <div key={i} className="text-xs text-white/60 mb-1.5 pl-2 border-l-2 border-red-500/30 leading-relaxed">{a}</div>
                ))}
              </div>
            </div>
          </div>
          {result.nutritie.plan_zi && (
            <div className="card p-4">
              <div className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-3">🍽️ Plan mâine</div>
              {[{ icon: '🌅', l: 'Dimineața', v: result.nutritie.plan_zi.dimineata }, { icon: '☀️', l: 'Prânz', v: result.nutritie.plan_zi.pranz }, { icon: '🌙', l: 'Seara', v: result.nutritie.plan_zi.seara }].map((item, i) => (
                <div key={i} className={`flex gap-3 py-3 ${i < 2 ? 'border-b border-white/[0.05]' : ''}`}>
                  <span className="text-lg flex-shrink-0">{item.icon}</span>
                  <div><div className="text-[10px] font-bold text-white/30 uppercase mb-1">{item.l}</div><div className="text-sm text-white/70 leading-relaxed">{item.v}</div></div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Ciclu menstrual — doar dacă există date */}
      {result.ciclu_menstrual && (
        <>
          <SectionTitle icon="🌙" label="Ciclu Menstrual" />
          <div className="bg-purple-500/[0.06] border border-purple-500/[0.18] rounded-xl p-5">
            <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-3">🌙 Faza ta curentă</div>
            <div className="font-fraunces text-lg font-bold text-white/85 mb-2">{result.ciclu_menstrual.faza_curenta}</div>
            <p className="text-sm text-white/65 leading-relaxed">{result.ciclu_menstrual.descriere_faza}</p>
          </div>
          {result.ciclu_menstrual.nutritie_recomandata && (
            <div className="card p-4">
              <div className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-3">🥗 Nutriție specifică fazei</div>
              {result.ciclu_menstrual.nutritie_recomandata.map((n: string, i: number) => (
                <div key={i} className="flex gap-2 py-2 border-b border-white/[0.04]">
                  <span className="text-purple-400 flex-shrink-0 text-sm">→</span>
                  <span className="text-sm text-white/65 leading-relaxed">{n}</span>
                </div>
              ))}
            </div>
          )}
          {result.ciclu_menstrual.sport_recomandat && (
            <div className="card p-4">
              <div className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-3">🏃 Sport adaptat fazei</div>
              <p className="text-sm text-white/65 leading-relaxed">{result.ciclu_menstrual.sport_recomandat}</p>
              {result.ciclu_menstrual.atentionare_sport && (
                <div className="mt-3 bg-yellow-500/[0.06] border border-yellow-500/[0.18] rounded-xl p-3 text-xs text-yellow-400/80">
                  ⚠️ {result.ciclu_menstrual.atentionare_sport}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Suplimente */}
      {(result.suplimente_sigure?.length > 0 || result.suplimente_contraindicate?.length > 0) && (
        <>
          <SectionTitle icon="💊" label="Suplimente" />
          {result.suplimente_sigure?.length > 0 && (
            <div className="card p-5">
              <div className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-3">✅ Suplimente recomandate (verificate cu medicatia)</div>
              {result.suplimente_sigure.map((s: any, i: number) => (
                <div key={i} className="flex gap-3 py-3 border-b border-white/[0.05]">
                  <span className="text-xl flex-shrink-0">💊</span>
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-semibold text-white/85">{s.supliment}</span>
                      <span className="text-xs text-green-400 bg-green-500/[0.1] px-2 py-0.5 rounded-full border border-green-500/[0.2]">{s.doza}</span>
                    </div>
                    <div className="text-xs text-white/55 leading-relaxed">{s.motiv}</div>
                    {s.timing && <div className="text-[10px] text-indigo-400/70 mt-1">⏰ {s.timing}</div>}
                    {s.citare && <div className="text-[10px] text-white/30 italic mt-1">📚 {s.citare}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {result.suplimente_contraindicate?.length > 0 && (
            <div className="bg-red-500/[0.06] border border-red-500/[0.2] rounded-xl p-5">
              <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-3">⛔ Contraindicate cu medicatia ta</div>
              {result.suplimente_contraindicate.map((s: any, i: number) => (
                <div key={i} className="py-2 border-b border-red-500/[0.1]">
                  <div className="text-sm font-semibold text-red-400 mb-1">🚫 {s.supliment}</div>
                  <div className="text-xs text-white/55">{s.motivul}</div>
                  {s.alternativa && <div className="text-xs text-green-400/70 mt-1">✅ Alternativă: {s.alternativa}</div>}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Hormoni */}
      {result.hormoni && (
        <>
          <SectionTitle icon="⚗️" label="Hormoni" />
          <div className="card p-5">
            <p className="text-sm text-white/70 leading-relaxed mb-3">{result.hormoni.evaluare}</p>
            {result.hormoni.prioritati?.map((h: string, i: number) => (
              <div key={i} className="flex gap-2 py-2 border-t border-white/[0.05]">
                <span className="text-green-400 flex-shrink-0 text-sm">→</span>
                <span className="text-sm text-white/65 leading-relaxed">{h}</span>
              </div>
            ))}
          </div>
          {result.hormoni.optimizare_naturala?.length > 0 && (
            <div className="bg-amber-500/[0.06] border border-amber-500/[0.18] rounded-xl p-5">
              <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-3">⚡ Optimizare hormonală naturală</div>
              {result.hormoni.optimizare_naturala.map((o: string, i: number) => (
                <div key={i} className="flex gap-2 py-2 border-t border-amber-500/[0.1]">
                  <span className="text-amber-400 flex-shrink-0">💪</span>
                  <span className="text-sm text-white/65 leading-relaxed">{o}</span>
                </div>
              ))}
            </div>
          )}
          {result.hormoni.hormoni_de_verificat?.length > 0 && (
            <div className="bg-indigo-500/[0.06] border border-indigo-500/[0.15] rounded-xl p-5">
              <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-3">🧪 Hormoni de verificat (analize)</div>
              {result.hormoni.hormoni_de_verificat.map((h: string, i: number) => (
                <div key={i} className="text-xs text-white/55 mb-1.5 pl-2 border-l-2 border-indigo-500/30 leading-relaxed">{h}</div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Sport */}
      {result.sport && (
        <>
          <SectionTitle icon="🏃" label="Sport" />
          <div className="space-y-2">
            {[{ icon: '📊', l: 'Evaluare', v: result.sport.evaluare_curenta }, { icon: '🎯', l: 'Zona HR', v: result.sport.zona_recomandata }, { icon: '📅', l: 'Plan săptămânal', v: result.sport.plan_saptamana }, { icon: '😴', l: 'Recuperare', v: result.sport.recuperare }, { icon: '🌿', l: 'Outdoor', v: result.sport.outdoor_specific }].filter(i => i.v).map((item, i) => (
              <div key={i} className="card p-4 flex gap-3">
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                <div><div className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-1">{item.l}</div><div className="text-sm text-white/70 leading-relaxed">{item.v}</div></div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Somn */}
      {result.somn && (
        <>
          <SectionTitle icon="😴" label="Somn" />
          <div className="card p-5">
            <p className="text-sm text-white/70 leading-relaxed mb-3">{result.somn.evaluare}</p>
            {result.somn.protocoale?.map((p: string, i: number) => (
              <div key={i} className="flex gap-2 py-2 border-t border-white/[0.05]">
                <span className="text-blue-400">🌙</span>
                <span className="text-sm text-white/60 leading-relaxed">{p}</span>
              </div>
            ))}
            <div className="flex gap-2 mt-3 flex-wrap">
              {result.somn.ora_culcare && <span className="text-xs text-green-400 bg-green-500/[0.08] border border-green-500/[0.2] px-3 py-1 rounded-full">🕙 {result.somn.ora_culcare}</span>}
              {result.somn.suplimente_somn && <span className="text-xs text-white/45 bg-white/[0.04] border border-white/[0.1] px-3 py-1 rounded-full">💊 {result.somn.suplimente_somn}</span>}
            </div>
          </div>
        </>
      )}

      {/* Mental — include lumina naturală + conexiune socială */}
      {result.sanatate_mintala && (
        <>
          <SectionTitle icon="🧠" label="Mental" />
          <div className="card p-5">
            <p className="text-sm text-white/70 leading-relaxed mb-3">{result.sanatate_mintala.evaluare}</p>
            {result.sanatate_mintala.practici?.map((p: string, i: number) => (
              <div key={i} className="flex gap-2 py-2 border-t border-white/[0.05]">
                <span className="text-purple-400">→</span>
                <span className="text-sm text-white/60 leading-relaxed">{p}</span>
              </div>
            ))}
            {result.sanatate_mintala.viata_sociala && (
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
        </>
      )}

      {/* Sexual */}
      {result.sanatate_sexuala && (
        <>
          <SectionTitle icon="🌹" label="Sexual" />
          <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl text-xs text-white/30 leading-relaxed">
            🌹 Informații educaționale bazate pe studii clinice. Consultați un specialist pentru probleme specifice.
          </div>
          {result.sanatate_sexuala.frecventa_recomandata && (
            <div className="bg-pink-500/[0.08] border border-pink-500/[0.2] rounded-xl p-4">
              <div className="text-[10px] font-bold text-pink-400 uppercase tracking-wider mb-1.5">💕 Frecvență recomandată pentru profilul tău</div>
              <div className="text-sm text-white/85 font-medium leading-relaxed">{result.sanatate_sexuala.frecventa_recomandata}</div>
            </div>
          )}
          <div className="card p-5">
            <p className="text-sm text-white/70 leading-relaxed mb-3">{result.sanatate_sexuala.evaluare}</p>
            {result.sanatate_sexuala.recomandari?.map((r: string, i: number) => (
              <div key={i} className="flex gap-2 py-2 border-t border-white/[0.05]">
                <span className="text-green-400 flex-shrink-0">🌿</span>
                <span className="text-sm text-white/65 leading-relaxed">{r}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Anti-aging */}
      {result.anti_aging && (
        <>
          <SectionTitle icon="⏳" label="Anti-aging" />
          <div className="bg-purple-500/[0.06] border border-purple-500/[0.18] rounded-xl p-5">
            <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-2">⏳ Vârstă biologică estimată</div>
            <div className="font-fraunces text-lg font-bold text-white/85">{result.anti_aging.varsta_biologica}</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-500/[0.05] border border-green-500/[0.15] rounded-xl p-4">
              <div className="text-[10px] font-bold text-green-400 uppercase tracking-wider mb-2">✓ Pro-longevitate</div>
              {result.anti_aging.prioritati?.map((p: string, i: number) => (
                <div key={i} className="text-xs text-white/60 mb-1.5 pl-2 border-l-2 border-green-500/30 leading-relaxed">{p}</div>
              ))}
            </div>
            <div className="bg-indigo-500/[0.05] border border-indigo-500/[0.15] rounded-xl p-4">
              <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-2">📋 Analize recomandate</div>
              {result.anti_aging.analize_recomandate?.map((a: string, i: number) => (
                <div key={i} className="text-xs text-white/55 mb-1.5 pl-2 border-l-2 border-indigo-500/30 leading-relaxed">{a}</div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Mit demolat */}
      {result.mit_demontat && (
        <>
          <SectionTitle icon="🚫" label="Mit demolat" />
          <div className="card p-5">
            <p className="text-sm text-white/70 leading-relaxed">{result.mit_demontat}</p>
          </div>
        </>
      )}

      {/* Disclaimer */}
      <div className="card p-4">
        <div className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-2">⚕️ Disclaimer</div>
        <p className="text-xs text-white/25 leading-relaxed">{result.disclaimer} Urgențe: <strong className="text-white/40">112</strong></p>
      </div>
    </div>
  )
}
