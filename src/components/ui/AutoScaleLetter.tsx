'use client'

import { useEffect, useRef, useState } from 'react'
import { A4_HEIGHT, A4_WIDTH } from '@/cv-templates'
import { LetterSheet } from '@/cv-templates/LetterSheet'
import { SAMPLE_LETTER, type LetterData } from '@/lib/letter'
import { THEME_BY_ID } from '@/lib/theme'
import { cn } from '@/lib/utils'

/**
 * Même mécanique que `AutoScaleSheet`, appliquée à la lettre de motivation.
 * Sans `data`, la lettre d'exemple est affichée : les pages serveur ne peuvent
 * pas la construire elles-mêmes, `@/lib/letter` étant un module client.
 */
export function AutoScaleLetter({
  data,
  theme,
  className,
  rounded = 4,
  lazy = false,
}: {
  data?: LetterData
  /** Palette appliquée à la lettre d'exemple. */
  theme?: string
  className?: string
  rounded?: number
  /** Composition différée : voir `AutoScaleSheet`. */
  lazy?: boolean
}) {
  const sheet: LetterData = data ?? {
    ...SAMPLE_LETTER,
    theme: theme ?? SAMPLE_LETTER.theme,
    accent: THEME_BY_ID[theme ?? SAMPLE_LETTER.theme]?.accent ?? SAMPLE_LETTER.accent,
  }

  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)
  const [visible, setVisible] = useState(!lazy)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const update = () => setScale(node.clientWidth / A4_WIDTH)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const node = ref.current
    if (!node || visible) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '400px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [visible])

  return (
    <div
      ref={ref}
      className={cn('relative h-full w-full overflow-hidden bg-white', className)}
      style={{ borderRadius: rounded }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: A4_WIDTH,
          height: A4_HEIGHT,
          transformOrigin: 'top left',
          transform: `scale(${scale})`,
          opacity: scale ? 1 : 0,
          transition: 'opacity 200ms ease',
        }}
      >
        {visible ? <LetterSheet data={sheet} /> : null}
      </div>
    </div>
  )
}
