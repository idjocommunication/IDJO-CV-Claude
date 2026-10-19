import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import {
  PAIEMENT,
  joursLisibles,
  normaliserCode,
  type DocumentPayant,
  type Fournisseur,
} from '@/lib/paiement'
import { estReferenceStripe, stripeConfigure, verifierSessionStripe } from '@/lib/stripe-serveur'
import {
  ErreurCinetpay,
  cinetpayV1Configure,
  estCleV1,
  initierPaiementV1,
  verifierPaiementV1,
} from '@/lib/cinetpay-v1'

/**
 * Côté serveur du paiement.
 *
 * Deux responsabilités : parler à l'agrégateur mobile money, et signer les
 * accès accordés. On ne stocke rien : la référence de transaction voyage avec
 * l'utilisateur, et c'est l'agrégateur qui fait foi sur le fait qu'elle est
 * réglée. Le jeton d'accès est un HMAC, vérifiable sans base de données.
 */

const SECRET = process.env.PAIEMENT_SECRET ?? ''

/**
 * CinetPay est-il branché ? (Mobile Money et cartes en F CFA)
 *
 * Deux générations d'API coexistent chez CinetPay : la v1 (clé `sk_test_` /
 * `sk_live_` + mot de passe API) et l'ancienne (clé + `site_id`). La clé
 * fournie décide laquelle est utilisée.
 */
export function cinetpayConfigure() {
  if (!SECRET) return false
  if (estCleV1(process.env.CINETPAY_API_KEY)) return cinetpayV1Configure()
  return Boolean(process.env.CINETPAY_API_KEY && process.env.CINETPAY_SITE_ID)
}

/** Encaisseurs réellement utilisables sur ce site, dans l'ordre d'affichage. */
export function fournisseursDisponibles(): Fournisseur[] {
  const liste: Fournisseur[] = []
  if (cinetpayConfigure()) liste.push('cinetpay')
  if (stripeConfigure()) liste.push('stripe')
  return liste
}

/** Le paiement par lien + code d'accès est-il prêt ? */
export function codesConfigure() {
  return Boolean(PAIEMENT.lien && SECRET)
}

/** Au moins un moyen d'obtenir un accès est-il branché ? */
export function paiementConfigure() {
  return fournisseursDisponibles().length > 0 || codesConfigure()
}

/* ------------------------------------------------------------------ */
/* Codes d'accès (paiement par lien)                                   */
/* ------------------------------------------------------------------ */

// Sans 0/O/1/I/L : un code recopié depuis WhatsApp ne doit pas prêter à confusion.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function marque(serie: string) {
  const h = createHmac('sha256', SECRET).update(`code:${serie}`).digest()
  return Array.from(h.subarray(0, 8), (octet) => ALPHABET[octet % ALPHABET.length]).join('')
}

/** `IDJO-ABCD-EFGHJKMN` : 4 caractères de série, 8 de signature. */
export function fabriquerCode(serie: string) {
  return `IDJO-${serie}-${marque(serie)}`
}

/**
 * Vérifie un code saisi par le client. Sans base de données, un code reste
 * valable tant que sa série n'est pas listée dans PAIEMENT_CODES_REVOQUES
 * (séries séparées par des virgules).
 */
export function verifierCode(saisie: string) {
  if (!SECRET) return null
  const brut = saisie.toUpperCase().replace(/[^A-Z0-9]/g, '')
  const m = /^(?:IDJO)?([A-Z0-9]{4})([A-Z0-9]{8})$/.exec(brut)
  if (!m) return null

  const attendue = Buffer.from(marque(m[1]))
  const recue = Buffer.from(m[2])
  if (attendue.length !== recue.length || !timingSafeEqual(attendue, recue)) return null

  const revoques = (process.env.PAIEMENT_CODES_REVOQUES ?? '')
    .toUpperCase()
    .split(',')
    .map((x) => x.trim())
  if (revoques.includes(m[1])) return null

  return { serie: m[1] }
}

/**
 * Codes publiés pour l'export statique (empreintes SHA-256) : ils restent
 * valables sur le serveur, même si `PAIEMENT_SECRET` a changé entre-temps.
 */
export function verifierCodePublie(saisie: string) {
  const code = normaliserCode(saisie)
  if (code.length !== 12) return null
  const empreinte = createHash('sha256').update(code).digest('hex')
  return PAIEMENT.codesHash.includes(empreinte) ? { serie: code.slice(0, 4) } : null
}

/* ------------------------------------------------------------------ */
/* Jeton d'accès                                                       */
/* ------------------------------------------------------------------ */

function signature(charge: string) {
  return createHmac('sha256', SECRET).update(charge).digest('base64url')
}

export function signerAcces(reference: string, dureeJours = PAIEMENT.dureeJours) {
  const expire = Date.now() + dureeJours * 24 * 60 * 60 * 1000
  const charge = `${reference}.${expire}`
  return { token: `${charge}.${signature(charge)}`, expire }
}

export function verifierAcces(token: string) {
  if (!SECRET) return null
  const morceaux = token.split('.')
  if (morceaux.length !== 3) return null

  const [reference, expireBrut, recue] = morceaux
  const attendue = signature(`${reference}.${expireBrut}`)

  const a = Buffer.from(recue)
  const b = Buffer.from(attendue)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null

  const expire = Number(expireBrut)
  if (!Number.isFinite(expire) || expire < Date.now()) return null

  return { reference, expire }
}

