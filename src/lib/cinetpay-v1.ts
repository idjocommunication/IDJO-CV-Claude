import { request } from 'node:https'
import { PAIEMENT } from '@/lib/paiement'

/**
 * API CinetPay v1 — comptes ouverts sur la nouvelle plateforme CinetPay.
 *
 * Elle se reconnaît à sa clé : `sk_test_…` (bac à sable) ou `sk_live_…`
 * (production), toujours accompagnée d'un mot de passe API. Le serveur
 * s'identifie une fois (`POST /v1/oauth/login`), reçoit un jeton valable
 * environ 24 h, puis crée et relit les paiements avec ce jeton.
 *
 * Deux points d'attention propres à cette API :
 * - CinetPay n'accepte que les appels venant d'adresses IP déclarées dans le
 *   tableau de bord (« NOT_ALLOWED » sinon) : celle du serveur qui héberge le
 *   site doit y figurer. Les appels partent en IPv4, et l'adresse de sortie
 *   est relevée dans le journal à chaque refus ;
 * - la clé et le mot de passe ne quittent jamais le serveur. Ils ne doivent
 *   pas porter le préfixe `NEXT_PUBLIC_`, qui les livrerait au navigateur.
 *
 * Appels HTTPS directs, sans SDK : trois requêtes ne justifient pas une
 * dépendance de plus, et c'est déjà le choix des modules CinetPay et Stripe.
 */

const CLE = process.env.CINETPAY_API_KEY ?? ''
const MOT_DE_PASSE = process.env.CINETPAY_API_PASSWORD ?? ''

/** La clé désigne-t-elle l'API v1 (et non l'ancienne API à site_id) ? */
export function estCleV1(cle: string = CLE) {
  return cle.startsWith('sk_test_') || cle.startsWith('sk_live_')
}

export function cinetpayV1Configure() {
  return estCleV1() && Boolean(MOT_DE_PASSE)
}

/** Bac à sable pour `sk_test_`, production pour `sk_live_`, sauf adresse imposée. */
function base() {
  const imposee = process.env.CINETPAY_BASE_URL?.trim()
  if (imposee) return imposee.replace(/\/+$/, '')
  return CLE.startsWith('sk_live_') ? 'https://api.cinetpay.co' : 'https://api.cinetpay.net'
}

export class ErreurCinetpay extends Error {
  constructor(
    readonly code: number | undefined,
    readonly statut: string | undefined,
    description: string,
  ) {
    super(`CinetPay ${code ?? '?'} ${statut ?? ''} — ${description}`)
    this.name = 'ErreurCinetpay'
  }

  /** Adresse IPv4 publique du serveur, relevée lors d'un refus d'adresse. */
  ipSortie: string | undefined

  /** L'adresse IP du serveur n'est pas déclarée chez CinetPay. */
  get ipNonAutorisee() {
    return this.statut === 'NOT_ALLOWED' || this.code === 2011
  }
}

/** Codes qui accompagnent une réponse normale (succès ou transaction en cours). */
const CODES_NORMAUX = new Set([100, 200, 2001, 2002])

type Reponse = Record<string, unknown>

/**
 * Requête HTTPS forcée en IPv4. L'API CinetPay répond aussi en IPv6 : un
 * serveur qui dispose des deux pourrait se présenter avec une adresse IPv6
 * absente de la liste blanche, et voir tous ses paiements refusés.
 */
function requeteIpv4(
  url: string,
  methode: 'GET' | 'POST',
  entetes: Record<string, string>,
  corps: string | undefined,
  delai: number,
) {
  return new Promise<{ http: number; texte: string }>((resoudre, rejeter) => {
    const requete = request(
      url,
      {
        method: methode,
        family: 4,
        headers: corps === undefined ? entetes : { ...entetes, 'Content-Length': String(Buffer.byteLength(corps)) },
        signal: AbortSignal.timeout(delai),
      },
      (reponse) => {
        let texte = ''
        reponse.setEncoding('utf8')
        reponse.on('data', (morceau: string) => (texte += morceau))
        reponse.on('end', () => resoudre({ http: reponse.statusCode ?? 0, texte }))
        reponse.on('error', rejeter)
      },
    )
    requete.on('error', rejeter)
    requete.end(corps)
  })
}

let ipSortieConnue: string | undefined

/**
 * Adresse IPv4 par laquelle le serveur sort sur Internet : c'est elle que
 * CinetPay voit, donc elle qu'il faut déclarer. Relevée seulement après un
 * refus, pour l'écrire dans le journal.
 */
async function ipDeSortie() {
  if (ipSortieConnue) return ipSortieConnue
  try {
    const { texte } = await requeteIpv4('https://api.ipify.org?format=json', 'GET', {}, undefined, 5_000)
    const ip = (JSON.parse(texte) as { ip?: unknown }).ip
    if (typeof ip === 'string' && /^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) ipSortieConnue = ip
  } catch {
    // Service injoignable : le refus reste signalé, sans l'adresse.
  }
  return ipSortieConnue
}

async function appeler(methode: 'GET' | 'POST', chemin: string, corps?: unknown, jeton?: string) {
  const { http, texte } = await requeteIpv4(
    `${base()}${chemin}`,
    methode,
    {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}),
    },
    corps === undefined ? undefined : JSON.stringify(corps),
    15_000,
  )

  let json: Reponse = {}
  try {
    json = (JSON.parse(texte) ?? {}) as Reponse
  } catch {
    // Réponse non JSON (page d'erreur du proxy) : seul le code HTTP compte.
  }
  const code = typeof json.code === 'number' ? json.code : undefined
  const statut = typeof json.status === 'string' ? json.status : undefined
  const description = typeof json.description === 'string' ? json.description : ''

  // Même règle que le SDK officiel : une transaction échouée se lit comme
  // une réponse, seule une erreur décrite (ou un HTTP 4xx/5xx) en est une.
  const anormal = http >= 400 || (code !== undefined && !CODES_NORMAUX.has(code))
  if (anormal && (description || http >= 400)) {
    const erreur = new ErreurCinetpay(code, statut, description || `HTTP ${http}`)
    if (erreur.ipNonAutorisee) erreur.ipSortie = await ipDeSortie()
    throw erreur
  }
  return json
}

