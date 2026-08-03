'use client'

import { useEffect, useRef, useState } from 'react'
import { A4_HEIGHT, A4_WIDTH, CvSheet } from '@/cv-templates'
import type { CvData } from '@/lib/types'
import { cn } from '@/lib/utils'

/**
 * Rend une feuille A4 réelle, mise à l'échelle pour occuper exactement la
 * largeur de son conteneur (ResizeObserver). Utilisé partout où l'on affiche
 * une vignette : hero, galerie, sélecteur de modèles.
 */
export function AutoScaleSheet({
  data,
  className,
  rounded = 4,
  lazy = false,
}: {
  data: CvData
  className?: string
  rounded?: number
  /**
   * Ne compose la feuille qu'une fois la vignette approchée du champ de
   * vision. Une feuille A4 complète pèse plusieurs dizaines de kilo-octets de
   * HTML : les vignettes hors écran ne doivent pas alourdir le premier
   * chargement, en particulier sur une connexion mobile.
   */
  lazy?: boolean
}) {
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
      {/* Hors flux : la feuille ne doit pas imposer sa largeur naturelle
          (794 px) au conteneur, dont la taille est pilotée par la mise en page. */}
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
        {visible ? <CvSheet data={data} /> : null}
      </div>
    </div>
  )
}
