import { NextResponse } from 'next/server'
import { PAIEMENT } from '@/lib/paiement'
import {
  expliquerErreurPaiement,
  paiementConfigure,
  referencePerimee,
  signerAcces,
  verifierTransaction,
} from '@/lib/paiement-serveur'
import { delivrer } from '@/lib/registre'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * État d'une transaction, chez CinetPay comme chez Stripe. Quand elle est
 * réglée, la réponse contient le jeton d'accès : c'est le seul endroit où il
 * est délivré, et toujours après vérification auprès de l'encaisseur.
 *
 * Un paiement n'ouvre qu'un téléchargement : le jeton n'est délivré qu'une
 * fois par transaction (le registre tolère une nouvelle demande dans les dix
 * minutes, pour une réponse perdue), et jamais pour une transaction trop
 * ancienne. Sinon l'état « utilise » est renvoyé.
 */
export async function GET(request: Request) {
  const reference = new URL(request.url).searchParams.get('reference')?.trim()
  if (!reference || reference.length > 200) {
    return NextResponse.json({ error: 'Référence manquante.' }, { status: 400 })
  }

  if (!PAIEMENT.actif || !paiementConfigure()) {
    return NextResponse.json({ etat: 'non-configure' }, { status: 503 })
  }

  try {
    const etat = await verifierTransaction(reference)
    if (etat !== 'paye') return NextResponse.json({ etat })

    if (referencePerimee(reference) || !(await delivrer('paiement', reference))) {
      return NextResponse.json({ etat: 'utilise' })
    }

    const { token, expire } = signerAcces(reference)
    return NextResponse.json({ etat, token, expire, reference })
  } catch (error) {
    console.error('[paiement] vérification impossible :', expliquerErreurPaiement(error))
    return NextResponse.json({ etat: 'en-attente' })
  }
}
