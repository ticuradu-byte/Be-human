'use client'
// src/components/SelectorLimba.tsx
// Buton schimbare limbă — apare în header și în setări cont

import { useState, useEffect } from 'react'
import { type Limba, LIMBI_DISPONIBILE, setLimba } from '@/lib/i18n'

export default function SelectorLimba() {
  const [limbaActiva, setLimbaActiva] = useState<Limba>('ro')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('be-human-limba') as Limba
    if (saved) setLimbaActiva(saved)
    else {
      const browser = navigator.language.slice(0, 2)
      if (browser === 'de') setLimbaActiva('de')
      else if (browser === 'en') setLimbaActiva('en')
    }
  }, [])

  const limbaInfo = LIMBI_DISPONIBILE.find(l => l.cod === limbaActiva)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.07] transition-all text-sm text-white/60"
      >
        <span className="text-base">{limbaInfo?.flag}</span>
        <span className="text-xs font-medium uppercase">{limbaActiva}</span>
        <span className="text-white/25 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 bg-[#0f1a11] border border-white/[0.1] rounded-xl overflow-hidden shadow-2xl z-50 min-w-[140px]">
          {LIMBI_DISPONIBILE.map(l => (
            <button
              key={l.cod}
              onClick={() => { setLimba(l.cod); setOpen(false) }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all hover:bg-white/[0.05] ${
                limbaActiva === l.cod
                  ? 'text-green-400 bg-green-500/[0.08]'
                  : 'text-white/60'
              }`}
            >
              <span className="text-base">{l.flag}</span>
              <span>{l.label}</span>
              {limbaActiva === l.cod && <span className="ml-auto text-green-400 text-xs">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
