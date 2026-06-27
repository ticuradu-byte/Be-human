'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function WithingsCallbackContent() {
  const router = useRouter()
  const params = useSearchParams()
  const [status, setStatus] = useState('Se conectează Withings...')

  useEffect(() => {
    const code = params.get('code')
    const userId = params.get('state')
    if (!code || !userId) { setStatus('Eroare: parametri lipsă'); return }

    fetch('/api/wearables/withings/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, userId }),
    })
    .then(r => r.json())
    .then(data => {
      if (data.ok) {
        setStatus('✅ Withings conectat!')
        setTimeout(() => router.push('/dashboard/wearables'), 1500)
      } else {
        setStatus('❌ Eroare la conectare: ' + (data.error || 'necunoscută'))
      }
    })
  }, [])

  return (
    <div className="min-h-screen bg-[#13161a] flex items-center justify-center">
      <div className="text-white text-center">
        <div className="text-4xl mb-4">⚖️</div>
        <div className="text-lg">{status}</div>
      </div>
    </div>
  )
}

export default function WithingsCallback() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#13161a]" />}>
      <WithingsCallbackContent />
    </Suspense>
  )
}