/* ------------------------------------------------------------------ */
/* Jeton de session                                                    */
/* ------------------------------------------------------------------ */

let jetonEnCache: { valeur: string; expire: number } | null = null

/** Le jeton dure 24 h chez CinetPay ; on le renouvelle un peu avant. */
const DUREE_JETON = 23 * 60 * 60 * 1000

async function jeton(renouveler = false) {
  if (!renouveler && jetonEnCache && jetonEnCache.expire > Date.now()) return jetonEnCache.valeur

  const reponse = await appeler('POST', '/v1/oauth/login', {
    api_key: CLE,
    api_password: MOT_DE_PASSE,
  })
  const valeur = reponse.access_token
  if (typeof valeur !== 'string' || !valeur) {
    throw new ErreurCinetpay(undefined, 'NO_TOKEN', 'aucun jeton reçu à la connexion')
  }

  jetonEnCache = { valeur, expire: Date.now() + DUREE_JETON }
  return valeur
}

async function avecJeton(methode: 'GET' | 'POST', chemin: string, corps?: unknown) {
  try {
    return await appeler(methode, chemin, corps, await jeton())
  } catch (erreur) {
    const expire =
      erreur instanceof ErreurCinetpay &&
      (erreur.code === 1003 || erreur.statut === 'EXPIRED_TOKEN' || erreur.statut === 'INVALID_TOKEN')
    if (!expire) throw erreur
    return appeler(methode, chemin, corps, await jeton(true))
  }
}

/* ------------------------------------------------------------------ */
/* Paiements                                                           */
/* ------------------------------------------------------------------ */

/** CinetPay refuse les noms de moins de 2 caractères. */
function nomValide(valeur: string, repli: string) {
  const propre = valeur.trim().slice(0, 255)
  return propre.length >= 2 ? propre : repli
}

/** CinetPay limite les adresses de retour et de notification à 120 caractères. */
function adresse(url: string) {
  if (url.length > 120) {
    throw new ErreurCinetpay(undefined, 'INVALID_PARAMS', `adresse trop longue pour CinetPay : ${url}`)
  }
  return url
}

export interface DemandeV1 {
  /** Identifiant marchand, 30 caractères au plus. */
  reference: string
  nom: string
  email: string
}

/**
 * Crée la transaction et renvoie la page de paiement CinetPay, où le client
 * choisit Wave, Orange Money, MTN, Moov ou sa carte. Aucun numéro de
 * téléphone ne transite par IDJÔ CV : il se saisit chez CinetPay.
 */
export async function initierPaiementV1(demande: DemandeV1, origine: string) {
  const [prenom = '', ...reste] = demande.nom.trim().split(/\s+/)
  const retour = `${origine}/api/paiement/retour?reference=${encodeURIComponent(demande.reference)}`

  const reponse = await avecJeton('POST', '/v1/payment', {
    currency: PAIEMENT.devise,
    merchant_transaction_id: demande.reference,
    amount: PAIEMENT.prix,
    lang: 'fr',
    designation: 'IDJO CV - telechargement du CV',
    client_email: demande.email,
    client_first_name: nomValide(prenom, 'Client'),
    client_last_name: nomValide(reste.join(' '), 'IDJO'),
    success_url: adresse(retour),
    failed_url: adresse(`${retour}&echec=1`),
    notify_url: adresse(`${origine}/api/paiement/notification`),
    channel: 'PUSH',
  })

  const url = reponse.payment_url
  if (typeof url !== 'string' || !url) {
    throw new ErreurCinetpay(
      typeof reponse.code === 'number' ? reponse.code : undefined,
      typeof reponse.status === 'string' ? reponse.status : undefined,
      'aucune page de paiement renvoyée',
    )
  }
  return { url, jeton: typeof reponse.payment_token === 'string' ? reponse.payment_token : '' }
}

export type EtatV1 = 'paye' | 'en-attente' | 'refuse'

/** Statuts définitifs d'échec côté CinetPay. */
const ECHECS = new Set(['FAILED', 'EXPIRED', 'INSUFFICIENT_BALANCE', 'USER_IS_BLOCKED'])

/**
 * État réel d'une transaction, relu chez CinetPay : c'est la seule source de
 * vérité, ni le retour du navigateur ni la notification ne suffisent.
 */
export async function verifierPaiementV1(reference: string): Promise<EtatV1> {
  let reponse: Reponse
  try {
    reponse = await avecJeton('GET', `/v1/payment/${encodeURIComponent(reference)}`)
  } catch (erreur) {
    // Transaction pas encore enregistrée de leur côté : on repassera.
    if (erreur instanceof ErreurCinetpay && erreur.statut === 'NOT_FOUND') return 'en-attente'
    throw erreur
  }

  const statut = typeof reponse.status === 'string' ? reponse.status : ''
  if (statut === 'SUCCESS') {
    // Garde-fou : si CinetPay indique le montant, il doit couvrir le tarif.
    const montant = Number(reponse.amount)
    if (Number.isFinite(montant) && montant > 0 && montant + 0.5 < PAIEMENT.prix) return 'refuse'
    return 'paye'
  }
  if (ECHECS.has(statut)) return 'refuse'
  return 'en-attente'
}
