'use client'

import { LifeArea, LIFE_AREAS, AREA_CONFIG } from '@/store/usePlannerStore'

interface WheelOfLifeProps {
  scores: Record<LifeArea, number>
}

const MAX_RADIUS = 90
const LABEL_RADIUS = 110

// Angles for 6 axes (in degrees), starting at top, going clockwise
// LIFE_AREAS: career, health, learning, relationships, hobby, personal
const ANGLES = [-90, -30, 30, 90, 150, 210]

function polarToXY(angleDeg: number, radius: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180
  return { x: radius * Math.cos(rad), y: radius * Math.sin(rad) }
}

function hexagonPoints(radius: number): string {
  return ANGLES.map((a) => {
    const { x, y } = polarToXY(a, radius)
    return `${x.toFixed(2)},${y.toFixed(2)}`
  }).join(' ')
}

export default function WheelOfLife({ scores }: WheelOfLifeProps) {
  const dataPoints = LIFE_AREAS.map((area, i) => {
    const score = Math.max(0, Math.min(1, scores[area] ?? 0))
    return polarToXY(ANGLES[i], score * MAX_RADIUS)
  })

  const dataPolygon = dataPoints.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')

  const gridLevels = [0.25, 0.5, 0.75, 1.0]

  return (
    <svg
      viewBox="-165 -150 330 310"
      width="100%"
      style={{ maxWidth: 340, display: 'block', margin: '0 auto', overflow: 'visible' }}
    >
      {/* Grid hexagons */}
      {gridLevels.map((level) => (
        <polygon
          key={level}
          points={hexagonPoints(level * MAX_RADIUS)}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1"
        />
      ))}

      {/* Axis lines */}
      {ANGLES.map((angle, i) => {
        const end = polarToXY(angle, MAX_RADIUS)
        const area = LIFE_AREAS[i]
        const color = AREA_CONFIG[area].color
        return (
          <line
            key={angle}
            x1="0"
            y1="0"
            x2={end.x.toFixed(2)}
            y2={end.y.toFixed(2)}
            stroke={color}
            strokeWidth="1.5"
            strokeOpacity="0.5"
          />
        )
      })}

      {/* Data polygon */}
      <polygon
        points={dataPolygon}
        fill="rgba(167,139,250,0.22)"
        stroke="rgba(167,139,250,0.80)"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Data points */}
      {dataPoints.map((p, i) => {
        const area = LIFE_AREAS[i]
        const color = AREA_CONFIG[area].color
        return (
          <circle
            key={i}
            cx={p.x.toFixed(2)}
            cy={p.y.toFixed(2)}
            r="4"
            fill={color}
            stroke="rgba(255,255,255,0.8)"
            strokeWidth="1.5"
          />
        )
      })}

      {/* Labels */}
      {ANGLES.map((angle, i) => {
        const area = LIFE_AREAS[i]
        const cfg = AREA_CONFIG[area]
        const { x, y } = polarToXY(angle, LABEL_RADIUS)

        // Text anchor based on position
        let textAnchor: 'start' | 'middle' | 'end' = 'middle'
        if (x > 20) textAnchor = 'start'
        else if (x < -20) textAnchor = 'end'

        return (
          <g key={area}>
            <text
              x={x.toFixed(2)}
              y={(y - 6).toFixed(2)}
              textAnchor={textAnchor}
              fill={cfg.color}
              fontSize="14"
              fontWeight="600"
            >
              {cfg.emoji}
            </text>
            <text
              x={x.toFixed(2)}
              y={(y + 10).toFixed(2)}
              textAnchor={textAnchor}
              fill="rgba(255,255,255,0.80)"
              fontSize="11"
              fontWeight="600"
            >
              {cfg.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
