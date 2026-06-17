'use client'
// src/app/dashboard/layout.tsx
import { useEffect, useState } from 'react'
import { createBrowserClient, PLANURI, areAcces } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
// 

const NAV = [
  { href: '/dashboard/profil',       icon: '👤', label: 'Profilul meu' },
  { href: '/dashboard',              icon: '📊', label: 'Dashboard' },
  { href: '/dashboard/analiza',      icon: '🌿', label: 'Analiză Nouă' },
  { href: '/dashboard/nutritie',     icon: '🥗', label: 'Nutriție' },
  { href: '/dashboard/sport',        icon: '🏋️', label: 'Sport' },
  { href: '/dashboard/wearables',    icon: '⌚', label: 'Wearables' },
  { href: '/dashboard/istoric',      icon: '📈', label: 'Istoric & Trend' },
  { href: '/dashboard/predictie',    icon: '🔮', label: 'Predicție Sănătate' },
  { href: '/dashboard/roata-vietii', icon: '⚖️', label: 'Roata Vieții' },
  { href: '/dashboard/challenge',    icon: '🏆', label: 'Challenge' },
  { href: '/dashboard/recuperare',   icon: '🔄', label: 'Recuperare' },
  { href: '/dashboard/cont',         icon: '💳', label: 'Contul meu' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createBrowserClient()
  const router   = useRouter()
  const pathname = usePathname()
  const [util, setUtil]   = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      let { data } = await supabase.from('utilizatori').select('*').eq('id', user.id).single()

      if (!data) {
        // Creează profil
        const nou = {
          id: user.id, email: user.email!, plan: 'free' as const,
          analize_luna: 0, luna_curenta: new Date().toISOString().slice(0, 7),
          creat_la: new Date().toISOString(),
        }
        await supabase.from('utilizatori').insert(nou)
        data = nou as any
      } else {
        // Reset lunar dacă e lună nouă
        const lunaCurenta = new Date().toISOString().slice(0, 7)
        if (data.luna_curenta !== lunaCurenta) {
          await supabase.from('utilizatori').update({ analize_luna: 0, luna_curenta: lunaCurenta }).eq('id', user.id)
          data.analize_luna = 0
        }
      }

      setUtil(data); setLoading(false)
    }
    load()
  }, [])

  const logout = async () => { await supabase.auth.signOut(); router.push('/') }

  const planInfo  = util ? PLANURI[util.plan as keyof typeof PLANURI] : PLANURI.free
  const analizeRamase = planInfo.analize < 999999 ? Math.max(0, planInfo.analize - (util?.analize_luna || 0)) : null
  const trialActiv = util?.trial_ends_at && new Date(util.trial_ends_at) > new Date()
  const trialZile  = trialActiv ? Math.ceil((new Date(util!.trial_ends_at!).getTime() - Date.now()) / 86400000) : 0

  const planBadgeClass: Record<string, string> = {
    free: 'badge-plan-free', plus: 'badge-plan-plus',
    pro: 'badge-plan-pro', familie: 'badge-plan-familie',
  }

  if (loading) return (
    <div className="min-h-screen bg-[#13161a] flex items-center justify-center">
      <div className="text-4xl animate-pulse">🫀</div>
    </div>
  )

  const Sidebar = () => (
    <aside className="w-64 flex-shrink-0 h-screen flex flex-col bg-[#13161a]/80 overflow-hidden border-r border-white/[0.05]">
      {/* Logo */}
      <div className="p-5 border-b border-white/[0.05]">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-green-700 to-green-400 rounded-xl flex items-center justify-center text-lg shadow-[0_2px_12px_rgba(34,197,94,0.25)]">🫀</div>
          <div>
            <div className="font-fraunces text-xl font-black text-green-gradient leading-none">be-human</div>
            <div className="text-[9px] text-white/25 uppercase tracking-[1.5px] mt-0.5">Wellness AI</div>
          </div>
        </Link>
      </div>

      {/* Trial banner */}
      {trialActiv && (
        <div className="mx-3 mt-3 px-3 py-2 bg-green-500/8 border border-green-500/20 rounded-xl">
          <div className="text-xs text-green-400 font-semibold">⏳ Trial Pro activ</div>
          <div className="text-[10px] text-white/35 mt-0.5">{trialZile} zile rămase</div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto min-h-0">
        {NAV.map(item => (
          <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
            className={pathname === item.href ? 'nav-item-active' : 'nav-item'}>
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
            {item.href === '/dashboard/wearables' && !areAcces(util?.plan || 'free', 'wearables_api') && (
              <span className="ml-auto text-[9px] text-white/25 uppercase">Plus</span>
            )}
          </Link>
        ))}
      </nav>

      {/* Plan + user */}
      <div className="p-4 border-t border-white/[0.05]">
        {/* Plan status */}
        {analizeRamase !== null && (
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-3 mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className={planBadgeClass[util?.plan || 'free']}>{planInfo.label}</span>
              <span className="text-[10px] text-white/35">{util?.analize_luna || 0}/{planInfo.analize}/lună</span>
            </div>
            <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-700 to-green-400 rounded-full transition-all"
                style={{ width: `${Math.min(100, ((util?.analize_luna || 0) / planInfo.analize) * 100)}%` }} />
            </div>
            <div className="text-[10px] text-white/25 mt-1">{analizeRamase} analize rămase</div>
            <Link href="/dashboard/cont" className="block mt-2 text-center text-[11px] text-green-400/70 hover:text-green-400">
              Upgrade →
            </Link>
          </div>
        )}
        {analizeRamase === null && (
          <div className="bg-green-500/[0.05] border border-green-500/[0.15] rounded-xl p-3 mb-3">
            <div className="flex items-center gap-2">
              <span className={planBadgeClass[util?.plan || 'free']}>{planInfo.label}</span>
              <span className="text-[10px] text-white/35">Analize nelimitate</span>
            </div>
          </div>
        )}

        {/* User */}
        <div className="flex items-center gap-3">
          {util?.avatar_url
            ? <img src={util.avatar_url} className="w-8 h-8 rounded-full border border-white/10 flex-shrink-0" alt="" />
            : <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-sm font-bold text-green-400 flex-shrink-0">
                {(util?.nume || util?.email || 'U')[0].toUpperCase()}
              </div>
          }
          <div className="flex-1 min-w-0">
            <div className="text-white/70 text-xs font-medium truncate">{util?.nume || 'Utilizator'}</div>
            <div className="text-white/25 text-[10px] truncate">{util?.email}</div>
          </div>
          <button onClick={logout} className="text-white/20 hover:text-white/50 transition-colors text-xs" title="Logout">⏏</button>
        </div>
      </div>
    </aside>
  )

  return (
    <div className="min-h-screen bg-[#13161a] flex">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col sticky top-0 h-screen">
        <Sidebar />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="flex flex-col h-full"><Sidebar /></div>
          <div className="flex-1 bg-black/60" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Main */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/[0.05] bg-[#13161a]/80">
          <button onClick={() => setMobileOpen(true)} className="text-white/50 text-xl">☰</button>
          <div className="font-fraunces text-lg font-black text-green-gradient">be-human</div>
          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-sm font-bold text-green-400">
            {(util?.nume || 'U')[0].toUpperCase()}
          </div>
        </div>

        <div className="flex-1 p-6 md:p-8 max-w-5xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  )
}
