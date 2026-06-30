'use client'
// src/components/DescarcaPDF.tsx

import { useState } from 'react'

interface DescarcaPDFProps {
  analizaId?: number
  tip?: 'analiza' | 'complet'
  label?: string
  className?: string
}

export default function DescarcaPDF({
  analizaId,
  tip = 'analiza',
  label = '📄 Descarcă raport PDF',
  className = '',
}: DescarcaPDFProps) {
  const [loading, setLoading] = useState(false)

  const descarca = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analiza_id: analizaId, tip }),
      })

      if (!res.ok) throw new Error('Eroare generare PDF')

      const { html, filename } = await res.json()

      // Deschide HTML în tab nou pentru print/save as PDF
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
      const url  = URL.createObjectURL(blob)
      const win  = window.open(url, '_blank')

      if (win) {
        win.onload = () => {
          win.document.title = filename?.replace('.pdf', '') || 'Raport Be-Human'
          // Declanșează automat dialogul de print (Ctrl+P)
          // Utilizatorul alege "Save as PDF" în dialogul de print
          setTimeout(() => win.print(), 500)
        }
      }

      setTimeout(() => URL.revokeObjectURL(url), 60000)

    } catch (e) {
      alert('Eroare la generarea raportului. Încearcă din nou.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={descarca} disabled={loading}
      className={`flex items-center gap-2 text-sm transition-all ${className}`}>
      {loading ? (
        <>
          <span className="animate-spin text-base">⏳</span>
          <span>Generez PDF...</span>
        </>
      ) : (
        <span>{label}</span>
      )}
    </button>
  )
}
