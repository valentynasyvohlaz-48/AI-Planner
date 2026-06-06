'use client'

import { LifeArea, AREA_CONFIG } from '@/store/usePlannerStore'

interface Props {
  area: LifeArea | null
  small?: boolean
}

export default function LifeAreaBadge({ area, small = false }: Props) {
  if (!area) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          borderRadius: '9999px',
          padding: small ? '1px 6px' : '2px 8px',
          fontSize: small ? '10px' : '12px',
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.12)',
          color: 'var(--fg-dim)',
          fontWeight: 500,
        }}
      >
        —
      </span>
    )
  }

  const cfg = AREA_CONFIG[area]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: small ? '2px' : '4px',
        borderRadius: '9999px',
        padding: small ? '1px 6px' : '2px 8px',
        fontSize: small ? '10px' : '12px',
        background: `${cfg.color}22`,
        border: `1px solid ${cfg.color}55`,
        color: cfg.color,
        fontWeight: 500,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: small ? '9px' : '11px' }}>{cfg.emoji}</span>
      {!small && <span>{cfg.label}</span>}
    </span>
  )
}
