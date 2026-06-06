'use client'

import { useMemo, useState } from 'react'
import { usePlannerStore, LIFE_AREAS, AREA_CONFIG, LifeArea } from '@/store/usePlannerStore'
import { generateLifeInsights } from '@/app/actions'
import WheelOfLife from '@/components/WheelOfLife'

function computeBalanceScore(
  areaStats: Record<string, { tasks: number; hours: number; done: number }>
): number {
  const areas = LIFE_AREAS
  const values = areas.map((a) => areaStats[a]?.hours ?? 0)
  const areasWithData = values.filter((v) => v > 0).length
  if (areasWithData === 0) return 0

  const total = values.reduce((s, v) => s + v, 0)
  if (total === 0) return 0

  const fractions = values.map((v) => v / total)
  const ideal = 1 / 6
  const maxDeviation = ideal * (6 - 1)
  const deviation = fractions.reduce((s, f) => s + Math.abs(f - ideal), 0) / 2
  const evenness = Math.max(0, 1 - deviation / maxDeviation)

  const areaCoverage = areasWithData / 6

  return Math.round(areaCoverage * 50 + evenness * 50)
}

export default function InsightsPage() {
  const history = usePlannerStore((s) => s.history)
  const today = usePlannerStore((s) => s.today)
  const debriefs = usePlannerStore((s) => s.debriefs)

  const [aiInsight, setAiInsight] = useState('')
  const [loadingInsight, setLoadingInsight] = useState(false)
  const [insightError, setInsightError] = useState('')

  const allDone = useMemo(() => {
    return [
      ...history,
      ...today.filter((t) => t.done),
    ]
  }, [history, today])

  const areaStats = useMemo(() => {
    const stats: Record<string, { tasks: number; hours: number; done: number }> = {}
    LIFE_AREAS.forEach((a) => {
      stats[a] = { tasks: 0, hours: 0, done: 0 }
    })

    // Count all tasks in history + today
    const allTasks = [...history, ...today]
    allTasks.forEach((t) => {
      if (!t.lifeArea || !stats[t.lifeArea]) return
      stats[t.lifeArea].tasks++
      if (t.done) {
        stats[t.lifeArea].done++
        stats[t.lifeArea].hours += t.duration / 60
      }
    })

    return stats
  }, [history, today])

  const balanceScore = useMemo(() => computeBalanceScore(areaStats), [areaStats])

  const wheelScores = useMemo(() => {
    const maxHours = Math.max(...LIFE_AREAS.map((a) => areaStats[a]?.hours ?? 0), 0.01)
    const scores: Record<LifeArea, number> = {} as Record<LifeArea, number>
    LIFE_AREAS.forEach((a) => {
      scores[a] = Math.min(1, (areaStats[a]?.hours ?? 0) / maxHours)
    })
    return scores
  }, [areaStats])

  const maxHoursInArea = useMemo(() => {
    return Math.max(...LIFE_AREAS.map((a) => areaStats[a]?.hours ?? 0), 0.01)
  }, [areaStats])

  const handleGenerateInsight = async () => {
    setLoadingInsight(true)
    setInsightError('')
    try {
      const text = await generateLifeInsights({
        areaStats,
        balanceScore,
        debriefCount: debriefs.length,
      })
      setAiInsight(text)
    } catch {
      setInsightError('Помилка генерації. Спробуй ще раз.')
    } finally {
      setLoadingInsight(false)
    }
  }

  // Circular progress ring
  const R = 46
  const CIRC = 2 * Math.PI * R
  const progressOffset = CIRC - (balanceScore / 100) * CIRC

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 24 }}>
      {/* Header */}
      <h1
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: 'var(--fg)',
          textShadow: '0 2px 16px rgba(0,0,0,0.4)',
          margin: 0,
        }}
      >
        Інсайти
      </h1>

      {/* Balance Score card */}
      <div
        className="glass"
        style={{ borderRadius: 24, padding: '24px', textAlign: 'center' }}
      >
        <p style={{ fontSize: 13, color: 'var(--fg-sub)', marginBottom: 16, fontWeight: 500 }}>
          Life Balance Score
        </p>
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="120" height="120" viewBox="0 0 120 120">
            {/* Background ring */}
            <circle
              cx="60" cy="60" r={R}
              fill="none"
              stroke="rgba(255,255,255,0.10)"
              strokeWidth="8"
            />
            {/* Progress ring */}
            <circle
              cx="60" cy="60" r={R}
              fill="none"
              stroke="url(#scoreGrad)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={progressOffset}
              transform="rotate(-90 60 60)"
            />
            <defs>
              <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
          </svg>
          <div style={{ position: 'absolute', textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--fg)' }}>
              {balanceScore}
            </div>
            <div style={{ fontSize: 11, color: 'var(--fg-dim)' }}>/100</div>
          </div>
        </div>
        <p style={{ fontSize: 13, color: 'var(--fg-sub)', marginTop: 12 }}>
          {balanceScore >= 70
            ? '🌟 Відмінний баланс!'
            : balanceScore >= 40
            ? '📈 Є куди рости'
            : '💡 Час розширити охоплення сфер'}
        </p>
      </div>

      {/* Wheel of Life */}
      <div className="glass" style={{ borderRadius: 24, padding: '20px 16px' }}>
        <p
          style={{
            fontSize: 13,
            color: 'var(--fg-sub)',
            fontWeight: 600,
            marginBottom: 12,
            textAlign: 'center',
          }}
        >
          Колесо Балансу
        </p>
        <WheelOfLife scores={wheelScores} />
      </div>

      {/* Area stats */}
      <div className="glass" style={{ borderRadius: 24, padding: '20px 16px' }}>
        <p
          style={{
            fontSize: 13,
            color: 'var(--fg-sub)',
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          Деталі по сферах
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {LIFE_AREAS.map((area) => {
            const cfg = AREA_CONFIG[area]
            const stat = areaStats[area]
            const barWidth = stat.hours > 0 ? Math.max(4, (stat.hours / maxHoursInArea) * 100) : 0

            return (
              <div key={area}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 4,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 16 }}>{cfg.emoji}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>
                      {cfg.label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--fg-dim)' }}>
                      {stat.done}/{stat.tasks} задач
                    </span>
                    <span style={{ fontSize: 12, color: cfg.color, fontWeight: 600 }}>
                      {stat.hours.toFixed(1)} год
                    </span>
                  </div>
                </div>
                {/* Bar */}
                <div
                  style={{
                    height: 6,
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: 9999,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${barWidth}%`,
                      background: cfg.color,
                      borderRadius: 9999,
                      transition: 'width 0.5s ease',
                      opacity: 0.85,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* AI Insights */}
      <div>
        <button
          onClick={handleGenerateInsight}
          disabled={loadingInsight}
          className="glass-accent"
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: 18,
            fontSize: 15,
            fontWeight: 700,
            cursor: loadingInsight ? 'not-allowed' : 'pointer',
            minHeight: 52,
          }}
        >
          {loadingInsight ? '⏳ Аналізую...' : '✨ Аналіз AI'}
        </button>

        {insightError && (
          <p style={{ color: '#ff7b7b', fontSize: 13, marginTop: 8 }}>{insightError}</p>
        )}

        {aiInsight && !loadingInsight && (
          <div
            className="glass"
            style={{
              borderRadius: 20,
              padding: '16px 18px',
              marginTop: 12,
              fontSize: 15,
              lineHeight: 1.65,
              color: 'var(--fg)',
            }}
          >
            {aiInsight}
          </div>
        )}
      </div>

      {/* Debrief count */}
      <div
        style={{
          textAlign: 'center',
          fontSize: 12,
          color: 'var(--fg-dim)',
        }}
      >
        {debriefs.length > 0
          ? `${debriefs.length} деб'рифів · ${allDone.length} виконаних задач`
          : 'Ще немає деб\'рифів — заверши свій перший день!'}
      </div>
    </div>
  )
}
