import { NextResponse } from 'next/server'
import { expliquerErreurPaiement, verifierPaiement } from '@/lib/paiement-serveur'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Notification serveur à serveur de CinetPay.
 *
 * Le corps reçu n'est jamais considéré comme une preuve : on relit l'état de
 * la transaction auprès de CinetPay. La notification sert de filet quand
 * l'utilisateur ferme son navigateur avant de revenir — l'accès sera délivré
 * à sa prochaine visite, à partir de la même référence.
 *
 * L'API v1 envoie du JSON (`merchant_transaction_id`), l'ancienne API un
 * formulaire (`cpm_trans_id`) : les deux sont lus.
 */
async function lireReference(request: Request) {
  const parametre = new URL(request.url).searchParams
  const type = request.headers.get('content-type') ?? ''

  if (type.includes('application/json')) {
    const json = (await request.json().catch(() => null)) as Record<string, unknown> | null
    const valeur = json?.merchant_transaction_id ?? json?.transaction_id
    if (typeof valeur === 'string') return valeur
  } else {
    const corps = await request.formData().catch(() => null)
    const valeur = corps?.get('cpm_trans_id') ?? corps?.get('merchant_transaction_id')
    if (typeof valeur === 'string') return valeur
  }
  return parametre.get('merchant_transaction_id') ?? parametre.get('transaction_id')
}

export async function POST(request: Request) {
  const reference = (await lireReference(request))?.trim()
  if (!reference || reference.length > 200) return NextResponse.json({ ok: true })

  const etat = await verifierPaiement(reference).catch((erreur: unknown) => {
    console.error('[paiement] notification illisible :', expliquerErreurPaiement(erreur))
    return 'en-attente' as const
  })
  console.info('[paiement] notification', reference, '→', etat)

  return NextResponse.json({ ok: true })
}

export async function GET() {
  return NextResponse.json({ ok: true })
}
