'use client'

import { Task, usePlannerStore } from '@/store/usePlannerStore'

export default function TaskItem({ task }: { task: Task }) {
  const toggleDone = usePlannerStore((s) => s.toggleDone)

  return (
    <button
      onClick={() => toggleDone(task.id)}
      className="w-full flex items-center gap-3 py-3 px-4 rounded-xl transition-all active:scale-[0.98]"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        marginBottom: '8px',
        opacity: task.done ? 0.45 : 1,
        minHeight: '44px',
        textAlign: 'left',
      }}
    >
      {/* Checkbox */}
      <span
        className="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm transition-all"
        style={{
          borderColor: task.done ? 'var(--accent)' : 'var(--nice)',
          background: task.done ? 'var(--accent)' : 'transparent',
          color: '#fff',
        }}
      >
        {task.done ? '✓' : ''}
      </span>

      {/* Title */}
      <span
        className="flex-1 text-base"
        style={{
          color: 'var(--fg)',
          textDecoration: task.done ? 'line-through' : 'none',
        }}
      >
        {task.title}
      </span>

      {/* Duration */}
      <span className="text-sm flex-shrink-0" style={{ color: 'var(--nice)' }}>
        ⏱ {task.duration} хв
      </span>
    </button>
  )
}
