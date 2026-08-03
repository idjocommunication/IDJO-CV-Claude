import { NextResponse } from 'next/server'
import { verifierPaiement } from '@/lib/paiement-serveur'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Notification serveur à serveur de CinetPay.
 *
 * Le corps reçu n'est jamais considéré comme une preuve : on relit l'état de
 * la transaction auprès de CinetPay. La notification sert de filet quand
 * l'utilisateur ferme son navigateur avant de revenir — l'accès sera délivré
 * à sa prochaine visite, à partir de la même référence.
 */
export async function POST(request: Request) {
  const corps = await request.formData().catch(() => null)
  const reference =
    (corps?.get('cpm_trans_id') as string | null) ??
    new URL(request.url).searchParams.get('transaction_id')

  if (!reference) return NextResponse.json({ ok: true })

  const etat = await verifierPaiement(reference).catch(() => 'en-attente' as const)
  console.info('[paiement] notification', reference, '→', etat)

  return NextResponse.json({ ok: true })
}

export async function GET() {
  return NextResponse.json({ ok: true })
}
