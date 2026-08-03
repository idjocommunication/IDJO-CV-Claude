import { NextResponse } from 'next/server'
import { z } from 'zod'
import { PAIEMENT } from '@/lib/paiement'
import { initierPaiement, nouvelleReference, paiementConfigure } from '@/lib/paiement-serveur'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const schema = z.object({
  document: z.enum(['cv', 'lettre', 'tout']).default('tout'),
  nom: z.string().trim().min(2).max(80),
  telephone: z
    .string()
    .trim()
    .min(8)
    .max(20)
    .regex(/^[+\d][\d\s.-]+$/, 'Numéro de téléphone invalide.'),
  email: z.string().trim().email().max(120),
  canal: z.string().trim().max(24).optional(),
})

/** Ouvre une transaction et renvoie l'adresse de la page de paiement. */
export async function POST(request: Request) {
  if (!PAIEMENT.actif || !paiementConfigure()) {
    return NextResponse.json(
      {
        error:
          'Le paiement en ligne n’est pas encore activé sur ce site. Le téléchargement reste libre.',
        code: 'non-configure',
      },
      { status: 503 },
    )
  }

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Formulaire incomplet.' },
      { status: 422 },
    )
  }

  const origine = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin
  const reference = nouvelleReference(parsed.data.document)

  try {
    const { url } = await initierPaiement({ ...parsed.data, reference }, origine)
    return NextResponse.json({ url, reference })
  } catch (error) {
    console.error('[paiement] initialisation impossible :', error)
    return NextResponse.json(
      { error: 'Le service de paiement ne répond pas. Réessayez dans un instant.' },
      { status: 502 },
    )
  }
}
