'use client'

import { useState, useRef, useEffect, useCallback, CSSProperties } from 'react'
import { usePlannerStore, AREA_CONFIG, Task } from '@/store/usePlannerStore'
import { optimizeSchedule } from '@/app/actions'

/* ─────────────────── constants ─────────────────── */
const HOUR_H    = 58          // px per hour in time grid
const START_H   = 6           // grid starts at 06:00
const END_H     = 23          // grid ends at 23:00
const GRID_H    = (END_H - START_H + 1) * HOUR_H

const UK_MONTHS     = ['Січень','Лютий','Березень','Квітень','Травень','Червень','Липень','Серпень','Вересень','Жовтень','Листопад','Грудень']
const UK_MONTHS_GEN = ['січня','лютого','березня','квітня','травня','червня','липня','серпня','вересня','жовтня','листопада','грудня']
const UK_WD         = ['Пн','Вт','Ср','Чт','Пт','Сб','Нд']

type CalView = 'day' | 'week' | 'month' | 'year'

/* ─────────────────── utils ─────────────────── */
const toStr    = (d: Date) => d.toISOString().slice(0, 10)
const nowDate  = ()        => new Date(new Date().toDateString())
const addDays  = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r }
const isSameDay = (a: Date, b: Date)  => toStr(a) === toStr(b)

function startOfWeek(d: Date) {
  const r = new Date(d)
  const day = r.getDay()
  r.setDate(r.getDate() - (day === 0 ? 6 : day - 1))
  r.setHours(0, 0, 0, 0)
  return r
}

