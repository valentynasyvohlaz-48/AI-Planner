'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { usePlannerStore } from '@/store/usePlannerStore'

export default function BottomTabBar() {
  const pathname = usePathname()
  const inbox = usePlannerStore((s) => s.inbox)
  const today = usePlannerStore((s) => s.today)

  const done  = today.filter((t) => t.done).length
  const total = today.length

  const tabs = [
    {
      href: '/inbox',
      icon: '📥',
      label: 'Inbox',
      badge: inbox.length > 0 ? String(inbox.length) : null,
      accent: false,
    },
    {
      href: '/today',
      icon: '✅',
      label: 'Today',
      badge: total > 0 ? `${done}/${total}` : null,
      accent: false,
    },
    {
      href: '/capture',
      icon: '🎤',
      label: 'Capture',
      badge: null,
      accent: true,
    },
    {
      href: '/calendar',
      icon: '📅',
      label: 'Calendar',
      badge: null,
      accent: false,
    },
    {
      href: '/insights',
      icon: '✨',
      label: 'Insights',
      badge: null,
      accent: false,
    },
  ]

  return (
    <nav
      className="glass-nav fixed bottom-0 left-0 right-0 flex justify-around items-center z-50"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
        height: '72px',
      }}
    >
      {tabs.map((tab) => {
        const active = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex flex-col items-center justify-center gap-1 w-full h-full relative transition-all duration-150 active:scale-90"
            style={{
              color: active
                ? tab.accent
                  ? 'var(--accent)'
                  : 'var(--accent)'
                : 'var(--fg-sub)',
              fontWeight: active ? 600 : 400,
              textDecoration: 'none',
              minWidth: '44px',
            }}
          >
            <span
              className="text-xl transition-transform duration-150"
              style={{
                filter: active
                  ? 'drop-shadow(0 0 8px rgba(167,139,250,0.8))'
                  : tab.accent
                  ? 'drop-shadow(0 0 6px rgba(139,92,246,0.5))'
                  : 'none',
                transform: active ? 'scale(1.15)' : tab.accent ? 'scale(1.08)' : 'scale(1)',
              }}
            >
              {tab.icon}
            </span>
            <span
              className="text-[11px] font-medium tracking-wide"
              style={{
                color: active
                  ? 'var(--accent)'
                  : tab.accent
                  ? 'rgba(167,139,250,0.7)'
                  : 'var(--fg-dim)',
              }}
            >
              {tab.label}
            </span>

            {/* Badge */}
            {tab.badge && (
              <span
                className="absolute top-1.5 right-1 text-[10px] font-bold rounded-full px-1.5 py-px leading-none"
                style={{
                  background: 'rgba(139,92,246,0.75)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(139,92,246,0.5)',
                  color: '#fff',
                }}
              >
                {tab.badge}
              </span>
            )}

            {/* Active indicator pill */}
            {active && (
              <span
                className="absolute bottom-1 rounded-full"
                style={{
                  width: '20px',
                  height: '3px',
                  background: 'var(--accent)',
                  boxShadow: '0 0 8px rgba(167,139,250,0.7)',
                }}
              />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