/* ------------------------------------------------------------------ */
/* Agrégateur : CinetPay                                               */
/* ------------------------------------------------------------------ */

/** Surchargeable pour viser le bac à sable de CinetPay ou un simulateur local. */
const CINETPAY = process.env.CINETPAY_BASE_URL ?? 'https://api-checkout.cinetpay.com/v2'

export function nouvelleReference(document: DocumentPayant) {
  return `IDJO-${document.toUpperCase()}-${Date.now().toString(36)}-${randomUUID().slice(0, 8)}`
}

export interface DemandePaiement {
  reference: string
  document: DocumentPayant
  nom: string
  telephone: string
  email: string
  /** Canal imposé, ou « ALL » pour laisser le choix sur la page de paiement. */
  canal?: string
}

/**
 * Crée la transaction et renvoie l'adresse de la page de paiement CinetPay,
 * où l'utilisateur choisit Wave, Orange Money, MTN, Moov ou sa carte.
 */
export async function initierPaiement(demande: DemandePaiement, origine: string) {
  if (cinetpayV1Configure()) return initierPaiementV1(demande, origine)

  const corps = {
    apikey: process.env.CINETPAY_API_KEY,
    site_id: process.env.CINETPAY_SITE_ID,
    transaction_id: demande.reference,
    amount: PAIEMENT.prix,
    currency: PAIEMENT.devise,
    description: `IDJÔ CV — accès ${joursLisibles()} au téléchargement`,
    channels: demande.canal || 'ALL',
    lang: 'FR',
    metadata: demande.document,
    customer_id: demande.reference,
    customer_name: demande.nom.split(' ')[0] || 'Client',
    customer_surname: demande.nom.split(' ').slice(1).join(' ') || 'IDJO',
    customer_email: demande.email,
    customer_phone_number: demande.telephone,
    customer_address: 'Abidjan',
    customer_city: 'Abidjan',
    customer_country: 'CI',
    customer_state: 'CI',
    customer_zip_code: '00225',
    notify_url: `${origine}/api/paiement/notification`,
    return_url: `${origine}/api/paiement/retour?reference=${encodeURIComponent(demande.reference)}`,
  }

  const reponse = await fetch(`${CINETPAY}/payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corps),
  })

  const json = (await reponse.json().catch(() => null)) as {
    code?: string
    message?: string
    data?: { payment_url?: string; payment_token?: string }
  } | null

  const url = json?.data?.payment_url
  if (!reponse.ok || !url) {
    throw new Error(
      `CinetPay a refusé l'initialisation (${reponse.status} ${json?.code ?? ''} ${json?.message ?? ''})`,
    )
  }

  return { url, jeton: json?.data?.payment_token ?? '' }
}

export type EtatPaiement = 'paye' | 'en-attente' | 'refuse'

/**
 * État d'une transaction, quel que soit l'encaisseur.
 *
 * La référence dit à qui s'adresser : celles de Stripe portent leur préfixe,
 * les autres reviennent à CinetPay. La durée renvoyée est celle du forfait
 * réellement réglé — c'est elle qui fixe la validité du jeton d'accès.
 */
export async function verifierTransaction(
  reference: string,
): Promise<{ etat: EtatPaiement; dureeJours: number }> {
  if (estReferenceStripe(reference)) {
    const resultat = await verifierSessionStripe(reference)
    return resultat.etat === 'paye'
      ? { etat: 'paye', dureeJours: resultat.dureeJours }
      : { etat: resultat.etat, dureeJours: PAIEMENT.dureeJours }
  }

  const etat = await verifierPaiement(reference)
  return { etat, dureeJours: PAIEMENT.dureeJours }
}

/**
 * Interroge CinetPay sur l'état réel d'une transaction. C'est la seule source
 * de vérité : ni le retour du navigateur ni le corps du webhook ne suffisent.
 */
export async function verifierPaiement(reference: string): Promise<EtatPaiement> {
  if (cinetpayV1Configure()) return verifierPaiementV1(reference)

  const reponse = await fetch(`${CINETPAY}/payment/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apikey: process.env.CINETPAY_API_KEY,
      site_id: process.env.CINETPAY_SITE_ID,
      transaction_id: reference,
    }),
  })

  const json = (await reponse.json().catch(() => null)) as {
    code?: string
    data?: { status?: string; amount?: string | number }
  } | null

  const statut = json?.data?.status
  if (json?.code === '00' && statut === 'ACCEPTED') {
    // Contrôle du montant : une transaction réglée en dessous du tarif ne
    // doit pas ouvrir l'accès.
    const montant = Number(json?.data?.amount ?? 0)
    if (Number.isFinite(montant) && montant + 0.5 < PAIEMENT.prix) return 'refuse'
    return 'paye'
  }

  if (statut === 'REFUSED' || statut === 'CANCELED' || json?.code === '627') return 'refuse'
  return 'en-attente'
}

/**
 * Message de journal lisible pour l'exploitant : l'erreur la plus probable à
 * la mise en ligne est une adresse IP du serveur non déclarée chez CinetPay.
 */
export function expliquerErreurPaiement(erreur: unknown) {
  if (erreur instanceof ErreurCinetpay && erreur.ipNonAutorisee) {
    return "CinetPay refuse l'adresse IP de ce serveur : ajoutez-la à la liste blanche du tableau de bord CinetPay."
  }
  return erreur instanceof Error ? erreur.message : String(erreur)
}
