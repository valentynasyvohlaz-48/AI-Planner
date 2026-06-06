'use client'

import { Task, usePlannerStore } from '@/store/usePlannerStore'
import { useState } from 'react'

export default function TaskCard({ task }: { task: Task }) {
  const moveToToday = usePlannerStore((s) => s.moveToToday)
  const deleteFromInbox = usePlannerStore((s) => s.deleteFromInbox)
  const [removing, setRemoving] = useState(false)

  const handleMove = () => {
    setRemoving(true)
    setTimeout(() => moveToToday(task.id), 300)
  }

  const handleDelete = () => {
    setRemoving(true)
    setTimeout(() => deleteFromInbox(task.id), 300)
  }

  return (
    <div
      className="rounded-2xl p-4 mb-3 shadow-sm transition-all duration-300"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        opacity: removing ? 0 : 1,
        transform: removing ? 'translateX(100%)' : 'translateX(0)',
      }}
    >
      {/* Meta row */}
      <div className="flex items-center gap-2 mb-2 text-sm">
        <span
          className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
          style={{ background: task.priority === 'must' ? 'var(--must)' : 'var(--nice)' }}
        >
          {task.priority === 'must' ? '🔴 must' : '⚪ nice'}
        </span>
        <span style={{ color: 'var(--nice)' }}>⏱ {task.duration} хв</span>
        {task.deadline && (
          <span style={{ color: 'var(--nice)' }}>📅 {task.deadline}</span>
        )}
      </div>

      {/* Title */}
      <p className="font-medium text-base mb-3" style={{ color: 'var(--fg)' }}>
        {task.title}
      </p>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleMove}
          className="flex-1 py-2 rounded-xl text-sm font-semibold transition-opacity active:opacity-70"
          style={{ background: 'var(--accent)', color: '#fff', minHeight: '44px' }}
        >
          ✓ На сьогодні
        </button>
        <button
          onClick={handleDelete}
          className="px-4 py-2 rounded-xl text-sm font-semibold transition-opacity active:opacity-70"
          style={{
            background: 'var(--border)',
            color: 'var(--fg)',
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
