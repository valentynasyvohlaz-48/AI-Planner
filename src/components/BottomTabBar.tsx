'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { usePlannerStore } from '@/store/usePlannerStore'

export default function BottomTabBar() {
  const pathname = usePathname()
  const inbox = usePlannerStore((s) => s.inbox)
  const today = usePlannerStore((s) => s.today)

  const done = today.filter((t) => t.done).length
  const total = today.length

  const tabs = [
    {
      href: '/capture',
      icon: '🎤',
      label: 'Capture',
      badge: null,
    },
    {
      href: '/inbox',
      icon: '📥',
      label: 'Inbox',
      badge: inbox.length > 0 ? String(inbox.length) : null,
    },
    {
      href: '/today',
      icon: '✅',
      label: 'Today',
      badge: total > 0 ? `${done}/${total}` : null,
    },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex justify-around items-center border-t z-50"
      style={{
        background: 'var(--bg)',
        borderColor: 'var(--border)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        height: '64px',
      }}
    >
      {tabs.map((tab) => {
        const active = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex flex-col items-center justify-center gap-0.5 w-full h-full relative"
            style={{
              color: active ? 'var(--accent)' : 'var(--nice)',
              fontWeight: active ? 600 : 400,
              textDecoration: 'none',
              minWidth: '44px',
            }}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-xs">{tab.label}</span>
            {tab.badge && (
              <span
                className="absolute top-1 right-4 text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                {tab.badge}
              </span>
            )}
            {active && (
              <span
                className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full"
                style={{ background: 'var(--accent)' }}
              />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
