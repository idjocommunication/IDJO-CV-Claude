import { NextResponse } from 'next/server'
import { PAIEMENT } from '@/lib/paiement'
import { paiementConfigure, signerAcces, verifierTransaction } from '@/lib/paiement-serveur'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * État d'une transaction, chez CinetPay comme chez Stripe. Quand elle est
 * réglée, la réponse contient le jeton d'accès : c'est le seul endroit où il
 * est délivré, et toujours après vérification auprès de l'encaisseur.
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
    const { etat, dureeJours } = await verifierTransaction(reference)
    if (etat !== 'paye') return NextResponse.json({ etat })

    const { token, expire } = signerAcces(reference, dureeJours)
    return NextResponse.json({ etat, token, expire, reference, jours: dureeJours })
  } catch (error) {
    console.error('[paiement] vérification impossible :', error)
    return NextResponse.json({ etat: 'en-attente' })
  }
}
