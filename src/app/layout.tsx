// src/app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'be-human · Wellness AI Personal',
  description: 'Agentul tău personal de wellness bazat pe medicină funcțională. Analize medicale, date smartwatch, nutriție — totul corelat.',
  keywords: 'wellness ai, medicină funcțională, sănătate personalizată, Oura, Garmin, analize medicale',
  openGraph: {
    title: 'be-human · Wellness AI Personal',
    description: 'Înțelege-ți corpul în totalitate',
    url: 'https://be-human.ro',
    siteName: 'be-human',
    locale: 'ro_RO',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Fraunces:ital,wght@0,700;0,900;1,700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#13161a] text-[#e2ddd6] antialiased">{children}</body>
    </html>
  )
}
