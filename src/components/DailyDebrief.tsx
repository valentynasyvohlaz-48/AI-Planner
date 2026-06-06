'use client'

import { useState } from 'react'
import { usePlannerStore, DebriefEntry } from '@/store/usePlannerStore'
import { generateDebriefReflection } from '@/app/actions'

interface DailyDebriefProps {
  onClose: () => void
}

type TaskStatus = 'done' | 'partial' | 'no'
type Step = 1 | 2 | 3 | 'reflection'

const BLOCKERS = [
  'Зустрічі',
  'Відволікання',
  'Низька енергія',
  'Недооцінила задачу',
  'Перемикання контексту',
  'Особисте',
  'Інше',
]

export default function DailyDebrief({ onClose }: DailyDebriefProps) {
  const today = usePlannerStore((s) => s.today)
  const addDebrief = usePlannerStore((s) => s.addDebrief)
  const archiveToday = usePlannerStore((s) => s.archiveToday)

  const [step, setStep] = useState<Step>(1)
  const [taskStatus, setTaskStatus] = useState<Record<string, TaskStatus>>(() => {
    const init: Record<string, TaskStatus> = {}
    today.forEach((t) => { init[t.id] = t.done ? 'done' : 'no' })
    return init
  })
  const [selectedBlockers, setSelectedBlockers] = useState<string[]>([])
  const [longerTaskIds, setLongerTaskIds] = useState<string[]>([])
  const [reflection, setReflection] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const toggleBlocker = (b: string) => {
    setSelectedBlockers((prev) =>
      prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]
    )
  }

  const toggleLonger = (id: string) => {
    setLongerTaskIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleNextFromStep1 = () => setStep(2)
  const handleNextFromStep2 = () => setStep(3)

  const handleGenerateReflection = async () => {
    setStep('reflection')
    setLoading(true)
    setError('')
    try {
      const completedTasks = today
        .filter((t) => taskStatus[t.id] === 'done')
        .map((t) => t.title)
      const partialTasks = today
        .filter((t) => taskStatus[t.id] === 'partial')
        .map((t) => t.title)
      const notStartedTasks = today
        .filter((t) => taskStatus[t.id] === 'no')
        .map((t) => t.title)
      const longerTaskTitles = today
        .filter((t) => longerTaskIds.includes(t.id))
        .map((t) => t.title)

      const text = await generateDebriefReflection({
        date: new Date().toLocaleDateString('uk-UA'),
        completedTasks,
        partialTasks,
        notStartedTasks,
        blockers: selectedBlockers,
        longerTasks: longerTaskTitles,
      })
      setReflection(text)
    } catch {
      setError('Помилка генерації. Спробуй ще раз.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = () => {
    const today_ = new Date().toISOString().slice(0, 10)
    const entry: DebriefEntry = {
      id: crypto.randomUUID(),
      date: today_,
      completedTaskIds: today.filter((t) => taskStatus[t.id] === 'done').map((t) => t.id),
      partialTaskIds: today.filter((t) => taskStatus[t.id] === 'partial').map((t) => t.id),
      blockers: selectedBlockers,
      longerTaskIds,
      aiReflection: reflection,
      createdAt: Date.now(),
    }
    addDebrief(entry)
    archiveToday()
    onClose()
  }

  const statusBtn = (id: string, status: TaskStatus, label: string) => {
    const active = taskStatus[id] === status
    return (
      <button
        onClick={() => setTaskStatus((prev) => ({ ...prev, [id]: status }))}
        style={{
          padding: '4px 10px',
          borderRadius: '9999px',
          fontSize: '12px',
          fontWeight: 600,
          border: `1px solid ${active ? 'rgba(139,92,246,0.7)' : 'rgba(255,255,255,0.18)'}`,
          background: active
            ? 'linear-gradient(135deg, rgba(139,92,246,0.68) 0%, rgba(99,102,241,0.68) 100%)'
            : 'rgba(255,255,255,0.07)',
          color: active ? '#fff' : 'var(--fg-sub)',
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
      >
        {label}
      </button>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(7,4,26,0.82)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        className="glass"
        style={{
          width: '100%',
          maxWidth: 480,
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: '28px 28px 0 0',
          padding: '24px 20px 40px',
          animation: 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          position: 'relative',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: 'var(--fg-sub)',
            cursor: 'pointer',
            fontSize: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ✕
        </button>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: 'var(--fg-dim)', marginBottom: 4 }}>
            {step === 1 ? 'Крок 1 / 3' : step === 2 ? 'Крок 2 / 3' : step === 3 ? 'Крок 3 / 3' : '✨ Рефлексія'}
          </div>
          <h2 style={{ color: 'var(--fg)', fontSize: 22, fontWeight: 700, margin: 0 }}>
            {step === 1 && 'Що виконала сьогодні?'}
            {step === 2 && 'Що заважало?'}
            {step === 3 && 'Що зайняло більше часу?'}
            {step === 'reflection' && 'Підсумок дня'}
          </h2>
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {today.map((task) => (
              <div
                key={task.id}
                className="glass-sm"
                style={{ borderRadius: 16, padding: '10px 12px' }}
              >
                <p style={{ color: 'var(--fg)', fontSize: 14, margin: '0 0 8px', fontWeight: 500 }}>
                  {task.title}
                </p>
                <div style={{ display: 'flex', gap: 6 }}>
                  {statusBtn(task.id, 'done', '✓ Виконала')}
                  {statusBtn(task.id, 'partial', '½ Частково')}
                  {statusBtn(task.id, 'no', '— Ні')}
                </div>
              </div>
            ))}
            <button
              onClick={handleNextFromStep1}
              className="glass-accent"
              style={{
                marginTop: 8,
                padding: '14px',
                borderRadius: 18,
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                minHeight: 52,
              }}
            >
              Далі →
            </button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {BLOCKERS.map((b) => {
                const active = selectedBlockers.includes(b)
                return (
                  <button
                    key={b}
                    onClick={() => toggleBlocker(b)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 9999,
                      fontSize: 13,
                      fontWeight: 600,
                      border: `1px solid ${active ? 'rgba(139,92,246,0.7)' : 'rgba(255,255,255,0.18)'}`,
                      background: active
                        ? 'linear-gradient(135deg, rgba(139,92,246,0.68) 0%, rgba(99,102,241,0.68) 100%)'
                        : 'rgba(255,255,255,0.07)',
                      color: active ? '#fff' : 'var(--fg-sub)',
                      cursor: 'pointer',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    {b}
                  </button>
                )
              })}
            </div>
            <button
              onClick={handleNextFromStep2}
              className="glass-accent"
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 18,
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                minHeight: 52,
              }}
            >
              Далі →
            </button>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {today.map((task) => {
              const active = longerTaskIds.includes(task.id)
              return (
                <button
                  key={task.id}
                  onClick={() => toggleLonger(task.id)}
                  className="glass-sm"
                  style={{
                    borderRadius: 16,
                    padding: '12px 14px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    border: `1px solid ${active ? 'rgba(139,92,246,0.6)' : 'rgba(255,255,255,0.14)'}`,
                    background: active
                      ? 'rgba(139,92,246,0.15)'
                      : 'rgba(255,255,255,0.06)',
                    color: 'var(--fg)',
                    fontSize: 14,
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <span style={{ fontSize: 16 }}>{active ? '⏰' : '○'}</span>
                  {task.title}
                </button>
              )
            })}
            <button
              onClick={handleGenerateReflection}
              className="glass-accent"
              style={{
                marginTop: 8,
                padding: '14px',
                borderRadius: 18,
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                minHeight: 52,
              }}
            >
              ✨ Генерувати рефлексію
            </button>
          </div>
        )}

        {/* Reflection */}
        {step === 'reflection' && (
          <div>
            {loading && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: 'var(--fg-sub)',
                  fontSize: 15,
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 12 }}>✨</div>
                Генерую рефлексію...
              </div>
            )}
            {error && (
              <p style={{ color: '#ff7b7b', fontSize: 14, marginBottom: 16 }}>{error}</p>
            )}
            {!loading && reflection && (
              <div>
                <div
                  className="glass-sm"
                  style={{
                    borderRadius: 20,
                    padding: '16px 18px',
                    marginBottom: 20,
                    fontSize: 15,
                    lineHeight: 1.6,
                    color: 'var(--fg)',
                  }}
                >
                  {reflection}
                </div>
                <button
                  onClick={handleSave}
                  className="glass-accent"
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: 18,
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: 'pointer',
                    minHeight: 52,
                  }}
                >
                  Зберегти ✓
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(60px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>
    </div>
  )
}
