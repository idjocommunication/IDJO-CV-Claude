import type { CSSProperties } from 'react'
import { formatFrenchDate, letterTheme, type LetterData } from '@/lib/letter'
import { resolveTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'

/**
 * Feuille A4 de lettre de motivation — même gabarit d'impression que les CV
 * (794 × 1123 px), mise en page classique attendue par les recruteurs.
 */
export function LetterSheet({
  data,
  className,
  style,
}: {
  data: LetterData
  className?: string
  style?: CSSProperties
}) {
  const fs = (n: number) => `${(n * data.fontScale).toFixed(2)}px`
  const theme = resolveTheme(letterTheme(data))
  const accent = theme.accent
  const paragraphs = [data.hook, data.proof, data.projection].filter((p) => p.trim())

  return (
    <div className={cn('cv-sheet', className)} style={style}>
      {/* Filet de couleur : la lettre reprend la palette choisie pour le CV. */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          insetBlock: 0,
          left: 0,
          width: 10,
          background: accent,
        }}
      />
      <div
        style={{
          padding: '64px 72px 64px 82px',
          fontFamily: theme.fontFamily,
          fontSize: fs(11.5),
          lineHeight: 1.75,
          color: '#1F1F1F',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 'inherit',
        }}
      >
        {/* Expéditeur */}
        <header style={{ marginBottom: 34 }}>
          <p
            style={{
              margin: 0,
              fontSize: fs(20),
              fontWeight: 800,
              letterSpacing: '-0.01em',
              color: accent,
            }}
          >
            {data.senderName || 'Votre nom'}
          </p>
          {data.senderTitle ? (
            <p
              style={{
                margin: '2px 0 0',
                fontSize: fs(11),
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#5A5A5A',
              }}
            >
              {data.senderTitle}
            </p>
          ) : null}
          <p style={{ margin: '10px 0 0', fontSize: fs(10.5), color: '#4A4A4A' }}>
            {[data.senderPhone, data.senderEmail, data.senderCity].filter(Boolean).join('  ·  ')}
          </p>
          <span
            aria-hidden
            style={{ display: 'block', height: 2, background: accent, marginTop: 16, width: 64 }}
          />
        </header>

        {/* Destinataire */}
        <div
          style={{
            marginBottom: 30,
            textAlign: 'right',
            background: theme.soft,
            padding: '14px 18px',
            borderRadius: 4,
          }}
        >
          {data.companyName ? (
            <p style={{ margin: 0, fontSize: fs(11.5), fontWeight: 700 }}>{data.companyName}</p>
          ) : null}
          {data.recipientName ? (
            <p style={{ margin: '2px 0 0', fontSize: fs(11), color: '#4A4A4A' }}>
              {data.recipientName}
            </p>
          ) : null}
          {data.companyAddress ? (
            <p style={{ margin: '2px 0 0', fontSize: fs(11), color: '#4A4A4A' }}>
              {data.companyAddress}
            </p>
          ) : null}
          <p style={{ margin: '16px 0 0', fontSize: fs(11), color: '#4A4A4A' }}>
            {[data.city, data.date || formatFrenchDate()].filter(Boolean).join(', le ')}
          </p>
        </div>

        {/* Objet */}
        {data.subject ? (
          <p style={{ margin: '0 0 6px', fontSize: fs(11.5), color: theme.deep }}>
            <strong>Objet :</strong> {data.subject}
          </p>
        ) : null}
        {data.reference ? (
          <p style={{ margin: '0 0 24px', fontSize: fs(10.5), color: '#5A5A5A' }}>
            {data.reference}
          </p>
        ) : (
          <div style={{ height: 18 }} />
        )}

        {/* Corps */}
        <p style={{ margin: '0 0 16px', fontSize: fs(11.5) }}>{data.greeting}</p>

        <div style={{ flex: 1 }}>
          {paragraphs.length ? (
            paragraphs.map((paragraph, index) => (
              <p
                key={index}
                style={{
                  margin: '0 0 14px',
                  textAlign: 'justify',
                  textIndent: 24,
                  fontSize: fs(11.5),
                }}
              >
                {paragraph}
              </p>
            ))
          ) : (
            <p style={{ margin: '0 0 14px', color: '#9A9A9A' }}>
              Vos trois paragraphes apparaîtront ici : l’accroche, la preuve, puis la projection.
            </p>
          )}

          {data.closing ? (
            <p style={{ margin: '18px 0 0', textAlign: 'justify', fontSize: fs(11.5) }}>
              {data.closing}
            </p>
          ) : null}
        </div>

        {/* Signature */}
        <footer style={{ marginTop: 34, textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: fs(11.5), fontWeight: 700, color: theme.deep }}>
            {data.senderName}
          </p>
        </footer>
      </div>
    </div>
  )
}
