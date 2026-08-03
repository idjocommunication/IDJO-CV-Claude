import type { CSSProperties, ReactNode } from 'react'
import { initials as getInitials, toBullets } from '@/lib/utils'

/* Toutes les valeurs des modèles sont exprimées en pixels sur une feuille A4
   de 794 px de large (210 mm @ 96 dpi), puis mises à l'échelle par fontScale. */

export interface TemplateProps {
  data: import('@/lib/types').CvData
}

export function Photo({
  src,
  firstName,
  lastName,
  size,
  radius = '50%',
  accent,
  tone,
  style,
}: {
  src?: string
  firstName: string
  lastName: string
  size: number
  radius?: number | string
  accent?: string
  /** Fond du cartouche d'initiales, teinté par la palette du document. */
  tone?: string
  style?: CSSProperties
}) {
  const common: CSSProperties = {
    width: size,
    height: size,
    borderRadius: radius,
    overflow: 'hidden',
    flexShrink: 0,
    ...style,
  }

  if (src) {
    // Photo fournie par l'utilisateur (souvent une data URL) rendue dans une
    // feuille mise à l'échelle : next/image n'apporte rien ici.
    return (
      <div style={common}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          draggable={false}
        />
      </div>
    )
  }

  return (
    <div
      style={{
        ...common,
        background: tone ?? '#E8E8E8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: accent ?? '#8A8A8A',
        fontWeight: 700,
        fontSize: size * 0.3,
        letterSpacing: '0.04em',
      }}
    >
      {getInitials(firstName, lastName) || '—'}
    </div>
  )
}

export function Bar({
  value,
  accent,
  height = 5,
  track = '#DCDCDC',
  radius = 999,
}: {
  value: number
  accent: string
  height?: number
  track?: string
  radius?: number
}) {
  return (
    <div style={{ width: '100%', height, background: track, borderRadius: radius }}>
      <div
        style={{
          width: `${Math.max(0, Math.min(100, value))}%`,
          height: '100%',
          background: accent,
          borderRadius: radius,
        }}
      />
    </div>
  )
}

export function Dots({
  value,
  accent,
  count = 4,
  size = 11,
  gap = 6,
}: {
  value: number
  accent: string
  count?: number
  size?: number
  gap?: number
}) {
  const filled = Math.round((value / 100) * count)
  return (
    <div style={{ display: 'flex', gap }}>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            background: i < filled ? accent : '#E0E0E0',
            display: 'inline-block',
          }}
        />
      ))}
    </div>
  )
}

export function Ring({
  value,
  label,
  accent,
  size = 62,
  stroke = 5,
}: {
  value: number
  label: ReactNode
  accent: string
  size?: number
  stroke?: number
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#E2E2E2"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={accent}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${(c * Math.min(100, Math.max(0, value))) / 100} ${c}`}
          />
        </svg>
        <span
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: size * 0.24,
            fontWeight: 700,
          }}
        >
          {Math.round(value)}%
        </span>
      </div>
      <span style={{ fontSize: 9, lineHeight: 1.25, textAlign: 'center', color: '#4A4A4A' }}>
        {label}
      </span>
    </div>
  )
}

/** Rend une description multi-lignes en paragraphe ou en puces. */
export function Description({
  text,
  style,
  bulletColor,
  asBullets = false,
}: {
  text: string
  style?: CSSProperties
  bulletColor?: string
  asBullets?: boolean
}) {
  const lines = toBullets(text)
  if (!lines.length) return null

  if (!asBullets) {
    return <p style={{ margin: 0, ...style }}>{lines.join(' ')}</p>
  }

  return (
    <ul style={{ margin: 0, padding: 0, listStyle: 'none', ...style }}>
      {lines.map((line, i) => (
        <li key={i} style={{ position: 'relative', paddingLeft: 11, marginBottom: 3 }}>
          <span
            style={{
              position: 'absolute',
              left: 0,
              top: '0.55em',
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: bulletColor ?? 'currentColor',
            }}
          />
          {line}
        </li>
      ))}
    </ul>
  )
}

export const svgIcon = {
  phone: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z',
  mail: 'M4 4h16v16H4z M22 6l-10 7L2 6',
  globe: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z M2 12h20 M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z',
  pin: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
}

export function Icon({
  path,
  size = 12,
  color = 'currentColor',
  strokeWidth = 2,
}: {
  path: string
  size?: number
  color?: string
  strokeWidth?: number
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  )
}
