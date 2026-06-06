'use client'

import { useEffect, useRef, useState } from 'react'

interface MicButtonProps {
  onTranscript: (text: string) => void
  /** Fires when recognition ends (user stops OR silence timeout) */
  onVoiceEnd?: () => void
}

/* ── Web Speech API types ── */
interface ISpeechRecognition extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  onresult: ((event: ISpeechRecognitionEvent) => void) | null
  onend: (() => void) | null
  onerror: ((event: { error: string }) => void) | null
}
interface ISpeechRecognitionEvent {
  results: ISpeechRecognitionResultList
}
interface ISpeechRecognitionResultList {
  length: number
  [index: number]: { [index: number]: { transcript: string } }
}
type SpeechRecognitionConstructor = new () => ISpeechRecognition

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

/* ── Silence timeout in ms ── */
const SILENCE_MS = 3000

type MicState = 'idle' | 'listening' | 'countdown'

export default function MicButton({ onTranscript, onVoiceEnd }: MicButtonProps) {
  const [supported, setSupported] = useState(false)
  const [micState, setMicState] = useState<MicState>('idle')
  const [countdown, setCountdown] = useState(3)

  const recognitionRef  = useRef<ISpeechRecognition | null>(null)
  const intervalRef     = useRef<ReturnType<typeof setInterval> | null>(null)
  const onTranscriptRef = useRef(onTranscript)
  const onVoiceEndRef   = useRef(onVoiceEnd)

  useEffect(() => { onTranscriptRef.current = onTranscript }, [onTranscript])
  useEffect(() => { onVoiceEndRef.current   = onVoiceEnd   }, [onVoiceEnd])

  useEffect(() => {
    const API = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!API) return
    setSupported(true)

    const recognition = new API()
    recognition.lang           = 'uk-UA'
    recognition.continuous     = true
    recognition.interimResults = false

    /* ── helpers (closed over `recognition`) ── */
    const clearCountdown = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    const startCountdown = () => {
      clearCountdown()
      let remaining = Math.round(SILENCE_MS / 1000)
      setCountdown(remaining)
      setMicState('countdown')

      intervalRef.current = setInterval(() => {
        remaining -= 1
        setCountdown(remaining)
        if (remaining <= 0) {
          clearCountdown()
          recognition.stop() // → onend → onVoiceEnd → processText
        }
      }, 1000)
    }

    /* ── event handlers ── */
    recognition.onresult = (event: ISpeechRecognitionEvent) => {
      // Got speech — reset the silence countdown
      clearCountdown()
      setMicState('listening')

      const transcript = Array.from({ length: event.results.length })
        .map((_, i) => event.results[i][0].transcript)
        .join(' ')
      onTranscriptRef.current(transcript)

      // Begin 3-second silence window
      startCountdown()
    }

    recognition.onend = () => {
      clearCountdown()
      setMicState('idle')
      onVoiceEndRef.current?.()
    }

    recognition.onerror = () => {
      clearCountdown()
      setMicState('idle')
    }

    recognitionRef.current = recognition

    return () => {
      clearCountdown()
      recognition.onend   = null
      recognition.onerror = null
      try { recognition.stop() } catch { /* already stopped */ }
    }
  }, []) // runs once; callbacks accessed via refs

  if (!supported) return null

  const active = micState !== 'idle'

  const toggle = () => {
    if (!recognitionRef.current) return
    if (active) {
      // Manual stop — clear countdown, stop; onend will fire & call onVoiceEnd
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      recognitionRef.current.stop()
    } else {
      recognitionRef.current.start()
      setMicState('listening')
      setCountdown(3)
    }
  }

  /* ── visuals ── */
  const isListening  = micState === 'listening'
  const isCountdown  = micState === 'countdown'

  // Button colours
  const buttonStyle = active
    ? isCountdown
      ? {
          background: 'linear-gradient(135deg, rgba(20,184,166,0.85) 0%, rgba(5,150,105,0.85) 100%)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.32), 0 4px 24px rgba(20,184,166,0.55)',
          outline: '2px solid rgba(20,184,166,0.50)',
          outlineOffset: '3px',
        }
      : {
          background: 'linear-gradient(135deg, rgba(139,92,246,0.88) 0%, rgba(79,70,229,0.88) 100%)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.32), 0 4px 24px rgba(139,92,246,0.55)',
          outline: '2px solid rgba(139,92,246,0.50)',
          outlineOffset: '3px',
        }
    : {
        background: 'linear-gradient(145deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.07) 100%)',
        backdropFilter: 'blur(24px) saturate(200%)',
        WebkitBackdropFilter: 'blur(24px) saturate(200%)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.45), 0 4px 20px rgba(0,0,0,0.22)',
        outline: '1px solid rgba(255,255,255,0.22)',
        outlineOffset: '0px',
      }

  const labelText = isCountdown
    ? `Оброблю за ${countdown}с…`
    : isListening
    ? 'Слухаю…'
    : 'Голос'

  const labelColor = isCountdown
    ? 'rgba(20,184,166,0.95)'
    : isListening
    ? 'var(--accent)'
    : 'var(--fg-dim)'

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={toggle}
        className="relative flex items-center justify-center rounded-full transition-all duration-200 active:scale-90"
        style={{ width: '68px', height: '68px', border: 'none', cursor: 'pointer', ...buttonStyle }}
        aria-label={active ? 'Зупинити запис' : 'Почати запис'}
      >
        {/* Pulse ring — only while actively listening */}
        {isListening && <span className="mic-pulse" aria-hidden />}

        {/* Inner content */}
        {isCountdown ? (
          <span
            style={{
              fontSize: '28px',
              fontWeight: 800,
              fontVariantNumeric: 'tabular-nums',
              color: '#fff',
              lineHeight: 1,
            }}
          >
            {countdown}
          </span>
        ) : (
          <span style={{ fontSize: '28px' }}>🎤</span>
        )}
      </button>

      <span
        className="text-xs font-medium transition-all duration-200"
        style={{ color: labelColor }}
      >
        {labelText}
      </span>
    </div>
  )
}
