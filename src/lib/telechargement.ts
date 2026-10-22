'use client'

import { flushSync } from 'react-dom'
import { create } from 'zustand'
import { lireAcces, oublierAcces, paiementRequis } from '@/lib/paiement'
import { downloadPrintableHtml, printDocument, type PrintTarget } from '@/lib/print'
import { useCvStore } from '@/lib/store'
import { fullName } from '@/lib/utils'

/**
 * Séance de téléchargement : un paiement, un PDF.
 *
 * Au premier essai, le téléchargement payé est retiré du navigateur et ne vit
 * plus qu'en mémoire, le temps de la séance. Le client peut réessayer autant
 * qu'il le faut si l'enregistrement a échoué (impression annulée, fenêtre
 * bloquée), mais dès qu'il confirme, ou recharge la page, le droit est
 * consommé. La séance se termine toujours par un retour à l'accueil.
 *
 * Tant qu'aucune séance payée n'est ouverte, la copie imprimable du CV reste
 * verrouillée : un Ctrl+P depuis l'éditeur ne contourne pas le paiement.
 */

/** Ce que le client a demandé : la fenêtre d'impression, le fichier, ou l'aperçu en grand. */
export type Moyen = 'impression' | 'fichier' | 'grand'

export interface Seance {
  cible: PrintTarget
  /** Le CV fait partie de la séance et a été payé. */
  payee: boolean
  /** Jeton du téléchargement payé, gardé pour un éventuel envoi par e-mail. */
  jeton?: string
  /** Nombre d'essais déjà faits ; la question de fin ne s'affiche qu'après le premier. */
  essais: number
  /** La fenêtre d'impression n'a pas pu s'ouvrir au dernier essai. */
  bloque: boolean
  /** Le document est affiché en grand, pour un Ctrl+P à la main. */
  enGrand: boolean
}

export const useTelechargement = create<{ seance: Seance | null }>(() => ({ seance: null }))

const contientCv = (cible: PrintTarget) => cible !== 'lettre'

/**
 * Ouvre la séance ou l'élargit. Renvoie `false` quand le CV est demandé sans
 * téléchargement payé disponible.
 */
export function ouvrirSeance(cible: PrintTarget) {
  const actuelle = useTelechargement.getState().seance
  const aPayer = contientCv(cible) && paiementRequis()
  let jeton = actuelle?.jeton

  if (aPayer && !actuelle?.payee) {
    const acces = lireAcces()
    if (!acces) return false
    jeton = acces.token
    oublierAcces()
  }

  useTelechargement.setState({
    seance: {
      cible,
      payee: Boolean(actuelle?.payee) || aPayer,
      jeton,
      essais: actuelle?.essais ?? 0,
      bloque: false,
      enGrand: false,
    },
  })
  return true
}

/** Ouvre la séance et rend aussitôt la copie imprimable du CV déverrouillée. */
export function ouvrirSeanceMaintenant(cible: PrintTarget) {
  let ouverte = false
  flushSync(() => {
    ouverte = ouvrirSeance(cible)
  })
  return ouverte
}

function nomFichier(cible: PrintTarget) {
  const { firstName, lastName } = useCvStore.getState().data.profile
  return `idjo-${cible}-${fullName(firstName, lastName) || 'document'}.html`
}

/**
 * Remet le document au client par le moyen choisi. À appeler depuis un clic :
 * certains navigateurs n'ouvrent la fenêtre d'impression qu'en réponse à un
 * geste de l'utilisateur. Le rendu est forcé avant l'impression, pour que la
 * copie imprimable du CV soit déjà déverrouillée.
 */
export function lancerTelechargement(cible: PrintTarget, moyen: Moyen = 'impression') {
  if (!ouvrirSeanceMaintenant(cible)) return false

  let bloque = false
  if (moyen === 'impression') bloque = printDocument(cible) === 'bloque'
  if (moyen === 'fichier') downloadPrintableHtml(cible, nomFichier(cible))

  useTelechargement.setState(({ seance }) => ({
    seance: seance && { ...seance, essais: seance.essais + 1, bloque, enGrand: moyen === 'grand' },
  }))
  return true
}

/** Ferme l'affichage en grand ; la séance, elle, continue. */
export function fermerEnGrand() {
  useTelechargement.setState(({ seance }) => ({ seance: seance && { ...seance, enGrand: false } }))
}

/** Fin de la séance : le droit est consommé, retour à l'accueil. */
export function terminerSeance() {
  window.location.assign('/')
}
