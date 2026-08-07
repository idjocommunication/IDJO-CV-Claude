import { PAIEMENT, forfaitParId, type DocumentPayant, type Forfait } from '@/lib/paiement'

/**
 * Encaissement par carte bancaire, via Stripe Checkout.
 *
 * Même principe que CinetPay : le règlement a lieu sur une page hébergée par
 * Stripe — aucun numéro de carte ne touche IDJÔ CV — et l'accès n'est accordé
 * qu'après avoir **interrogé Stripe** sur l'état réel de la session. Ni le
 * retour du navigateur ni un paramètre d'URL ne font foi.
 *
 * L'API est appelée en HTTP direct plutôt qu'avec le SDK : c'est ce que fait
 * déjà le module CinetPay, et cela évite une dépendance de plus pour trois
 * requêtes.
 */

/** Surchargeable pour viser un simulateur local pendant les essais. */
const API = process.env.STRIPE_BASE_URL ?? 'https://api.stripe.com/v1'

const PREFIXE = 'IDJO-STRIPE-'

/**
 * Devise présentée au client. Le franc CFA est une devise Stripe à zéro
 * décimale, mais toutes les devises ne sont pas présentables depuis tous les
 * pays de compte : `STRIPE_DEVISE` permet d'en viser une autre, et
 * `STRIPE_TAUX_CONVERSION` donne alors combien d'unités de F CFA valent une
 * unité de cette devise (655.957 pour l'euro).
 */
const DEVISE = (process.env.STRIPE_DEVISE ?? 'xof').toLowerCase()

/** Devises dont le montant s'exprime sans centimes. */
const SANS_CENTIMES = new Set([
  'bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga', 'pyg',
  'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf',
])

export function stripeConfigure() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.PAIEMENT_SECRET)
}

export function estReferenceStripe(reference: string) {
  return reference.startsWith(PREFIXE)
}

/** Convertit un prix affiché en F CFA vers l'unité attendue par Stripe. */
export function montantStripe(prixFcfa: number) {
  const taux = Number(process.env.STRIPE_TAUX_CONVERSION ?? 0)
  const converti = DEVISE === 'xof' || !(taux > 0) ? prixFcfa : prixFcfa / taux
  return SANS_CENTIMES.has(DEVISE) ? Math.round(converti) : Math.round(converti * 100)
}

async function stripe(chemin: string, corps?: Record<string, string>) {
  const reponse = await fetch(`${API}${chemin}`, {
    method: corps ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      ...(corps ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
    },
    body: corps ? new URLSearchParams(corps).toString() : undefined,
  })

  const json = (await reponse.json().catch(() => null)) as
    | Record<string, unknown>
    | { error?: { message?: string } }
    | null

  if (!reponse.ok) {
    const message = (json as { error?: { message?: string } })?.error?.message ?? ''
    throw new Error(`Stripe a refusé la requête (${reponse.status} ${message})`)
  }
  return (json ?? {}) as Record<string, unknown>
}

export interface DemandeStripe {
  forfait: Forfait
  document: DocumentPayant
  email: string
  nom?: string
}

/**
 * Ouvre une session de paiement et renvoie l'adresse où envoyer le client.
 *
 * La référence porte l'identifiant de session : c'est elle qui revient dans
 * l'URL de retour, et elle suffit à retrouver la transaction chez Stripe sans
 * rien conserver de notre côté.
 */
export async function creerSessionStripe(demande: DemandeStripe, origine: string) {
  const { forfait, document, email } = demande

  const session = await stripe('/checkout/sessions', {
    mode: 'payment',
    // Stripe remplace le gabarit par l'identifiant réel de la session.
    success_url: `${origine}/api/paiement/retour?reference=${PREFIXE}{CHECKOUT_SESSION_ID}`,
    cancel_url: `${origine}/editeur?paiement=annule`,
    customer_email: email,
    locale: 'fr',
    'line_items[0][quantity]': '1',
    'line_items[0][price_data][currency]': DEVISE,
    'line_items[0][price_data][unit_amount]': String(montantStripe(forfait.prix)),
    'line_items[0][price_data][product_data][name]': `IDJÔ CV — ${forfait.nom}`,
    'line_items[0][price_data][product_data][description]': forfait.resume,
    // Relus à la vérification : ils décident de la durée du jeton d'accès.
    'metadata[forfait]': forfait.id,
    'metadata[document]': document,
    'metadata[prix_fcfa]': String(forfait.prix),
  })

  const id = String(session.id ?? '')
  const url = String(session.url ?? '')
  if (!id || !url) throw new Error('Stripe n’a pas renvoyé de session exploitable.')

  return { url, reference: `${PREFIXE}${id}` }
}

export type EtatStripe = { etat: 'paye'; dureeJours: number } | { etat: 'en-attente' | 'refuse' }

/**
 * Interroge Stripe sur l'état réel d'une session.
 *
 * Le montant réglé est comparé au tarif du forfait annoncé : une session
 * bricolée pour payer moins n'ouvre aucun accès.
 */
export async function verifierSessionStripe(reference: string): Promise<EtatStripe> {
  const id = reference.slice(PREFIXE.length)
  if (!/^cs_[A-Za-z0-9_]+$/.test(id)) return { etat: 'refuse' }

  const session = await stripe(`/checkout/sessions/${id}`)

  const statutPaiement = String(session.payment_status ?? '')
  const statut = String(session.status ?? '')

  if (statut === 'expired') return { etat: 'refuse' }
  if (statutPaiement !== 'paid') return { etat: 'en-attente' }

  const metadata = (session.metadata ?? {}) as Record<string, string>
  const forfait = forfaitParId(metadata.forfait)
  const attendu = montantStripe(Number(metadata.prix_fcfa) || forfait.prix)
  const regle = Number(session.amount_total ?? 0)

  // Tolérance d'une unité pour absorber les arrondis de conversion.
  if (!Number.isFinite(regle) || regle + 1 < attendu) return { etat: 'refuse' }

  return { etat: 'paye', dureeJours: forfait.dureeJours || PAIEMENT.dureeJours }
}
