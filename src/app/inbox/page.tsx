'use client'

import Link from 'next/link'
import { usePlannerStore } from '@/store/usePlannerStore'
import TaskCard from '@/components/TaskCard'

export default function InboxPage() {
  const inbox = usePlannerStore((s) => s.inbox)

  if (inbox.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 pt-24 text-center">
        <span className="text-6xl drop-shadow-lg">📭</span>
        <div>
          <h2
            className="text-xl font-semibold"
            style={{ color: 'var(--fg)', textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}
          >
            Inbox порожній
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--fg-sub)' }}>
            Спочатку зроби brain dump
          </p>
        </div>
        <Link
          href="/capture"
          className="px-6 py-3 rounded-2xl font-semibold text-white transition-all active:scale-95"
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.78) 0%, rgba(99,102,241,0.78) 100%)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(139,92,246,0.52)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 4px 20px rgba(139,92,246,0.35)',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          → Capture
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1
          className="text-3xl font-bold tracking-tight"
          style={{ color: 'var(--fg)', textShadow: '0 2px 16px rgba(0,0,0,0.4)' }}
        >
          Inbox{' '}
          <span className="text-lg font-normal ml-1" style={{ color: 'var(--fg-sub)' }}>
            {inbox.length}{' '}
            {inbox.length === 1 ? 'задача' : inbox.length < 5 ? 'задачі' : 'задач'}
          </span>
        </h1>
      </div>

      <div className="flex flex-col gap-3">
        {inbox.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  )
}
