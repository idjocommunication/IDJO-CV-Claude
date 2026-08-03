'use client'

import { useEffect, useState } from 'react'
import { lireAcces, telechargementAutorise, type Acces } from '@/lib/paiement'

/**
 * État de l'accès au téléchargement, tenu à jour dans toute l'interface.
 *
 * `autorise` vaut `true` tant que le paiement n'est pas activé sur le site :
 * l'éditeur reste utilisable de bout en bout sans compte marchand configuré.
 * La valeur de départ est volontairement `true` pour que le rendu serveur et
 * le premier rendu client coïncident ; elle est corrigée juste après.
 */
export function useAcces() {
  const [autorise, setAutorise] = useState(true)
  const [acces, setAcces] = useState<Acces | null>(null)

  useEffect(() => {
    const relire = () => {
      setAutorise(telechargementAutorise())
      setAcces(lireAcces())
    }
    relire()
    window.addEventListener('idjo-acces', relire)
    window.addEventListener('storage', relire)
    return () => {
      window.removeEventListener('idjo-acces', relire)
      window.removeEventListener('storage', relire)
    }
  }, [])

  return { autorise, acces }
}
