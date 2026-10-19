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
  actif:
    process.env.NEXT_PUBLIC_PAIEMENT_ACTIF === '1' &&
    (!SANS_SERVEUR || Boolean(process.env.NEXT_PUBLIC_PAIEMENT_LIEN && process.env.NEXT_PUBLIC_PAIEMENT_CODES_HASH)),
  mode: (process.env.NEXT_PUBLIC_PAIEMENT_MODE as ModePaiement) || 'bloquant',
  /** Montant en francs CFA. CinetPay exige un multiple de 5 pour le XOF. */
  prix: Math.round(nombre(process.env.NEXT_PUBLIC_PAIEMENT_PRIX, 500) / 5) * 5,
  /**
   * Lien de paiement CinetPay du marchand. S'il est renseigné, le client règle
   * sur ce lien puis saisit un code d'accès que l'équipe lui remet après
   * vérification du paiement dans le tableau de bord CinetPay.
   */
  lien: process.env.NEXT_PUBLIC_PAIEMENT_LIEN?.trim() ?? '',
  /**
   * Hébergement sans serveur : empreintes SHA-256 des codes valides, vérifiées
   * dans le navigateur. Moins sûr que la signature serveur (le code JavaScript
   * peut être contourné par un utilisateur averti), mais fonctionnel.
   */
  codesHash: (process.env.NEXT_PUBLIC_PAIEMENT_CODES_HASH ?? '')
    .toLowerCase()
    .split(',')
    .map((h) => h.trim())
    .filter(Boolean),
  devise: 'XOF',
  dureeJours: nombre(process.env.NEXT_PUBLIC_PAIEMENT_DUREE_JOURS, 2),
} as const

/** « 2 jours », « 1 jour » */
export function joursLisibles(jours: number = PAIEMENT.dureeJours) {
  return `${jours} jour${jours > 1 ? 's' : ''}`
}

export function prixLisible(montant: number = PAIEMENT.prix) {
  return `${montant.toLocaleString('fr-FR').replace(/ | /g, ' ')} F CFA`
}

/* ------------------------------------------------------------------ */
/* Forfaits                                                            */
/* ------------------------------------------------------------------ */

/** Encaisseur : Mobile Money par CinetPay, carte bancaire par Stripe. */
export type Fournisseur = 'cinetpay' | 'stripe'

export interface Forfait {
  id: string
  nom: string
  resume: string
  /** Montant en francs CFA. */
  prix: number
  /** Durée d'accès illimité ouverte par l'achat. */
  dureeJours: number
}

/**
 * Ce qu'un client peut acheter. Un forfait n'ouvre pas un document précis mais
 * une **durée** de téléchargements libres : c'est ce que le jeton d'accès sait
 * déjà porter, et cela évite d'avoir à pister quel document a été payé sur
 * quel appareil.
 *
 * Un seul tarif : celui du lien de paiement CinetPay.
 */
export const FORFAITS: Forfait[] = [
  {
    id: 'mois',
    nom: `Acc\u00e8s ${joursLisibles()}`,
    resume: 'T\u00e9l\u00e9chargements illimit\u00e9s, CV et lettre, autant de versions que voulu.',
    prix: PAIEMENT.prix,
    dureeJours: PAIEMENT.dureeJours,
  },
]

export const FORFAIT_PAR_DEFAUT = 'mois'

export function forfaitParId(id: string | undefined | null) {
  return FORFAITS.find((f) => f.id === id) ?? FORFAITS[FORFAITS.length - 1]
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

/** Forme canonique d'un code saisi : majuscules, sans tirets, sans préfixe IDJO. */
export function normaliserCode(saisie: string) {
  return saisie.toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^IDJO/, '')
}

/**
 * Vérification d'un code dans le navigateur (hébergement sans serveur).
 * Renvoie un accès local si l'empreinte du code figure dans la liste publiée.
 */
export async function verifierCodeLocal(saisie: string): Promise<Acces | null> {
  const code = normaliserCode(saisie)
  if (code.length !== 12 || !window.crypto?.subtle) return null
  const octets = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(code))
  const empreinte = Array.from(new Uint8Array(octets), (o) => o.toString(16).padStart(2, '0')).join('')
  if (!PAIEMENT.codesHash.includes(empreinte)) return null

  const expire = Date.now() + PAIEMENT.dureeJours * 24 * 60 * 60 * 1000
  const reference = `CODE-${empreinte.slice(0, 8)}`
  return { token: `LOCAL.${expire}.${empreinte.slice(0, 16)}`, expire, reference }
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
