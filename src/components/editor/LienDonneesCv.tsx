'use client'

import { useMemo } from 'react'
import { lienDonneesCv } from '@/lib/cv-embarque'
import type { CvData } from '@/lib/types'

/**
 * Lien invisible placé en tête de la copie d'impression du CV : il transporte
 * le document complet dans le PDF, pour une réimportation sans perte (voir
 * `cv-embarque.ts`).
 *
 * Il ne porte aucun texte — rien n'apparaît à l'impression ni dans le texte
 * extrait par un logiciel de recrutement — et sa marge négative annule sa
 * hauteur d'un pixel : la mise en page du CV n'en est pas décalée.
 */
export function LienDonneesCv({ data }: { data: CvData }) {
  const href = useMemo(() => lienDonneesCv(data), [data])

  return (
    <a
      href={href}
      aria-hidden
      tabIndex={-1}
      style={{ display: 'block', width: 1, height: 1, marginBottom: -1, overflow: 'hidden' }}
    />
  )
}
