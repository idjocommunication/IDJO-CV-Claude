'use client'

import { lireAcces } from '@/lib/paiement'
import { PRINT_LABELS, buildStandaloneHtml, type PrintTarget } from '@/lib/print'
import { SANS_SERVEUR } from '@/lib/deploiement'
import { useTelechargement } from '@/lib/telechargement'

/**
 * Expédition du document par e-mail.
 *
 * Le navigateur fabrique la page imprimable, le serveur en fait un PDF et
 * l'envoie. Le résultat est volontairement explicite : l'interface doit
 * pouvoir dire ce qui s'est passé plutôt que d'afficher un vague échec, et
 * proposer le téléchargement direct dès que l'envoi n'est pas possible.
 */

export type ResultatEnvoi = 'envoye' | 'inactif' | 'acces-invalide' | 'echec'
/** `inactif` : rien n'est configuré sur le site. `echec` : panne passagère. */

/** Coordonnées de livraison, conservées le temps de l'aller-retour de paiement. */
export interface Livraison {
  email: string
  nom?: string
  document: PrintTarget
}

const CLE_LIVRAISON = 'idjo-cv:livraison'
const CLE_EMAIL = 'idjo-cv:email'

export function retenirLivraison(livraison: Livraison) {
  try {
    window.sessionStorage.setItem(CLE_LIVRAISON, JSON.stringify(livraison))
    window.localStorage.setItem(CLE_EMAIL, livraison.email)
  } catch {
    /* Navigation privée : on se passera du souvenir. */
  }
}

export function lireLivraison(): Livraison | null {
  try {
    const brut = window.sessionStorage.getItem(CLE_LIVRAISON)
    if (!brut) return null
    const livraison = JSON.parse(brut) as Livraison
    return livraison?.email ? livraison : null
  } catch {
    return null
  }
}

export function oublierLivraison() {
  try {
    window.sessionStorage.removeItem(CLE_LIVRAISON)
  } catch {
    /* rien à faire */
  }
}

/** Dernière adresse utilisée, pour ne pas la retaper à chaque fois. */
export function dernierEmail() {
  try {
    return window.localStorage.getItem(CLE_EMAIL) ?? ''
  } catch {
    return ''
  }
}

/** L'envoi par e-mail est-il actif sur ce site ? */
export async function envoiDisponible() {
  if (SANS_SERVEUR) return false

  try {
    const reponse = await fetch('/api/envoi-cv')
    if (!reponse.ok) return false
    const json = (await reponse.json()) as { disponible?: boolean }
    return Boolean(json.disponible)
  } catch {
    return false
  }
}

export async function envoyerParEmail({
  document: cible,
  email,
  nom,
}: {
  document: PrintTarget
  email: string
  nom?: string
}): Promise<ResultatEnvoi> {
  try {
    const html = await buildStandaloneHtml(cible, `IDJÔ CV — ${PRINT_LABELS[cible]}`)
    if (html.length < 400) return 'echec'

    const reponse = await fetch('/api/envoi-cv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        nom,
        html,
        document: cible,
        // Le téléchargement payé a déjà quitté le navigateur s'il est en cours d'usage.
        token: useTelechargement.getState().seance?.jeton ?? lireAcces()?.token,
      }),
    })

    if (reponse.ok) return 'envoye'

    const json = (await reponse.json().catch(() => null)) as { code?: string } | null
    if (json?.code === 'envoi-inactif') return 'inactif'
    if (json?.code === 'acces-invalide') return 'acces-invalide'
    return 'echec'
  } catch {
    return 'echec'
  }
}
