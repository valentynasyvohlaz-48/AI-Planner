'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { usePlannerStore } from '@/store/usePlannerStore'
import TaskItem from '@/components/TaskItem'
import ProgressBar from '@/components/ProgressBar'

export default function TodayPage() {
  const today = usePlannerStore((s) => s.today)

  const { pending, done } = useMemo(() => {
    return {
      pending: today.filter((t) => !t.done),
      done: today.filter((t) => t.done),
    }
  }, [today])

  if (today.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 pt-20 text-center">
        <span className="text-6xl">🗓️</span>
        <h2 className="text-xl font-semibold" style={{ color: 'var(--fg)' }}>
          Немає задач
        </h2>
        <p className="text-base" style={{ color: 'var(--nice)' }}>
          Іди в Inbox і постав задачі на сьогодні
        </p>
        <Link
          href="/inbox"
          className="mt-2 px-6 py-3 rounded-2xl font-semibold text-white"
          style={{ background: 'var(--accent)', minHeight: '44px', display: 'flex', alignItems: 'center' }}
        >
          → Inbox
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4" style={{ color: 'var(--fg)' }}>
        Сьогодні
      </h1>

      <ProgressBar done={done.length} total={today.length} />

      <div>
        {pending.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
        {done.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </div>
    </div>
  )
}
