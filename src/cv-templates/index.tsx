'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties, ComponentType } from 'react'
import type { CvData, TemplateId } from '@/lib/types'
import { resolveTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'
import { TemplateAbidjan } from './TemplateAbidjan'
import { TemplateBassam } from './TemplateBassam'
import { TemplateCocody } from './TemplateCocody'
import { TemplateLagune } from './TemplateLagune'
import { TemplateMarcory } from './TemplateMarcory'
import { TemplatePlateau } from './TemplatePlateau'
import { TemplateTreichville } from './TemplateTreichville'
import { TemplateYamoussoukro } from './TemplateYamoussoukro'

export const TEMPLATE_COMPONENTS: Record<TemplateId, ComponentType<{ data: CvData }>> = {
  abidjan: TemplateAbidjan,
  plateau: TemplatePlateau,
  lagune: TemplateLagune,
  cocody: TemplateCocody,
  marcory: TemplateMarcory,
  treichville: TemplateTreichville,
  bassam: TemplateBassam,
  yamoussoukro: TemplateYamoussoukro,
}

export const A4_WIDTH = 794
export const A4_HEIGHT = 1123

/** Rend la feuille A4 brute (794 × 1123 px) — non redimensionnée. */
export function CvSheet({
  data,
  className,
  style,
}: {
  data: CvData
  className?: string
  style?: CSSProperties
}) {
  const Template = TEMPLATE_COMPONENTS[data.settings.template] ?? TemplateAbidjan
  const theme = resolveTheme(data.settings)
  return (
    <div
      className={cn('cv-sheet', className)}
      style={{ fontFamily: theme.fontFamily, ...style }}
    >
      <Template data={data} />
    </div>
  )
}

/**
 * Feuille A4 mise à l'échelle pour l'écran.
 *
 * Le contenu peut dépasser une page : on mesure donc la hauteur réelle, on
 * réserve la place correspondante et on trace un repère à chaque changement de
 * page, exactement là où l'imprimante coupera. `onPagesChange` remonte le
 * nombre de pages pour que l'éditeur puisse le signaler.
 */
export function ScaledCvSheet({
  data,
  scale,
  className,
  sheetClassName,
  shadow = true,
  onPagesChange,
}: {
  data: CvData
  scale: number
  className?: string
  sheetClassName?: string
  shadow?: boolean
  onPagesChange?: (pages: number) => void
}) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(A4_HEIGHT)

  const measure = useCallback(() => {
    const node = sheetRef.current
    if (!node) return
    const measured = Math.max(node.scrollHeight, A4_HEIGHT)
    setHeight(measured)
    onPagesChange?.(measured / A4_HEIGHT)
  }, [onPagesChange])

  useEffect(() => {
    const node = sheetRef.current
    if (!node) return
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [measure, data])

  // Repères de coupure : un trait par page entamée après la première.
  const coupures = Math.max(0, Math.ceil(height / A4_HEIGHT) - 1)

  return (
    <div
      className={cn('relative', className)}
      style={{ width: A4_WIDTH * scale, height: height * scale }}
    >
      <div
        className="origin-top-left"
        style={{ transform: `scale(${scale})`, width: A4_WIDTH }}
      >
        <div ref={sheetRef} style={{ width: A4_WIDTH }}>
          <CvSheet
            data={data}
            className={cn(shadow && 'shadow-page', 'ring-1 ring-cloud-300', sheetClassName)}
          />
        </div>

        {Array.from({ length: coupures }, (_, index) => (
          <div
            key={index}
            aria-hidden
            className="pointer-events-none absolute inset-x-0"
            style={{ top: (index + 1) * A4_HEIGHT }}
          >
            <div className="border-t-2 border-dashed border-azur-500/70" />
            <span className="absolute right-2 top-1.5 rounded bg-azur-500 px-2 py-0.5 text-[13px] font-bold text-white">
              Page {index + 2}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export {
  TemplateAbidjan,
  TemplatePlateau,
  TemplateLagune,
  TemplateCocody,
  TemplateMarcory,
  TemplateTreichville,
  TemplateBassam,
  TemplateYamoussoukro,
}
