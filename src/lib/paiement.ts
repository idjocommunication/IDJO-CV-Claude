/**
 * Accès payant au téléchargement.
 *
 * La création et l'aperçu du CV restent gratuits ; seul l'export du document
 * final est payant. Un règlement ouvre un accès daté, matérialisé par un jeton
 * signé côté serveur et conservé dans le navigateur — il n'y a toujours ni
 * compte ni base de données obligatoire.
 *
 * Ce module est isomorphe : les constantes servent au serveur comme au client.
 */

import { SANS_SERVEUR } from '@/lib/deploiement'

export type DocumentPayant = 'cv' | 'lettre' | 'tout'

/** `libre` : tout est gratuit (défaut tant qu'aucun compte marchand n'est branché). */
export type ModePaiement = 'libre' | 'bloquant'

function nombre(valeur: string | undefined, defaut: number) {
  const n = Number(valeur)
  return Number.isFinite(n) && n > 0 ? n : defaut
}

export const PAIEMENT = {
  /**
   * Le paiement ne s'active que si le marchand est configuré — et jamais en
   * export statique, faute de serveur pour vérifier la transaction.
   */
  actif: process.env.NEXT_PUBLIC_PAIEMENT_ACTIF === '1' && !SANS_SERVEUR,
  mode: (process.env.NEXT_PUBLIC_PAIEMENT_MODE as ModePaiement) || 'bloquant',
  /** Montant en francs CFA. CinetPay exige un multiple de 5 pour le XOF. */
  prix: Math.round(nombre(process.env.NEXT_PUBLIC_PAIEMENT_PRIX, 4900) / 5) * 5,
  devise: 'XOF',
  dureeJours: nombre(process.env.NEXT_PUBLIC_PAIEMENT_DUREE_JOURS, 30),
} as const

export function prixLisible() {
  return `${PAIEMENT.prix.toLocaleString('fr-FR').replace(/ | /g, ' ')} F CFA`
}

/** Moyens de paiement présentés à l'utilisateur, dans l'ordre d'usage en Côte d'Ivoire. */
export const MOYENS = [
  { id: 'WAVE', nom: 'Wave', teinte: '#1DC8F2' },
  { id: 'ORANGE_MONEY', nom: 'Orange Money', teinte: '#FF7900' },
  { id: 'MTN_MONEY', nom: 'MTN MoMo', teinte: '#FFCC00' },
  { id: 'MOOV_MONEY', nom: 'Moov Money', teinte: '#0B6FB4' },
  { id: 'CREDIT_CARD', nom: 'Carte bancaire', teinte: '#1450B4' },
] as const

/* ------------------------------------------------------------------ */
/* Accès conservé dans le navigateur                                   */
/* ------------------------------------------------------------------ */

const CLE = 'idjo-cv:acces'

export interface Acces {
  /** Jeton signé par le serveur : `reference.expiration.signature`. */
  token: string
  /** Fin de validité, en millisecondes. */
  expire: number
  reference: string
}

export function lireAcces(): Acces | null {
  if (typeof window === 'undefined') return null
  try {
    const brut = window.localStorage.getItem(CLE)
    if (!brut) return null
    const acces = JSON.parse(brut) as Acces
    if (!acces?.token || typeof acces.expire !== 'number') return null
    if (acces.expire < Date.now()) {
      window.localStorage.removeItem(CLE)
      return null
    }
    return acces
  } catch {
    return null
  }
}

export function enregistrerAcces(acces: Acces) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CLE, JSON.stringify(acces))
  window.dispatchEvent(new Event('idjo-acces'))
}

export function oublierAcces() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(CLE)
  window.dispatchEvent(new Event('idjo-acces'))
}

/** Le téléchargement est-il autorisé en l'état ? */
export function telechargementAutorise() {
  if (!PAIEMENT.actif || PAIEMENT.mode === 'libre') return true
  return lireAcces() !== null
}

/** « 12 septembre 2026 » */
export function dateLisible(millisecondes: number) {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(millisecondes),
  )
}
