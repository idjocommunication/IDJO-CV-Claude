import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Retour de l'utilisateur depuis la page de paiement. CinetPay peut revenir en
 * GET comme en POST : les deux sont acceptés et ramènent à l'éditeur, qui
 * interroge ensuite l'état réel de la transaction.
 */
function redirection(request: Request, reference: string | null) {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin
  const cible = new URL('/editeur', base)
  if (reference) cible.searchParams.set('paiement', reference)
  return NextResponse.redirect(cible, 303)
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  return redirection(request, params.get('reference') ?? params.get('transaction_id'))
}

export async function POST(request: Request) {
  const params = new URL(request.url).searchParams
  let reference = params.get('reference') ?? params.get('transaction_id')

  if (!reference) {
    const corps = await request.formData().catch(() => null)
    reference = (corps?.get('cpm_trans_id') as string | null) ?? null
  }

  return redirection(request, reference)
}
