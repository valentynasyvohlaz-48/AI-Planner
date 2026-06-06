'use client'

import Link from 'next/link'
import { usePlannerStore } from '@/store/usePlannerStore'
import TaskCard from '@/components/TaskCard'

export default function InboxPage() {
  const inbox = usePlannerStore((s) => s.inbox)

  if (inbox.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 pt-20 text-center">
        <span className="text-6xl">📭</span>
        <h2 className="text-xl font-semibold" style={{ color: 'var(--fg)' }}>
          Inbox порожній
        </h2>
        <p className="text-base" style={{ color: 'var(--nice)' }}>
          Спочатку зроби brain dump
        </p>
        <Link
          href="/capture"
          className="mt-2 px-6 py-3 rounded-2xl font-semibold text-white"
          style={{ background: 'var(--accent)', minHeight: '44px', display: 'flex', alignItems: 'center' }}
        >
          → Capture
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-5" style={{ color: 'var(--fg)' }}>
        Inbox{' '}
        <span
          className="text-lg font-normal ml-1"
          style={{ color: 'var(--nice)' }}
        >
          {inbox.length} {inbox.length === 1 ? 'задача' : inbox.length < 5 ? 'задачі' : 'задач'}
        </span>
      </h1>

      <div>
        {inbox.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  )
}
