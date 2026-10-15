import { NextResponse } from 'next/server'
import { z } from 'zod'
import { FORFAITS, PAIEMENT, forfaitParId } from '@/lib/paiement'
import {
  cinetpayConfigure,
  expliquerErreurPaiement,
  fournisseursDisponibles,
  initierPaiement,
  nouvelleReference,
} from '@/lib/paiement-serveur'
import { creerSessionStripe, stripeConfigure } from '@/lib/stripe-serveur'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Ce que le site sait encaisser : forfaits proposés et encaisseurs branchés.
 * Aucune clé n'en sort — l'interface a seulement besoin de savoir quels
 * boutons afficher.
 */
export async function GET() {
  return NextResponse.json({
    actif: PAIEMENT.actif,
    mode: PAIEMENT.mode,
    fournisseurs: PAIEMENT.actif ? fournisseursDisponibles() : [],
    forfaits: FORFAITS,
  })
}

const schema = z.object({
  document: z.enum(['cv', 'lettre', 'tout']).default('tout'),
  forfait: z.string().trim().max(40).optional(),
  fournisseur: z.enum(['cinetpay', 'stripe']).default('cinetpay'),
  nom: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  // Facultatif : le numéro se saisit sur la page sécurisée de CinetPay.
  telephone: z
    .string()
    .trim()
    .max(20)
    .regex(/^[+\d][\d\s.-]*$/, 'Numéro de téléphone invalide.')
    .optional(),
})

/** Ouvre une transaction et renvoie l'adresse de la page de paiement. */
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Formulaire incomplet.' },
      { status: 422 },
    )
  }

  const { fournisseur, document, email, nom } = parsed.data
  const forfait = forfaitParId(parsed.data.forfait)
  const configure = fournisseur === 'stripe' ? stripeConfigure() : cinetpayConfigure()

  if (!PAIEMENT.actif || !configure) {
    return NextResponse.json(
      {
        error:
          'Ce moyen de paiement n’est pas encore activé sur ce site. Le téléchargement reste libre.',
        code: 'non-configure',
      },
      { status: 503 },
    )
  }

  const origine = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin

  try {
    if (fournisseur === 'stripe') {
      const { url, reference } = await creerSessionStripe(
        { forfait, document, email, nom },
        origine,
      )
      return NextResponse.json({ url, reference, forfait: forfait.id })
    }

    const reference = nouvelleReference(document)
    const { url } = await initierPaiement(
      { document, email, nom, telephone: parsed.data.telephone ?? '', reference },
      origine,
    )
    return NextResponse.json({ url, reference, forfait: forfait.id })
  } catch (error) {
    console.error('[paiement] initialisation impossible :', expliquerErreurPaiement(error))
    return NextResponse.json(
      { error: 'Le service de paiement ne répond pas. Réessayez dans un instant.' },
      { status: 502 },
    )
  }
}
