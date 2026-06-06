'use client'

import { Task, usePlannerStore } from '@/store/usePlannerStore'
import { useState } from 'react'

export default function TaskCard({ task }: { task: Task }) {
  const moveToToday    = usePlannerStore((s) => s.moveToToday)
  const deleteFromInbox = usePlannerStore((s) => s.deleteFromInbox)
  const [removing, setRemoving] = useState(false)

  const handleMove = () => {
    setRemoving(true)
    setTimeout(() => moveToToday(task.id), 280)
  }

  const handleDelete = () => {
    setRemoving(true)
    setTimeout(() => deleteFromInbox(task.id), 280)
  }

  const isMust = task.priority === 'must'

  return (
    <div
      className="glass rounded-3xl p-4 card-exit"
      style={{
        opacity: removing ? 0 : 1,
        transform: removing ? 'translateX(60px) scale(0.95)' : 'translateX(0) scale(1)',
      }}
    >
      {/* Meta row */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {/* Priority badge */}
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
          style={
            isMust
              ? {
                  background: 'var(--must-bg)',
                  border: '1px solid var(--must-border)',
                  color: 'var(--must)',
                }
              : {
                  background: 'var(--nice-bg)',
                  border: '1px solid var(--nice-border)',
                  color: 'var(--fg-sub)',
                }
          }
        >
          {isMust ? '🔴 must' : '⚪ nice'}
        </span>

        <span className="text-xs" style={{ color: 'var(--fg-sub)' }}>
          ⏱ {task.duration} хв
        </span>

        {task.deadline && (
          <span className="text-xs" style={{ color: 'var(--fg-sub)' }}>
            📅 {task.deadline}
          </span>
        )}
      </div>

      {/* Title */}
      <p
        className="font-medium text-base mb-4 leading-snug"
        style={{ color: 'var(--fg)' }}
      >
        {task.title}
      </p>

      {/* Actions */}
      <div className="flex gap-2">
        {/* Move to Today */}
        <button
          onClick={handleMove}
          className="flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-all active:scale-95"
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.68) 0%, rgba(99,102,241,0.68) 100%)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(139,92,246,0.46)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.28), 0 4px 16px rgba(139,92,246,0.30)',
            color: '#fff',
            minHeight: '44px',
          }}
        >
          ✓ На сьогодні
        </button>

        {/* Delete */}
        <button
          onClick={handleDelete}
          className="px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all active:scale-95"
          style={{
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.14)',
            color: 'var(--fg-sub)',
            minHeight: '44px',
            minWidth: '44px',
          }}
        >
          🗑
        </button>
      </div>
    </div>
  )
}
