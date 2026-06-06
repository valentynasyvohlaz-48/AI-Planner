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
      setError('Помилка обробки. Перевір API ключ або спробуй ще раз.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <h1
        className="text-3xl font-bold"
        style={{ color: 'var(--fg)' }}
      >
        Що в голові?
      </h1>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Написати Анні, доробити презу, забукати зал, дзвінок о 15…"
        rows={8}
        className="w-full rounded-2xl p-4 resize-none outline-none transition-shadow"
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          color: 'var(--fg)',
          fontSize: '18px',
          lineHeight: '1.6',
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
        onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
      />

      {/* Mic button */}
      <div className="flex justify-center">
        <MicButton onTranscript={handleTranscript} />
      </div>

      {error && (
        <p className="text-sm text-center" style={{ color: 'var(--must)' }}>
          {error}
        </p>
      )}

      {/* Process button */}
      <button
        onClick={handleProcess}
        disabled={!text.trim() || loading}
        className="w-full py-4 rounded-2xl font-semibold text-base transition-all active:scale-[0.98]"
        style={{
          background: text.trim() && !loading ? 'var(--accent)' : 'var(--border)',
          color: text.trim() && !loading ? '#fff' : 'var(--nice)',
          cursor: text.trim() && !loading ? 'pointer' : 'not-allowed',
          minHeight: '56px',
        }}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span
              className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
            />
            AI розбирає задачі…
          </span>
        ) : (
          'Обробити →'
        )}
      </button>
    </div>
  )
}
