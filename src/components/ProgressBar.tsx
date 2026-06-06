interface ProgressBarProps {
  done: number
  total: number
}

export default function ProgressBar({ done, total }: ProgressBarProps) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)

  return (
    <div
      className="rounded-2xl px-4 py-3 mb-2"
      style={{
        background: 'linear-gradient(145deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.05) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.18)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35), 0 4px 16px rgba(0,0,0,0.18)',
      }}
    >
      {/* Label row */}
      <div className="flex justify-between items-center mb-2.5">
        <span className="text-xs font-medium" style={{ color: 'var(--fg-sub)' }}>
          Прогрес
        </span>
        <span
          className="text-sm font-bold tabular-nums"
          style={{ color: 'var(--fg)' }}
        >
          {done} / {total}
          <span className="text-xs font-normal ml-1.5" style={{ color: 'var(--fg-sub)' }}>
            ({pct}%)
          </span>
        </span>
      </div>

      {/* Track */}
      <div
        className="w-full rounded-full overflow-hidden"
        style={{
          height: '6px',
          background: 'rgba(255,255,255,0.10)',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.25)',
        }}
      >
        {/* Fill */}
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, rgba(139,92,246,0.95) 0%, rgba(59,130,246,0.90) 100%)',
            boxShadow: '0 0 8px rgba(139,92,246,0.6)',
          }}
        />
      </div>
    </div>
  )
}
