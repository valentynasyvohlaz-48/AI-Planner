'use client'

import { LifeArea, AREA_CONFIG, LIFE_AREAS } from '@/store/usePlannerStore'

interface Props {
  value: LifeArea | null
  onChange: (area: LifeArea) => void
  onClose: () => void
}

export default function LifeAreaPicker({ value, onChange, onClose }: Props) {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        marginTop: 8,
        padding: '10px 10px 8px',
        borderRadius: 16,
        background: 'rgba(13,10,28,0.97)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        border: '1px solid rgba(255,255,255,0.13)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)',
        position: 'relative',
        zIndex: 20,
      }}
    >
      <p
        style={{
          fontSize: 10,
          color: 'var(--fg-dim)',
          textAlign: 'center',
          fontWeight: 700,
          letterSpacing: '0.08em',
          marginBottom: 8,
          textTransform: 'uppercase',
        }}
      >
        Сфера життя
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
        {LIFE_AREAS.map((area) => {
          const cfg = AREA_CONFIG[area]
          const isSelected = value === area
          return (
            <button
              key={area}
              onClick={(e) => {
                e.stopPropagation()
                onChange(area)
                onClose()
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                padding: '10px 4px 8px',
                borderRadius: 12,
                border: isSelected
                  ? `1.5px solid ${cfg.color}`
                  : '1px solid rgba(255,255,255,0.09)',
                background: isSelected
                  ? `${cfg.color}2a`
                  : 'rgba(255,255,255,0.04)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: isSelected ? `0 0 14px ${cfg.color}38` : 'none',
                minHeight: 60,
              }}
            >
              <span style={{ fontSize: 22, lineHeight: 1 }}>{cfg.emoji}</span>
              <span
                style={{
                  fontSize: 10,
                  color: isSelected ? cfg.color : 'var(--fg-sub)',
                  fontWeight: 600,
                  lineHeight: 1.2,
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                {cfg.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
