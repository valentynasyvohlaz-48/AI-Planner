'use client'

import { useEffect, useRef, useState } from 'react'

interface MicButtonProps {
  onTranscript: (text: string) => void
  /** Fires when recognition stops (user taps to stop OR silence timeout) */
  onVoiceEnd?: () => void
}

interface ISpeechRecognition extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  onresult: ((event: ISpeechRecognitionEvent) => void) | null
  onend: (() => void) | null
}

interface ISpeechRecognitionEvent {
  results: ISpeechRecognitionResultList
}

interface ISpeechRecognitionResultList {
  length: number
  [index: number]: ISpeechRecognitionResult
}

interface ISpeechRecognitionResult {
  [index: number]: ISpeechRecognitionAlternative
}

interface ISpeechRecognitionAlternative {
  transcript: string
}

type SpeechRecognitionConstructor = new () => ISpeechRecognition

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

export default function MicButton({ onTranscript, onVoiceEnd }: MicButtonProps) {
  const [supported, setSupported] = useState(false)
  const [active, setActive] = useState(false)
  const recognitionRef = useRef<ISpeechRecognition | null>(null)
  // Keep latest callbacks in refs so recognition handlers don't go stale
  const onTranscriptRef = useRef(onTranscript)
  const onVoiceEndRef   = useRef(onVoiceEnd)
  useEffect(() => { onTranscriptRef.current = onTranscript }, [onTranscript])
  useEffect(() => { onVoiceEndRef.current   = onVoiceEnd   }, [onVoiceEnd])

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognitionAPI) return
    setSupported(true)

    const recognition = new SpeechRecognitionAPI()
    recognition.lang = 'uk-UA'
    recognition.continuous = true
    recognition.interimResults = false

    recognition.onresult = (event: ISpeechRecognitionEvent) => {
      const transcript = Array.from({ length: event.results.length })
        .map((_, i) => event.results[i][0].transcript)
        .join(' ')
      onTranscriptRef.current(transcript)
    }

    recognition.onend = () => {
      setActive(false)
      onVoiceEndRef.current?.()
    }

    recognitionRef.current = recognition
  }, []) // runs once — callbacks accessed via refs

  if (!supported) return null

  const toggle = () => {
    if (!recognitionRef.current) return
    if (active) {
      recognitionRef.current.stop() // triggers onend → onVoiceEnd
      setActive(false)
    } else {
      recognitionRef.current.start()
      setActive(true)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={toggle}
        className="relative flex items-center justify-center rounded-full transition-all duration-200 active:scale-90"
        style={{
          width: '68px',
          height: '68px',
          fontSize: '28px',
          border: 'none',
          cursor: 'pointer',
          ...(active
            ? {
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
              }),
        }}
        aria-label={active ? 'Зупинити запис' : 'Почати запис'}
      >
        {active && <span className="mic-pulse" aria-hidden />}
        🎤
      </button>
      <span
        className="text-xs font-medium transition-colors duration-150"
        style={{ color: active ? 'var(--accent)' : 'var(--fg-dim)' }}
      >
        {active ? 'Слухаю…' : 'Голос'}
      </span>
    </div>
  )
}
