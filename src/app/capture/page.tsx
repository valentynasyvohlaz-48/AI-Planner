'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { parseTasksWithClaude } from '@/app/actions'
import { usePlannerStore } from '@/store/usePlannerStore'
import MicButton from '@/components/MicButton'

export default function CapturePage() {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const addToInbox = usePlannerStore((s) => s.addToInbox)
  const router = useRouter()

  const handleTranscript = useCallback((transcript: string) => {
    setText((prev) => (prev ? prev + ' ' + transcript : transcript))
  }, [])

  const handleProcess = async () => {
    if (!text.trim()) return
    setLoading(true)
    setError(null)
    try {
      const tasks = await parseTasksWithClaude(text.trim())
      addToInbox(tasks)
      setText('')
      router.push('/inbox')
    } catch (e) {
      console.error(e)
      const msg = e instanceof Error ? e.message : String(e)
      setError(`Помилка: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  const hasText = text.trim().length > 0
  const canSubmit = hasText && !loading

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1
          className="text-3xl font-bold tracking-tight"
          style={{ color: 'var(--fg)', textShadow: '0 2px 16px rgba(0,0,0,0.4)' }}
        >
          Що в голові?
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--fg-sub)' }}>
          Вилий думки — AI розбере по задачах
        </p>
      </div>

      {/* Textarea */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Написати Анні, доробити презу, забукати зал, дзвінок о 15…"
        rows={8}
        className="glass-input w-full rounded-3xl p-5 resize-none transition-all duration-200"
        style={{
          fontSize: '17px',
          lineHeight: '1.65',
        }}
      />

      {/* Mic button */}
      <div className="flex justify-center">
        <MicButton onTranscript={handleTranscript} />
      </div>

      {/* Error */}
      {error && (
        <div
          className="rounded-2xl px-4 py-3 text-sm text-center"
          style={{
            background: 'var(--must-bg)',
            border: '1px solid var(--must-border)',
            color: 'var(--must)',
          }}
        >
          {error}
        </div>
      )}

      {/* Process button */}
      <button
        onClick={handleProcess}
        disabled={!canSubmit}
        className="w-full py-4 rounded-3xl font-semibold text-base transition-all duration-200 active:scale-[0.97]"
        style={
          canSubmit
            ? {
                background: 'linear-gradient(135deg, rgba(139,92,246,0.78) 0%, rgba(99,102,241,0.78) 100%)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(139,92,246,0.52)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.32), 0 4px 24px rgba(139,92,246,0.38)',
                color: '#fff',
                cursor: 'pointer',
                minHeight: '56px',
              }
            : {
                background: 'rgba(255,255,255,0.06)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.10)',
                color: 'var(--fg-dim)',
                cursor: 'not-allowed',
                minHeight: '56px',
              }
        }
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            AI розбирає задачі…
          </span>
        ) : (
          'Обробити →'
        )}
      </button>
    </div>
  )
}