function timeMins(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
function minsToY(m: number) {
  return ((m - START_H * 60) / 60) * HOUR_H
}

function periodLabel(v: CalView, d: Date) {
  if (v === 'day')
    return d.toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  if (v === 'week') {
    const mon = startOfWeek(d), sun = addDays(mon, 6)
    return mon.getMonth() === sun.getMonth()
      ? `${mon.getDate()}–${sun.getDate()} ${UK_MONTHS_GEN[mon.getMonth()]} ${mon.getFullYear()}`
      : `${mon.getDate()} ${UK_MONTHS_GEN[mon.getMonth()]} – ${sun.getDate()} ${UK_MONTHS_GEN[sun.getMonth()]} ${sun.getFullYear()}`
  }
  if (v === 'month') return `${UK_MONTHS[d.getMonth()]} ${d.getFullYear()}`
  return String(d.getFullYear())
}

function step(v: CalView, d: Date, dir: -1 | 1): Date {
  const r = new Date(d)
  if (v === 'day')   r.setDate(r.getDate() + dir)
  if (v === 'week')  r.setDate(r.getDate() + dir * 7)
  if (v === 'month') r.setMonth(r.getMonth() + dir)
  if (v === 'year')  r.setFullYear(r.getFullYear() + dir)
  return r
}

/* ─────────────────── shared styles ─────────────────── */
const glass: CSSProperties = {
  background: 'rgba(255,255,255,0.07)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.12)',
}
const navBtn: CSSProperties = {
  width: 36, height: 36, borderRadius: 10,
  background: 'rgba(255,255,255,0.08)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.13)',
  color: 'var(--fg)', fontSize: 22, fontWeight: 300,
  cursor: 'pointer', display: 'flex', alignItems: 'center',
  justifyContent: 'center', flexShrink: 0,
}

/* ─────────────────── tiny components ─────────────────── */

function TaskPill({ task, compact }: { task: Task; compact?: boolean }) {
  const color  = task.lifeArea ? AREA_CONFIG[task.lifeArea].color : '#a78bfa'
  const top    = minsToY(timeMins(task.scheduledTime!))
  const height = Math.max(compact ? 16 : 30, (task.duration / 60) * HOUR_H - 2)

  return (
    <div style={{
      position: 'absolute', top: top + 1, left: 2, right: 2, height,
      borderRadius: compact ? 4 : 9,
      background: `${color}22`,
      border: `1.5px solid ${color}55`,
      padding: compact ? '1px 2px' : '3px 6px',
      overflow: 'hidden', zIndex: 2,
    }}>
      {!compact && (
        <span style={{ fontSize: 10, fontWeight: 700, color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
          {task.scheduledTime} {task.title}
        </span>
      )}
      {compact && (
        <div style={{ width: '100%', height: '100%', background: `${color}55`, borderRadius: 2 }} />
      )}
    </div>
  )
}

function NowLine({ fullWidth }: { fullWidth?: boolean }) {
  const now = new Date()
  if (now.getHours() < START_H || now.getHours() >= END_H) return null
  const top = minsToY(now.getHours() * 60 + now.getMinutes())
  return (
    <div style={{ position: 'absolute', top, left: fullWidth ? 0 : -2, right: 0, height: 2, background: '#ff4757', zIndex: 10, boxShadow: '0 0 8px rgba(255,71,87,0.85)' }}>
      <div style={{ position: 'absolute', left: fullWidth ? -2 : 0, top: -4, width: 10, height: 10, borderRadius: '50%', background: '#ff4757', boxShadow: '0 0 6px rgba(255,71,87,0.9)' }} />
    </div>
  )
}

/* hours sidebar */
function HourCol() {
  return (
    <>
      {Array.from({ length: END_H - START_H + 1 }, (_, i) => START_H + i).map(h => (
        <div key={h} style={{ position: 'absolute', top: (h - START_H) * HOUR_H, left: 0, width: 38, paddingLeft: 6, paddingTop: 5 }}>
          <span style={{ fontSize: 10, color: 'var(--fg-dim)', fontWeight: 600 }}>
            {String(h).padStart(2, '0')}
          </span>
        </div>
      ))}
    </>
  )
}

function HourLines({ offsetLeft = 38 }: { offsetLeft?: number }) {
  return (
    <>
      {Array.from({ length: END_H - START_H + 1 }, (_, i) => START_H + i).map(h => (
        <div key={h} style={{ position: 'absolute', top: (h - START_H) * HOUR_H, left: offsetLeft, right: 0, height: 1, background: 'rgba(255,255,255,0.07)' }} />
      ))}
    </>
  )
}

/* ═══════════════════════════════════════════════
   DAY VIEW
═══════════════════════════════════════════════ */
function DayView({ date, tasks, todayTasks, scheduleTask, replaceToday }: {
  date: Date
  tasks: Task[]
  todayTasks: Task[]
  scheduleTask: (id: string, time: string, date: string) => void
  replaceToday: (t: Task[]) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [optimizing, setOptimizing] = useState(false)
  const dateStr   = toStr(date)
  const isToday   = isSameDay(date, nowDate())
  const scheduled = tasks.filter(t => t.scheduledTime)
  const unscheduled = isToday ? todayTasks.filter(t => !t.scheduledTime) : []

  useEffect(() => {
    if (scrollRef.current) {
      const h = new Date().getHours()
      scrollRef.current.scrollTop = Math.max(0, (h - START_H) * HOUR_H - 100)
    }
  }, [])

  const handleOptimize = async () => {
    if (!unscheduled.length) return
    setOptimizing(true)
    try {
      const results = await optimizeSchedule(unscheduled)
      const todayStr = toStr(nowDate())
      replaceToday(todayTasks.map(t => {
        const r = results.find(x => x.id === t.id)
        return r ? { ...t, scheduledTime: r.scheduledTime, scheduledDate: todayStr } : t
      }))
    } catch (e) { console.error(e) }
    finally { setOptimizing(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minHeight: 0 }}>
      {/* AI optimize — only for today */}
      {isToday && (
        <button
          onClick={handleOptimize}
          disabled={optimizing || !unscheduled.length}
          style={{
            alignSelf: 'flex-start', padding: '7px 14px', borderRadius: 12, fontSize: 12, fontWeight: 700,
            cursor: optimizing || !unscheduled.length ? 'not-allowed' : 'pointer',
            background: !unscheduled.length
              ? 'rgba(255,255,255,0.06)'
              : 'linear-gradient(135deg,rgba(139,92,246,0.75) 0%,rgba(99,102,241,0.75) 100%)',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            border: !unscheduled.length ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(139,92,246,0.50)',
            color: !unscheduled.length ? 'var(--fg-dim)' : '#fff',
            boxShadow: !unscheduled.length ? 'none' : 'inset 0 1px 0 rgba(255,255,255,0.25), 0 4px 14px rgba(139,92,246,0.35)',
          }}
        >
          {optimizing ? '⏳ Оптимізую…' : '✨ AI оптимізувати'}
        </button>
      )}

      {/* Time grid */}
      <div ref={scrollRef} style={{ ...glass, borderRadius: 20, overflowY: 'auto', maxHeight: 'calc(100dvh - 295px)', flex: 1 }}>
        <div style={{ position: 'relative', height: GRID_H }}>
          <HourCol />
          <HourLines />
          {isToday && <NowLine />}
          {/* task blocks container */}
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: 38, right: 0 }}>
            {scheduled.map(t => <TaskPill key={t.id} task={t} />)}
          </div>
        </div>
      </div>

      {/* Unscheduled list */}
      {unscheduled.length > 0 && (
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--fg-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Без часу ({unscheduled.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {unscheduled.map(t => {
              const color = t.lifeArea ? AREA_CONFIG[t.lifeArea].color : '#a78bfa'
              return (
                <div key={t.id} style={{ ...glass, borderRadius: 14, padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 10, borderLeft: `3px solid ${color}` }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>{t.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--fg-dim)', marginTop: 2 }}>{t.duration} хв</div>
                  </div>
                  <input
                    type="time"
                    onChange={e => e.target.value && scheduleTask(t.id, e.target.value, dateStr)}
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 8, padding: '4px 8px', fontSize: 13, color: 'var(--fg)', cursor: 'pointer', colorScheme: 'dark' }}
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {scheduled.length === 0 && unscheduled.length === 0 && (
        <div style={{ textAlign: 'center', paddingTop: 60, color: 'var(--fg-sub)' }}>
          <div style={{ fontSize: 44 }}>📭</div>
          <p style={{ fontSize: 14, marginTop: 10 }}>Немає задач на цей день</p>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════
   WEEK VIEW
═══════════════════════════════════════════════ */
function WeekView({ weekStart, tasksForDate, onDayClick }: {
  weekStart: Date
  tasksForDate: (s: string) => Task[]
  onDayClick: (d: Date) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const today     = nowDate()
  const now       = new Date()
  const days      = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const showNow   = now.getHours() >= START_H && now.getHours() < END_H
  const nowY      = minsToY(now.getHours() * 60 + now.getMinutes())

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = Math.max(0, (now.getHours() - START_H) * HOUR_H - 100)
    }
  }, [])

  return (
    <div style={{ ...glass, borderRadius: 20, display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', maxHeight: 'calc(100dvh - 258px)' }}>
      {/* Sticky day-header row */}
      <div style={{ display: 'flex', background: 'rgba(8,4,28,0.88)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.09)', flexShrink: 0, zIndex: 20 }}>
        <div style={{ width: 38, flexShrink: 0 }} />
        {days.map((d, i) => {
          const isT = isSameDay(d, today)
          return (
            <button key={i} onClick={() => onDayClick(d)}
              style={{ flex: 1, padding: '6px 0', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'center' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: isT ? 'var(--accent)' : 'var(--fg-dim)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {UK_WD[i]}
              </div>
              <div style={{
                fontSize: 15, fontWeight: 800, lineHeight: 1,
                color: isT ? '#fff' : 'var(--fg-sub)',
                background: isT ? 'rgba(139,92,246,0.75)' : 'transparent',
                borderRadius: '50%', width: 26, height: 26, margin: '3px auto 0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: isT ? '0 0 12px rgba(139,92,246,0.6)' : 'none',
              }}>
                {d.getDate()}
              </div>
            </button>
          )
        })}
      </div>

      {/* Scrollable time grid */}
      <div ref={scrollRef} style={{ overflowY: 'auto', flex: 1 }}>
        <div style={{ display: 'flex', position: 'relative', height: GRID_H }}>
          {/* Hour labels */}
          <div style={{ width: 38, flexShrink: 0, position: 'relative' }}>
            <HourCol />
          </div>

          {/* 7 day columns */}
          {days.map((d, i) => {
            const dateStr  = toStr(d)
            const dayTasks = tasksForDate(dateStr).filter(t => t.scheduledTime)
            const isT      = isSameDay(d, today)
            return (
              <div key={i} style={{
                flex: 1, position: 'relative', minWidth: 0,
                borderLeft: '1px solid rgba(255,255,255,0.06)',
                background: isT ? 'rgba(139,92,246,0.04)' : 'transparent',
              }}>
                <HourLines offsetLeft={0} />
                {isT && showNow && (
                  <div style={{ position: 'absolute', top: nowY, left: 0, right: 0, height: 2, background: '#ff4757', zIndex: 10, boxShadow: '0 0 8px rgba(255,71,87,0.8)' }}>
                    <div style={{ position: 'absolute', left: -3, top: -4, width: 8, height: 8, borderRadius: '50%', background: '#ff4757' }} />
                  </div>
                )}
                {dayTasks.map(t => <TaskPill key={t.id} task={t} compact />)}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   MONTH VIEW
═══════════════════════════════════════════════ */
function MonthView({ date, tasksForDate, onDayClick }: {
  date: Date
  tasksForDate: (s: string) => Task[]
  onDayClick: (d: Date) => void
}) {
  const today = nowDate()
  const year  = date.getFullYear(), month = date.getMonth()

  const firstDay  = new Date(year, month, 1)
  const offset    = (firstDay.getDay() === 0 ? 7 : firstDay.getDay()) - 1
  const totalDays = new Date(year, month + 1, 0).getDate()

  const cells: { date: Date; inMonth: boolean }[] = []
  for (let i = offset - 1; i >= 0; i--)  cells.push({ date: new Date(year, month, -i),      inMonth: false })
  for (let i = 1; i <= totalDays; i++)    cells.push({ date: new Date(year, month, i),        inMonth: true  })
  const rem = cells.length % 7 === 0 ? 0 : 7 - (cells.length % 7)
  for (let i = 1; i <= rem; i++)          cells.push({ date: new Date(year, month + 1, i),    inMonth: false })

  return (
    <div style={{ flex: 1 }}>
      {/* Weekday headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 6 }}>
        {UK_WD.map((d, i) => (
          <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: i >= 5 ? 'rgba(167,139,250,0.7)' : 'var(--fg-dim)', padding: '3px 0' }}>
            {d}
          </div>
        ))}
      </div>
      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells.map(({ date: d, inMonth }, i) => {
          const dateStr  = toStr(d)
          const tasks    = tasksForDate(dateStr)
          const isT      = isSameDay(d, today)
          const isWknd   = d.getDay() === 0 || d.getDay() === 6
          return (
            <div key={i} onClick={() => inMonth && onDayClick(d)}
              style={{
                borderRadius: 11, padding: '5px 3px', minHeight: 56,
                cursor: inMonth ? 'pointer' : 'default',
                opacity: inMonth ? 1 : 0.28,
                background: isT ? 'rgba(139,92,246,0.20)' : 'rgba(255,255,255,0.04)',
                border: isT ? '1px solid rgba(139,92,246,0.55)' : '1px solid rgba(255,255,255,0.06)',
                transition: 'all 0.15s',
                boxShadow: isT ? 'inset 0 1px 0 rgba(139,92,246,0.3)' : 'none',
              }}>
              <div style={{
                textAlign: 'center', fontSize: 12,
                fontWeight: isT ? 800 : isWknd ? 600 : 400,
                color: isT ? 'var(--accent)' : isWknd ? 'rgba(255,255,255,0.75)' : 'var(--fg-sub)',
                marginBottom: 3,
              }}>
                {d.getDate()}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
                {tasks.slice(0, 3).map(t => (
                  <div key={t.id} style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: t.lifeArea ? AREA_CONFIG[t.lifeArea].color : '#a78bfa',
                    boxShadow: `0 0 4px ${t.lifeArea ? AREA_CONFIG[t.lifeArea].color : '#a78bfa'}80`,
                  }} />
                ))}
                {tasks.length > 3 && <span style={{ fontSize: 7, color: 'var(--fg-dim)', lineHeight: 1.6 }}>+{tasks.length - 3}</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   YEAR VIEW  →  12 mini-months in 2 columns
═══════════════════════════════════════════════ */
function MiniMonth({ year, month, tasksForDate, onClick }: {
  year: number; month: number
  tasksForDate: (s: string) => Task[]
  onClick: () => void
}) {
  const today = nowDate()
  const isCurrent = today.getFullYear() === year && today.getMonth() === month

  const firstDay  = new Date(year, month, 1)
  const offset    = (firstDay.getDay() === 0 ? 7 : firstDay.getDay()) - 1
  const totalDays = new Date(year, month + 1, 0).getDate()
  const prevLast  = new Date(year, month, 0).getDate()

  const cells: { day: number; inMonth: boolean; dateStr: string }[] = []
  for (let i = offset - 1; i >= 0; i--)
    cells.push({ day: prevLast - i, inMonth: false, dateStr: toStr(new Date(year, month - 1, prevLast - i)) })
  for (let i = 1; i <= totalDays; i++)
    cells.push({ day: i, inMonth: true, dateStr: toStr(new Date(year, month, i)) })
  const rem = cells.length % 7 === 0 ? 0 : 7 - (cells.length % 7)
  for (let i = 1; i <= rem; i++)
    cells.push({ day: i, inMonth: false, dateStr: toStr(new Date(year, month + 1, i)) })

  return (
    <div onClick={onClick} style={{
      background: isCurrent ? 'rgba(139,92,246,0.14)' : 'rgba(255,255,255,0.06)',
      backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      border: isCurrent ? '1px solid rgba(139,92,246,0.38)' : '1px solid rgba(255,255,255,0.10)',
      borderRadius: 16, padding: '10px 8px', cursor: 'pointer', transition: 'all 0.15s',
    }}>
      <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 800, color: isCurrent ? 'var(--accent)' : 'var(--fg)', marginBottom: 6, letterSpacing: '0.02em' }}>
        {UK_MONTHS[month]}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 2 }}>
        {['П','В','С','Ч','П','С','Н'].map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 7, color: 'var(--fg-dim)', fontWeight: 600 }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px' }}>
        {cells.map(({ day, inMonth, dateStr }, i) => {
          const dayTasks = inMonth ? tasksForDate(dateStr) : []
          const isT = dateStr === toStr(today)
          return (
            <div key={i} style={{
              textAlign: 'center', fontSize: 8.5, padding: '2px 0', borderRadius: 4,
              position: 'relative', opacity: inMonth ? 1 : 0.22,
              background: isT ? 'rgba(139,92,246,0.70)' : 'transparent',
              color: isT ? '#fff' : 'var(--fg-sub)', fontWeight: isT ? 800 : 400,
            }}>
              {day}
              {dayTasks.length > 0 && (
                <div style={{
                  position: 'absolute', bottom: 1, left: '50%', transform: 'translateX(-50%)',
                  width: 3, height: 3, borderRadius: '50%',
                  background: dayTasks[0].lifeArea ? AREA_CONFIG[dayTasks[0].lifeArea].color : '#a78bfa',
                }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function YearView({ year, tasksForDate, onMonthClick }: {
  year: number
  tasksForDate: (s: string) => Task[]
  onMonthClick: (d: Date) => void
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, overflow: 'auto', flex: 1, maxHeight: 'calc(100dvh - 258px)' }}>
      {Array.from({ length: 12 }, (_, m) => (
        <MiniMonth key={m} year={year} month={m} tasksForDate={tasksForDate} onClick={() => onMonthClick(new Date(year, m, 1))} />
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════ */
export default function CalendarPage() {
  const allTasks     = usePlannerStore(s => [...s.today, ...s.history, ...s.inbox])
  const todayTasks   = usePlannerStore(s => s.today)
  const scheduleTask = usePlannerStore(s => s.scheduleTask)
  const replaceToday = usePlannerStore(s => s.replaceToday)

  const [view, setView] = useState<CalView>('week')
  const [date, setDate] = useState<Date>(nowDate())

  const tasksForDate = useCallback((dateStr: string) =>
    allTasks.filter(t => t.scheduledDate === dateStr),
    [allTasks]
  )

  const goToDay   = (d: Date) => { setDate(d); setView('day')   }
  const goToMonth = (d: Date) => { setDate(d); setView('month') }

  const isAtToday = isSameDay(date, nowDate())

  const VIEW_LABELS: Record<CalView, string> = { day: 'День', week: 'Тиждень', month: 'Місяць', year: 'Рік' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>

      {/* ── Segmented view selector ── */}
      <div style={{
        display: 'flex', gap: 2, padding: 3, borderRadius: 16,
        background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.12)',
        flexShrink: 0,
      }}>
        {(['day', 'week', 'month', 'year'] as CalView[]).map(v => (
          <button key={v} onClick={() => setView(v)} style={{
            flex: 1, padding: '7px 2px', borderRadius: 12, border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: 700, transition: 'all 0.2s',
            background: view === v
              ? 'linear-gradient(135deg,rgba(139,92,246,0.80) 0%,rgba(99,102,241,0.80) 100%)'
              : 'transparent',
            color: view === v ? '#fff' : 'var(--fg-sub)',
            boxShadow: view === v
              ? 'inset 0 1px 0 rgba(255,255,255,0.28), 0 2px 10px rgba(139,92,246,0.30)'
              : 'none',
          }}>
            {VIEW_LABELS[v]}
          </button>
        ))}
      </div>

      {/* ── Navigation bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <button onClick={() => setDate(step(view, date, -1))} style={navBtn}>‹</button>

        <div style={{ flex: 1, textAlign: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--fg)', textTransform: 'capitalize', lineHeight: 1.3 }}>
            {periodLabel(view, date)}
          </span>
        </div>

        <button onClick={() => setDate(step(view, date, 1))} style={navBtn}>›</button>

        {!isAtToday && (
          <button onClick={() => setDate(nowDate())} style={{
            padding: '5px 10px', borderRadius: 10,
            border: '1px solid rgba(139,92,246,0.42)',
            background: 'rgba(139,92,246,0.13)',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            color: 'var(--accent)', fontSize: 11, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap',
          }}>
            Сьогодні
          </button>
        )}
      </div>

      {/* ── View panels ── */}
      {view === 'day' && (
        <DayView
          date={date}
          tasks={tasksForDate(toStr(date))}
          todayTasks={todayTasks}
          scheduleTask={scheduleTask}
          replaceToday={replaceToday}
        />
      )}
      {view === 'week' && (
        <WeekView
          weekStart={startOfWeek(date)}
          tasksForDate={tasksForDate}
          onDayClick={goToDay}
        />
      )}
      {view === 'month' && (
        <MonthView
          date={date}
          tasksForDate={tasksForDate}
          onDayClick={goToDay}
        />
      )}
      {view === 'year' && (
        <YearView
          year={date.getFullYear()}
          tasksForDate={tasksForDate}
          onMonthClick={goToMonth}
        />
      )}
    </div>
  )
}
