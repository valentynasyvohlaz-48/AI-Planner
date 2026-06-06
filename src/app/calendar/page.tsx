'use client'

import { useState, useRef, useEffect } from 'react'
import { usePlannerStore, AREA_CONFIG } from '@/store/usePlannerStore'
import { optimizeSchedule } from '@/app/actions'

const HOUR_HEIGHT = 64
const START_HOUR = 6
const END_HOUR = 23

function formatDate(d: Date): string {
  return d.toLocaleDateString('uk-UA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function minutesToTop(totalMinutes: number): number {
  const startMinutes = START_HOUR * 60
  return ((totalMinutes - startMinutes) / 60) * HOUR_HEIGHT
}

export default function CalendarPage() {
  const today = usePlannerStore((s) => s.today)
  const scheduleTask = usePlannerStore((s) => s.scheduleTask)
  const replaceToday = usePlannerStore((s) => s.replaceToday)

  const [optimizing, setOptimizing] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const todayDate = new Date().toISOString().slice(0, 10)

  const scheduledTasks = today.filter(
    (t) => t.scheduledTime && t.scheduledDate === todayDate
  )
  const unscheduledTasks = today.filter(
    (t) => !t.scheduledTime || t.scheduledDate !== todayDate
  )

  // Scroll to current time on mount
  useEffect(() => {
    if (scrollRef.current) {
      const hour = new Date().getHours()
      const offset = (hour - START_HOUR) * HOUR_HEIGHT - 80
      scrollRef.current.scrollTop = Math.max(0, offset)
    }
  }, [])

  const handleOptimize = async () => {
    if (unscheduledTasks.length === 0) return
    setOptimizing(true)
    try {
      const results = await optimizeSchedule(unscheduledTasks)
      const updated = today.map((t) => {
        const result = results.find((r) => r.id === t.id)
        if (result) {
          return { ...t, scheduledTime: result.scheduledTime, scheduledDate: todayDate }
        }
        return t
      })
      replaceToday(updated)
    } catch (err) {
      console.error('Optimize schedule error:', err)
    } finally {
      setOptimizing(false)
    }
  }

  const handleTimeChange = (id: string, time: string) => {
    if (time) {
      scheduleTask(id, time, todayDate)
    }
  }

  // Current time indicator
  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const nowTop = minutesToTop(nowMinutes)
  const showNow = now.getHours() >= START_HOUR && now.getHours() < END_HOUR

  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--fg)',
            textShadow: '0 2px 16px rgba(0,0,0,0.4)',
            marginBottom: 4,
            textTransform: 'capitalize',
          }}
        >
          {formatDate(new Date())}
        </h1>
        <button
          onClick={handleOptimize}
          disabled={optimizing || unscheduledTasks.length === 0}
          className="glass-accent"
          style={{
            padding: '8px 16px',
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 600,
            cursor: optimizing || unscheduledTasks.length === 0 ? 'not-allowed' : 'pointer',
            opacity: unscheduledTasks.length === 0 ? 0.5 : 1,
            minHeight: 36,
          }}
        >
          {optimizing ? '⏳ Оптимізую...' : '✨ AI оптимізувати'}
        </button>
      </div>

      {/* Time grid */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          borderRadius: 20,
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.14)',
          position: 'relative',
          marginBottom: 16,
          maxHeight: 'calc(100vh - 320px)',
        }}
      >
        <div
          style={{
            position: 'relative',
            height: `${(END_HOUR - START_HOUR + 1) * HOUR_HEIGHT}px`,
          }}
        >
          {/* Hour rows */}
          {hours.map((hour) => (
            <div
              key={hour}
              style={{
                position: 'absolute',
                top: (hour - START_HOUR) * HOUR_HEIGHT,
                left: 0,
                right: 0,
                height: HOUR_HEIGHT,
                display: 'flex',
                alignItems: 'flex-start',
                paddingTop: 6,
              }}
            >
              <span
                style={{
                  width: 44,
                  paddingLeft: 10,
                  fontSize: 12,
                  color: 'var(--fg-dim)',
                  fontWeight: 500,
                  flexShrink: 0,
                }}
              >
                {String(hour).padStart(2, '0')}
              </span>
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: 'rgba(255,255,255,0.08)',
                  marginTop: 8,
                }}
              />
            </div>
          ))}

          {/* Current time indicator */}
          {showNow && (
            <div
              style={{
                position: 'absolute',
                top: nowTop,
                left: 44,
                right: 0,
                height: 2,
                background: '#ff4757',
                zIndex: 10,
                boxShadow: '0 0 8px rgba(255,71,87,0.8)',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: -4,
                  top: -4,
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#ff4757',
                  boxShadow: '0 0 6px rgba(255,71,87,0.9)',
                }}
              />
            </div>
          )}

          {/* Scheduled task blocks */}
          {scheduledTasks.map((task) => {
            const mins = timeToMinutes(task.scheduledTime!)
            const top = minutesToTop(mins)
            const blockHeight = Math.max(40, (task.duration / 60) * HOUR_HEIGHT - 4)
            const color = task.lifeArea ? AREA_CONFIG[task.lifeArea].color : '#a78bfa'

            return (
              <div
                key={task.id}
                style={{
                  position: 'absolute',
                  left: 52,
                  right: 8,
                  top: top + 2,
                  height: blockHeight,
                  borderRadius: 12,
                  background: `${color}33`,
                  border: `1.5px solid ${color}77`,
                  padding: '4px 8px',
                  overflow: 'hidden',
                  cursor: 'default',
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: color,
                    lineHeight: 1.3,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {task.scheduledTime} · {task.title}
                </div>
                {blockHeight > 44 && (
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                    {task.duration} хв
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Unscheduled tasks */}
      {unscheduledTasks.length > 0 && (
        <div>
          <h3
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--fg-sub)',
              marginBottom: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Без часу
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {unscheduledTasks.map((task) => {
              const color = task.lifeArea ? AREA_CONFIG[task.lifeArea].color : '#a78bfa'
              return (
                <div
                  key={task.id}
                  className="glass-sm"
                  style={{
                    borderRadius: 14,
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    borderLeft: `3px solid ${color}`,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--fg)' }}>
                      {task.title}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--fg-dim)', marginTop: 2 }}>
                      {task.duration} хв
                    </div>
                  </div>
                  <input
                    type="time"
                    onChange={(e) => handleTimeChange(task.id, e.target.value)}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.18)',
                      borderRadius: 8,
                      padding: '4px 8px',
                      fontSize: 13,
                      color: 'var(--fg)',
                      cursor: 'pointer',
                      minHeight: 36,
                    }}
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {today.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            paddingTop: 60,
            color: 'var(--fg-sub)',
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
          <p style={{ fontSize: 16 }}>Немає задач на сьогодні</p>
        </div>
      )}
    </div>
  )
}
