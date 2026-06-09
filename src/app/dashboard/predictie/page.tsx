'use client'
// src/app/dashboard/predictie/page.tsx
// Predicție iminentă boală 24-48h bazată pe HRV, temperatură, somn

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase'

function riscColor(nivel: string) {
  if (nivel === 'critic')  return { bg: 'rgba(239,68,68,.12)',   bd: 'rgba(239,68,68,.4)',   tx: '#f87171',  icon: '🚨' }
  if (nivel === 'ridicat') return { bg: 'rgba(249,115,22,.1)',   bd: 'rgba(249,115,22,.35)', tx: '#fb923c',  icon: '⚠️' }
  if (nivel === 'moderat') return { bg: 'rgba(250,204,21,.08)',  bd: 'rgba(250,204,21,.25)', tx: '#facc15',  icon: '📉' }
  return {                         bg: 'rgba(74,222,128,.07)',   bd: 'rgba(74,222,128,.18)', tx: '#4ade80',  icon: '✅' }
}

function tendintaIcon(t: string) {
  if (t === 'scadere') return '↓'
  if (t === 'crestere') return '↑'
  return '→'
}

export default function PredictiiPage() {
  const supabase = createBrowserClient()
  const [predictie, setPredictie] = useState<any>(null)
  const [loading, setLoading]     = useState(true)
  const [eroare, setEroare]       = useState('')
  const [dateAnalizate, setDateAnalizate] = useState(0)

  useEffect(() => { incarcaPredictie() }, [])

  const incarcaPredictie = async () => {
    setLoading(true); setEroare('')
    try {
      const res = await fetch('/api/predictie')
      if (!res.ok) throw new Error('Eroare server')
      const data = await res.json()
      setPredictie(data.predictie)
      setDateAnalizate(data.date_analizate)
    } catch {
      setEroare('Nu s-au putut încărca predicțiile. Verifică că wearables sunt conectate.')
    } finally { setLoading(false) }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="text-4xl animate-pulse">🔮</div>
      <div className="text-white/40 text-sm">Analizez ultimele 7 zile de date...</div>
    </div>
  )

  if (eroare) return (
    <div className="max-w-lg mx-auto pt-16 text-center space-y-4">
      <div className="text-4xl">⚠️</div>
      <div className="text-white/50">{eroare}</div>
      <button onClick={incarcaPredictie} className="btn-ghost text-sm py-2 px-6">Încearcă din nou</button>
    </div>
  )

  if (!predictie) return null

  const c = riscColor(predictie.risc_nivel)
  const areDateSuficiente = dateAnalizate >= 3

  return (
    <div className="fade-in space-y-4 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white mb-1">🔮 Predicție Sănătate</h1>
          <p className="text-white/40 text-sm">Analiză bazată pe {dateAnalizate} zile de date · HRV, temperatură, somn</p>
        </div>
        <button onClick={incarcaPredictie} className="btn-ghost text-xs py-2 px-4">🔄 Actualizează</button>
      </div>

      {!areDateSuficiente && (
        <div className="p-4 bg-yellow-500/[0.08] border border-yellow-500/[0.2] rounded-xl text-sm text-yellow-400">
          ⚠️ Doar {dateAnalizate} zile de date disponibile. Conectează Oura sau Garmin pentru predicții mai precise (minim 3 zile necesare).
        </div>
      )}

      {/* Hero — Nivel risc */}
      <div style={{ background: c.bg, border: `1px solid ${c.bd}`, borderLeft: `6px solid ${c.tx}` }} className="rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <div className="text-5xl">{c.icon}</div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: c.tx }}>
              Risc boală iminentă
            </div>
            <div className="font-fraunces text-2xl font-bold capitalize" style={{ color: c.tx }}>
              {predictie.risc_nivel}
            </div>
          </div>
          {/* Gauge */}
          <div className="ml-auto flex-shrink-0">
            <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="7"/>
              <circle cx="40" cy="40" r="32" fill="none" stroke={c.tx} strokeWidth="7"
                strokeDasharray={`${(predictie.risc_scor/100)*201} 201`} strokeLinecap="round"/>
            </svg>
            <div style={{ marginTop: -52, textAlign: 'center' }}>
              <span className="font-fraunces text-xl font-bold" style={{ color: c.tx }}>{predictie.risc_scor}</span>
            </div>
          </div>
        </div>

        <p className="text-sm text-white/70 leading-relaxed mb-4">{predictie.explicatie}</p>

        {/* Probabilități */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-black/20 rounded-xl p-3 text-center">
            <div className="font-fraunces text-2xl font-bold" style={{ color: c.tx }}>
              {predictie.probabilitate_boala_24h}%
            </div>
            <div className="text-xs text-white/35 mt-1">Probabilitate boală în 24h</div>
          </div>
          <div className="bg-black/20 rounded-xl p-3 text-center">
            <div className="font-fraunces text-2xl font-bold text-white/60">
              {predictie.probabilitate_boala_48h}%
            </div>
            <div className="text-xs text-white/35 mt-1">Probabilitate boală în 48h</div>
          </div>
        </div>
      </div>

      {/* Semne detectate */}
      {predictie.semne_detectate?.length > 0 && (
        <div className="card p-5">
          <div className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-3">
            🔍 Semne detectate ({predictie.semne_detectate.length})
          </div>
          <div className="space-y-2">
            {predictie.semne_detectate.map((semn: string, i: number) => (
              <div key={i} className="flex gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                <span className="text-sm flex-shrink-0">{semn.split(' ')[0]}</span>
                <span className="text-sm text-white/70 leading-relaxed">{semn.slice(semn.indexOf(' ') + 1)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grafice tendință */}
      {predictie.grafic_tendinta?.length > 0 && (
        <div className="card p-5">
          <div className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-3">📈 Tendințe ultimele 7 zile</div>
          <div className="space-y-4">
            {predictie.grafic_tendinta.map((g: any, i: number) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-white/60">{g.metric}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{
                      color: g.tendinta === 'scadere' ? '#f87171' : g.tendinta === 'crestere' ? '#4ade80' : 'rgba(255,255,255,.4)'
                    }}>
                      {tendintaIcon(g.tendinta)} {Math.abs(g.deviere_procent).toFixed(0)}%
                    </span>
                  </div>
                </div>
                {/* Mini bar chart */}
                <div className="flex items-end gap-1 h-10">
                  {g.valori.map((v: number, j: number) => {
                    const max = Math.max(...g.valori)
                    const min = Math.min(...g.valori)
                    const range = max - min || 1
                    const height = ((v - min) / range) * 100
                    const isLast = j === g.valori.length - 1
                    return (
                      <div key={j} className="flex-1 rounded-t-sm min-w-[8px]" style={{
                        height: `${Math.max(10, height)}%`,
                        background: isLast
                          ? (g.tendinta === 'scadere' ? '#f87171' : '#4ade80')
                          : 'rgba(255,255,255,.15)',
                        opacity: 0.5 + (j / g.valori.length) * 0.5,
                      }} title={`${v}`}/>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recomandări */}
      {predictie.recomandari_urgente?.length > 0 && (
        <div style={{ background: c.bg, border: `1px solid ${c.bd}` }} className="rounded-2xl p-5">
          <div className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: c.tx }}>
            💊 Acțiuni recomandate acum
          </div>
          <div className="space-y-2">
            {predictie.recomandari_urgente.map((r: string, i: number) => (
              <div key={i} className="flex gap-3 py-2 border-b border-white/[0.05]">
                <span className="text-sm flex-shrink-0">{r.split(' ')[0]}</span>
                <span className="text-sm text-white/75 leading-relaxed">{r.slice(r.indexOf(' ') + 1)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risc scăzut */}
      {predictie.risc_nivel === 'scazut' && (
        <div className="card-green p-5 text-center">
          <div className="text-4xl mb-3">💪</div>
          <div className="font-fraunces text-lg font-bold text-green-400 mb-2">Totul arată excelent!</div>
          <p className="text-sm text-white/55">Niciun semn de stres imunitar. Sistemul tău imunitar funcționează optim bazat pe datele din ultimele {dateAnalizate} zile.</p>
        </div>
      )}

      {/* Note stiintifice */}
      <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
        <div className="text-[10px] font-bold text-white/25 uppercase tracking-wider mb-2">📚 Baza științifică</div>
        <div className="space-y-1">
          {[
            'HRV scade 15-25% cu 24-48h înainte de boală (Czeisler et al., Harvard)',
            'Temperatura periferică crește ≥0.3°C înainte de infecție (Oura Research 2022)',
            'Somn <6h x3 nopți consecutive → risc răceală de 4x (UCSF, 2015)',
            'Zinc luat în primele 24h reduce durata răcelii cu 33% (Cochrane 2017)',
          ].map((s, i) => (
            <div key={i} className="flex gap-2 text-xs text-white/30">
              <span className="text-white/20 flex-shrink-0">→</span>
              <span>{s}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 card">
        <p className="text-xs text-white/25 leading-relaxed">
          ⚕️ Predicțiile be-human sunt orientative, bazate pe variații față de baseline-ul tău personal. Nu înlocuiesc consultul medical. Urgențe: <strong className="text-white/40">112</strong>
        </p>
      </div>
    </div>
  )
}
