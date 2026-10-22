import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { PAIEMENT, normaliserCode } from '@/lib/paiement'
import {
  codesConfigure,
  signerAcces,
  verifierCode,
  verifierCodePublie,
} from '@/lib/paiement-serveur'
import { delivrer } from '@/lib/registre'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const schema = z.object({ code: z.string().trim().min(8).max(40) })

/**
 * Échange un code d'accès, remis après vérification du paiement sur le lien
 * CinetPay, contre le jeton d'un téléchargement. Un code ne sert qu'une fois :
 * le registre en garde l'empreinte, jamais le code lui-même.
 */
export async function POST(request: Request) {
  if (!PAIEMENT.actif || !codesConfigure()) {
    return NextResponse.json({ error: 'Le paiement par code n’est pas activé.' }, { status: 503 })
  }

  const parsed = schema.safeParse(await request.json().catch(() => null))
  const code = parsed.success ? parsed.data.code : ''
  const valide = code ? (verifierCode(code) ?? verifierCodePublie(code)) : null
  if (!valide) {
    return NextResponse.json(
      { error: 'Code invalide. Vérifiez-le ou contactez-nous avec votre preuve de paiement.' },
      { status: 403 },
    )
  }

  const empreinte = createHash('sha256').update(normaliserCode(code)).digest('hex')
  if (!(await delivrer('code', empreinte))) {
    return NextResponse.json(
      { error: 'Ce code a déjà servi pour un téléchargement. Chaque code n’ouvre qu’un téléchargement.' },
      { status: 403 },
    )
  }

  const reference = `CODE-${valide.serie}`
  const { token, expire } = signerAcces(reference)
  return NextResponse.json({ token, expire, reference })
}
