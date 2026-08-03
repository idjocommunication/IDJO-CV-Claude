'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Une seule copie imprimable par page.
 *
 * Les deux éditeurs rendent chacun le CV **et** la lettre. Quand ils cohabitent
 * sur une même page — c'est le cas de la démo — les documents seraient rendus
 * en double et l'impression sortirait deux fois le même CV. Le premier éditeur
 * monté prend la charge des copies ; les suivants s'abstiennent.
 */
let proprietaire: symbol | null = null

export function useProprietaireImpression() {
  const identite = useRef<symbol>(undefined as unknown as symbol)
  if (!identite.current) identite.current = Symbol('editeur')

  const [autorise, setAutorise] = useState(false)

  useEffect(() => {
    const moi = identite.current
    if (proprietaire === null) {
      proprietaire = moi
      setAutorise(true)
    }
    return () => {
      if (proprietaire === moi) {
        proprietaire = null
        setAutorise(false)
      }
    }
  }, [])

  return autorise
}
