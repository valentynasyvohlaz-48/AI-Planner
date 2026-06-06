'use client'

import { useEffect, useRef, useState } from 'react'

interface MicButtonProps {
  onTranscript: (text: string) => void
}

// Web Speech API types (not in TS lib by default)
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

export default function MicButton({ onTranscript }: MicButtonProps) {
  const [supported, setSupported] = useState(false)
  const [active, setActive] = useState(false)
  const recognitionRef = useRef<ISpeechRecognition | null>(null)

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognitionAPI) {
      setSupported(true)
      const recognition = new SpeechRecognitionAPI()
      recognition.lang = 'uk-UA'
      recognition.continuous = true
      recognition.interimResults = false

      recognition.onresult = (event: ISpeechRecognitionEvent) => {
        const transcript = Array.from({ length: event.results.length })
          .map((_, i) => event.results[i][0].transcript)
          .join(' ')
        onTranscript(transcript)
      }

      recognition.onend = () => setActive(false)
      recognitionRef.current = recognition
    }
  }, [onTranscript])

  if (!supported) return null

  const toggle = () => {
    if (!recognitionRef.current) return
    if (active) {
      recognitionRef.current.stop()
      setActive(false)
    } else {
      recognitionRef.current.start()
      setActive(true)
    }
  }

  return (
    <button
      onClick={toggle}
      className="relative flex items-center justify-center rounded-full transition-transform active:scale-95"
      style={{
        width: '64px',
        height: '64px',
        background: active ? 'var(--accent)' : 'var(--border)',
        color: active ? '#fff' : 'var(--fg)',
        fontSize: '28px',
        border: 'none',
        cursor: 'pointer',
      }}
      aria-label={active ? 'Зупинити запис' : 'Почати запис'}
    >
      {active && <span className="mic-pulse" aria-hidden />}
      🎤
    </button>
  )
}
