import { NextResponse } from 'next/server'
import { z } from 'zod'
import { PAIEMENT } from '@/lib/paiement'
import {
  codesConfigure,
  signerAcces,
  verifierCode,
  verifierCodePublie,
} from '@/lib/paiement-serveur'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const schema = z.object({ code: z.string().trim().min(8).max(40) })

/**
 * Échange un code d'accès, remis après vérification du paiement sur le lien
 * CinetPay, contre le jeton d'accès signé.
 */
export async function POST(request: Request) {
  if (!PAIEMENT.actif || !codesConfigure()) {
    return NextResponse.json({ error: 'Le paiement par code n’est pas activé.' }, { status: 503 })
  }

  const parsed = schema.safeParse(await request.json().catch(() => null))
  const valide = parsed.success
    ? (verifierCode(parsed.data.code) ?? verifierCodePublie(parsed.data.code))
    : null
  if (!valide) {
    return NextResponse.json(
      { error: 'Code invalide. Vérifiez-le ou contactez-nous avec votre preuve de paiement.' },
      { status: 403 },
    )
  }

  const reference = `CODE-${valide.serie}`
  const { token, expire } = signerAcces(reference, PAIEMENT.dureeJours)
  return NextResponse.json({ token, expire, reference, jours: PAIEMENT.dureeJours })
}
