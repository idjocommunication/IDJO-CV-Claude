import { NextResponse } from 'next/server'
import { z } from 'zod'
import { EmailIndisponible, emailConfigure, envoyerEmail } from '@/lib/email'
import { PdfIndisponible, htmlEnPdf, pdfConfigure } from '@/lib/pdf-serveur'
import { PAIEMENT } from '@/lib/paiement'
import { paiementConfigure, verifierAcces } from '@/lib/paiement-serveur'
import { dejaDelivre, noterDelivrance } from '@/lib/registre'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Envoi du document en PDF sur la boîte mail du client.
 *
 * Le navigateur transmet la page imprimable qu'il a sous les yeux ; le serveur
 * l'imprime en PDF et l'expédie. Rien n'est conservé : ni le document, ni
 * l'adresse. Quand le téléchargement est payant, un jeton d'accès valide est
 * exigé — le même que celui délivré après vérification de la transaction.
 */

const schema = z.object({
  email: z.string().trim().email('Adresse e-mail invalide.').max(120),
  html: z.string().min(200, 'Document vide.').max(6_000_000),
  document: z.enum(['cv', 'lettre', 'tout']).default('cv'),
  nom: z.string().trim().max(80).optional(),
  token: z.string().trim().max(400).optional(),
})

const LIBELLES = {
  cv: { titre: 'votre CV', fichier: 'CV' },
  lettre: { titre: 'votre lettre de motivation', fichier: 'Lettre-de-motivation' },
  tout: { titre: 'votre CV et votre lettre de motivation', fichier: 'CV-et-lettre' },
} as const

/** Limitation simple par IP : 6 envois / 10 minutes et par instance. */
const FENETRE_MS = 10 * 60 * 1000
const MAX_PAR_FENETRE = 6
const envois = new Map<string, number[]>()

function tropDEnvois(ip: string) {
  const maintenant = Date.now()
  const recents = (envois.get(ip) ?? []).filter((instant) => maintenant - instant < FENETRE_MS)
  recents.push(maintenant)
  envois.set(ip, recents)
  return recents.length > MAX_PAR_FENETRE
}

function nomFichier(base: string, nom?: string) {
  const propre = (nom ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${base}${propre ? `-${propre}` : ''}.pdf`
}

/** L'envoi par e-mail est-il actif sur ce site ? */
export function GET() {
  return NextResponse.json({ disponible: emailConfigure() && pdfConfigure() })
}

export async function POST(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'inconnu'

  if (tropDEnvois(ip)) {
    return NextResponse.json(
      { error: 'Trop d’envois depuis cet appareil. Réessayez dans quelques minutes.' },
      { status: 429 },
    )
  }

  const analyse = schema.safeParse(await request.json().catch(() => null))
  if (!analyse.success) {
    return NextResponse.json(
      { error: analyse.error.issues[0]?.message ?? 'Demande incomplète.' },
      { status: 422 },
    )
  }

  const { email, html, document: cible, nom, token } = analyse.data

  // Téléchargement payant : sans jeton valide, rien ne part, et un jeton ne
  // sert qu'à un envoi. La lettre de motivation est gratuite.
  const exigeAcces =
    PAIEMENT.actif && PAIEMENT.mode === 'bloquant' && paiementConfigure() && cible !== 'lettre'
  const acces = exigeAcces && token ? verifierAcces(token) : null
  if (exigeAcces && (!acces || (await dejaDelivre('envoi', acces.reference)))) {
    return NextResponse.json(
      { error: 'Votre accès au téléchargement n’est plus valide.', code: 'acces-invalide' },
      { status: 402 },
    )
  }

  if (!emailConfigure() || !pdfConfigure()) {
    return NextResponse.json(
      {
        code: 'envoi-inactif',
        error:
          'L’envoi par e-mail n’est pas encore activé sur ce site. Téléchargez votre document directement.',
      },
      { status: 503 },
    )
  }

  const libelle = LIBELLES[cible]

  try {
    const pdf = await htmlEnPdf(html)

    await envoyerEmail({
      a: email,
      sujet: `IDJÔ CV — ${libelle.titre} en PDF`,
      texte: [
        'Bonjour,',
        '',
        `Vous trouverez ${libelle.titre} en pièce jointe, au format PDF, prêt à être envoyé aux recruteurs.`,
        '',
        'Conservez ce message : il vous servira de sauvegarde.',
        '',
        'Bonne recherche,',
        'L’équipe IDJÔ CV',
      ].join('\n'),
      html: [
        '<div style="font-family:Segoe UI,Roboto,Arial,sans-serif;font-size:15px;line-height:1.6;color:#0B1A33">',
        '<p>Bonjour,</p>',
        `<p>Vous trouverez <strong>${libelle.titre}</strong> en pièce jointe, au format PDF, prêt à être envoyé aux recruteurs.</p>`,
        '<p>Conservez ce message : il vous servira de sauvegarde.</p>',
        '<p>Bonne recherche,<br>L’équipe IDJÔ CV</p>',
        '</div>',
      ].join(''),
      pieces: [{ nom: nomFichier(libelle.fichier, nom), contenu: pdf, type: 'application/pdf' }],
    })

    if (acces) await noterDelivrance('envoi', acces.reference)
    return NextResponse.json({ ok: true, email })
  } catch (erreur) {
    // Tout est configuré mais quelque chose a lâché : c'est une panne
    // passagère, pas une fonction inactive — l'interface ne doit pas dire
    // l'inverse au client.
    if (erreur instanceof PdfIndisponible || erreur instanceof EmailIndisponible) {
      console.error('[envoi-cv] envoi impossible :', erreur.message)
      return NextResponse.json(
        {
          code: 'envoi-echec',
          error:
            'L’envoi par e-mail est momentanément indisponible. Réessayez, ou téléchargez votre document directement.',
        },
        { status: 503 },
      )
    }

    console.error('[envoi-cv] échec inattendu :', erreur)
    return NextResponse.json(
      { error: 'L’envoi a échoué. Réessayez, ou téléchargez votre document directement.' },
      { status: 502 },
    )
  }
}
