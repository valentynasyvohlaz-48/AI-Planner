'use client'

import { Task, usePlannerStore, AREA_CONFIG } from '@/store/usePlannerStore'

export default function TaskItem({ task }: { task: Task }) {
  const toggleDone = usePlannerStore((s) => s.toggleDone)

  const areaColor = task.lifeArea ? AREA_CONFIG[task.lifeArea].color : null

  return (
    <button
      onClick={() => toggleDone(task.id)}
      className="w-full flex items-center gap-3 py-3 px-4 rounded-2xl transition-all duration-200 active:scale-[0.98]"
      style={{
        background: task.done
          ? 'rgba(255,255,255,0.04)'
          : 'linear-gradient(145deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.06) 100%)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: `1px solid ${task.done ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.20)'}`,
        boxShadow: task.done
          ? 'none'
          : 'inset 0 1px 0 rgba(255,255,255,0.38), 0 4px 12px rgba(0,0,0,0.18)',
        opacity: task.done ? 0.45 : 1,
        minHeight: '52px',
        textAlign: 'left',
        borderLeft: areaColor ? `3px solid ${areaColor}` : undefined,
      }}
    >
      {/* Checkbox */}
      <span
        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm transition-all duration-200"
        style={{
          background: task.done
            ? 'linear-gradient(135deg, rgba(139,92,246,0.9) 0%, rgba(99,102,241,0.9) 100%)'
            : 'rgba(255,255,255,0.08)',
          border: `2px solid ${task.done ? 'rgba(139,92,246,0.7)' : 'rgba(255,255,255,0.28)'}`,
          boxShadow: task.done ? '0 0 10px rgba(139,92,246,0.45)' : 'none',
          color: '#fff',
        }}
      >
        {task.done ? '✓' : ''}
      </span>

      {/* Title */}
      <span
        className="flex-1 text-sm font-medium"
        style={{
          color: 'var(--fg)',
          textDecoration: task.done ? 'line-through' : 'none',
        }}
      >
        {task.title}
      </span>

      {/* Duration */}
      <span
        className="text-xs flex-shrink-0 px-2 py-0.5 rounded-full"
        style={{
          color: 'var(--fg-sub)',
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.10)',
        }}
      >
        {task.duration} хв
      </span>
    </button>
  )
}
