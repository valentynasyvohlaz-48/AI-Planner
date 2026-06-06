'use client'

import Link from 'next/link'
import { useMemo, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { usePlannerStore } from '@/store/usePlannerStore'
import TaskItem from '@/components/TaskItem'
import ProgressBar from '@/components/ProgressBar'

const DailyDebrief = dynamic(() => import('@/components/DailyDebrief'), { ssr: false })

export default function TodayPage() {
  const today = usePlannerStore((s) => s.today)
  const lastDebriefDate = usePlannerStore((s) => s.lastDebriefDate)
  const [showDebrief, setShowDebrief] = useState(false)

  useEffect(() => {
    const hour = new Date().getHours()
    const todayDate = new Date().toISOString().slice(0, 10)
    if (hour >= 19 && lastDebriefDate !== todayDate && today.length > 0) {
      setShowDebrief(true)
    }
  }, [today.length, lastDebriefDate])

  const { pending, done } = useMemo(() => ({
    pending: today.filter((t) => !t.done),
    done:    today.filter((t) =>  t.done),
  }), [today])

  if (today.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 pt-24 text-center">
        <span className="text-6xl drop-shadow-lg">🗓️</span>
        <div>
          <h2
            className="text-xl font-semibold"
            style={{ color: 'var(--fg)', textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}
          >
            Немає задач
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--fg-sub)' }}>
            Іди в Inbox і постав задачі на сьогодні
          </p>
        </div>
        <Link
          href="/inbox"
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
          → Inbox
        </Link>
      </div>
    )
  }

  return (
    <div>
      {showDebrief && (
        <DailyDebrief onClose={() => setShowDebrief(false)} />
      )}

      <h1
        className="text-3xl font-bold tracking-tight mb-5"
        style={{ color: 'var(--fg)', textShadow: '0 2px 16px rgba(0,0,0,0.4)' }}
      >
        Сьогодні
      </h1>

      <ProgressBar done={done.length} total={today.length} />

      <div className="flex flex-col gap-2 mt-4">
        {pending.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
        {done.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </div>

      {/* Debrief button — always visible when tasks exist */}
      <div style={{ marginTop: 24 }}>
        <button
          onClick={() => setShowDebrief(true)}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: 18,
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.18)',
            color: 'var(--fg-sub)',
            minHeight: 52,
          }}
        >
          🌙 Розібрати день
        </button>
      </div>
    </div>
  )
}
