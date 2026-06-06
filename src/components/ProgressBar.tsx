interface ProgressBarProps {
  done: number
  total: number
}

export default function ProgressBar({ done, total }: ProgressBarProps) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)

  return (
    <div className="mb-6">
      <div className="flex justify-between text-sm mb-1.5" style={{ color: 'var(--nice)' }}>
        <span>Прогрес</span>
        <span style={{ color: 'var(--fg)', fontWeight: 600 }}>
          {done} / {total}
        </span>
      </div>
      <div
        className="w-full rounded-full h-2"
        style={{ background: 'var(--border)' }}
      >
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: 'var(--accent)',
          }}
        />
      </div>
    </div>
  )
}
