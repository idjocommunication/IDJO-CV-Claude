/**
 * Envoi d'e-mails transactionnels.
 *
 * Deux fournisseurs, choisis selon la clé présente : Resend (déjà utilisé par
 * le formulaire de contact) et Brevo, très répandu en Afrique francophone.
 * Aucun SDK : un appel HTTP suffit, et l'absence de clé n'empêche jamais le
 * site de fonctionner — l'appelant se contente d'annoncer que l'envoi par
 * e-mail n'est pas actif.
 */

export class EmailIndisponible extends Error {}

export interface PieceJointe {
  nom: string
  contenu: Uint8Array
  type?: string
}

export interface Courriel {
  a: string
  sujet: string
  texte: string
  html?: string
  repondreA?: string
  pieces?: PieceJointe[]
}

function expediteur() {
  const adresse = process.env.EMAIL_EXPEDITEUR || process.env.CONTACT_FROM_EMAIL || ''
  const nom = process.env.EMAIL_EXPEDITEUR_NOM || 'IDJÔ CV'
  return { adresse, nom }
}

/** Un fournisseur d'e-mail est-il utilisable en l'état ? */
export function emailConfigure() {
  const { adresse } = expediteur()
  if (!adresse) return false
  return Boolean(process.env.RESEND_API_KEY || process.env.BREVO_API_KEY)
}

const base64 = (contenu: Uint8Array) => Buffer.from(contenu).toString('base64')

/** Surchargeables pour viser un relais interne ou un bac à sable. */
const RESEND = process.env.RESEND_BASE_URL ?? 'https://api.resend.com'
const BREVO = process.env.BREVO_BASE_URL ?? 'https://api.brevo.com/v3'

async function parResend(courriel: Courriel) {
  const cle = process.env.RESEND_API_KEY
  if (!cle) return false
  const { adresse, nom } = expediteur()

  const reponse = await fetch(`${RESEND}/emails`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cle}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `${nom} <${adresse}>`,
      to: [courriel.a],
      reply_to: courriel.repondreA,
      subject: courriel.sujet,
      text: courriel.texte,
      html: courriel.html,
      attachments: courriel.pieces?.map((piece) => ({
        filename: piece.nom,
        content: base64(piece.contenu),
      })),
    }),
  })

  if (!reponse.ok) {
    console.error('[email] Resend a refusé l’envoi :', reponse.status, await reponse.text())
    return false
  }
  return true
}

async function parBrevo(courriel: Courriel) {
  const cle = process.env.BREVO_API_KEY
  if (!cle) return false
  const { adresse, nom } = expediteur()

  const reponse = await fetch(`${BREVO}/smtp/email`, {
    method: 'POST',
    headers: { 'api-key': cle, 'Content-Type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { email: adresse, name: nom },
      to: [{ email: courriel.a }],
      replyTo: courriel.repondreA ? { email: courriel.repondreA } : undefined,
      subject: courriel.sujet,
      textContent: courriel.texte,
      htmlContent: courriel.html,
      attachment: courriel.pieces?.map((piece) => ({
        name: piece.nom,
        content: base64(piece.contenu),
      })),
    }),
  })

  if (!reponse.ok) {
    console.error('[email] Brevo a refusé l’envoi :', reponse.status, await reponse.text())
    return false
  }
  return true
}

/** Envoie le message, ou lève `EmailIndisponible` si rien n'a pu partir. */
export async function envoyerEmail(courriel: Courriel) {
  if (!emailConfigure()) {
    throw new EmailIndisponible('Aucun fournisseur d’e-mail n’est configuré.')
  }

  const parti = (await parResend(courriel)) || (await parBrevo(courriel))
  if (!parti) throw new EmailIndisponible('Le fournisseur d’e-mail a refusé le message.')
}
