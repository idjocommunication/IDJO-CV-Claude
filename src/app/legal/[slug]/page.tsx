import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SITE, buildMetadata } from '@/lib/seo'

interface LegalPage {
  slug: string
  title: string
  description: string
  updatedAt: string
  sections: { heading: string; paragraphs: string[] }[]
}

const PAGES: LegalPage[] = [
  {
    slug: 'mentions-legales',
    title: 'Mentions légales',
    description: 'Éditeur, hébergement et responsabilité du site IDJÔ CV.',
    updatedAt: '15 janvier 2026',
    sections: [
      {
        heading: 'Éditeur du site',
        paragraphs: [
          `${SITE.name} est une plateforme de création de CV en ligne éditée par ${SITE.legalName}, depuis Abidjan, Côte d’Ivoire.`,
          `Contact : ${SITE.email}${SITE.phone ? ` — ${SITE.phone}` : ''}.`,
          `Directeur de la publication : le représentant légal de ${SITE.legalName}.`,
        ],
      },
      {
        heading: 'Hébergement',
        paragraphs: [
          SITE.host
            ? `Le site est hébergé par ${SITE.host}. Toute demande relative à l’hébergement peut être adressée à ${SITE.email}.`
            : `Le nom et l’adresse de l’hébergeur sont communiqués sur simple demande à ${SITE.email}.`,
        ],
      },
      {
        heading: 'Propriété intellectuelle',
        paragraphs: [
          'Les mises en page, textes, logos et éléments graphiques de la plateforme sont protégés. Les contenus que vous saisissez dans votre CV restent votre propriété exclusive.',
          'Vous disposez d’un droit d’usage personnel des modèles pour vos candidatures. Leur revente ou leur redistribution en tant que modèles est interdite.',
        ],
      },
      {
        heading: 'Responsabilité',
        paragraphs: [
          'IDJÔ CV met à disposition un outil de mise en forme. L’exactitude des informations déclarées dans un CV relève de la seule responsabilité de son auteur.',
        ],
      },
    ],
  },
  {
    slug: 'confidentialite',
    title: 'Politique de confidentialité',
    description: 'Quelles données IDJÔ CV traite, pourquoi, et comment les supprimer.',
    updatedAt: '15 janvier 2026',
    sections: [
      {
        heading: 'Principe',
        paragraphs: [
          'Par défaut, votre CV est enregistré dans le stockage local de votre navigateur. Tant que vous ne l’enregistrez pas sur votre compte, aucune donnée de CV n’est transmise à nos serveurs.',
        ],
      },
      {
        heading: 'Données traitées',
        paragraphs: [
          'Compte : adresse email, et le cas échéant nom, téléphone et ville, afin d’identifier votre espace et de vous adresser vos reçus.',
          'Documents : le contenu de vos CV, uniquement si vous demandez leur synchronisation.',
          'Messages : les informations saisies dans le formulaire de contact, conservées le temps de traiter votre demande.',
          'Mesure d’audience : statistiques agrégées et anonymes, sans profilage publicitaire.',
        ],
      },
      {
        heading: 'Durée de conservation',
        paragraphs: [
          'Les documents sont conservés tant que votre compte est actif, puis supprimés dans les 12 mois suivant sa fermeture. Les messages de contact sont supprimés au bout de 24 mois.',
        ],
      },
      {
        heading: 'Vos droits',
        paragraphs: [
          `Vous pouvez demander l’accès, la rectification, la portabilité ou la suppression de vos données en écrivant à ${SITE.email}. Nous répondons sous 30 jours.`,
          'Aucune donnée personnelle n’est vendue ni cédée à des tiers à des fins commerciales.',
        ],
      },
    ],
  },
  {
    slug: 'cgu',
    title: 'Conditions générales d’utilisation',
    description: 'Règles d’utilisation, offres, paiement et résiliation.',
    updatedAt: '15 janvier 2026',
    sections: [
      {
        heading: 'Objet',
        paragraphs: [
          'Les présentes conditions régissent l’accès à la plateforme IDJÔ CV et l’usage de ses fonctionnalités de création, de mise en forme et d’export de CV.',
        ],
      },
      {
        heading: 'Offres et paiement',
        paragraphs: [
          'L’usage de l’éditeur, des modèles, de la lettre de motivation et de l’export PDF est gratuit et ne nécessite aucun compte. Seule la prestation d’accompagnement par un consultant est payante : elle fait l’objet d’un devis, d’un rendez-vous et d’un règlement unique en francs CFA.',
          'Aucun renouvellement automatique n’est appliqué. Le prix affiché au moment de la commande est le prix dû.',
        ],
      },
      {
        heading: 'Rétractation',
        paragraphs: [
          'Un remboursement intégral peut être demandé dans les 7 jours suivant le paiement, sauf si la prestation d’accompagnement a déjà été réalisée.',
        ],
      },
      {
        heading: 'Usage acceptable',
        paragraphs: [
          'Vous vous engagez à ne pas utiliser la plateforme pour produire des documents frauduleux, usurper l’identité d’un tiers ou diffuser des contenus illicites.',
          'Tout manquement peut entraîner la suspension immédiate de l’accès, sans remboursement.',
        ],
      },
    ],
  },
]

type Params = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return PAGES.map((page) => ({ slug: page.slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const page = PAGES.find((item) => item.slug === slug)
  if (!page) return buildMetadata({ title: 'Page introuvable', description: '', path: '/' })

  return buildMetadata({
    title: page.title,
    description: page.description,
    path: `/legal/${page.slug}`,
  })
}

export default async function LegalPageView({ params }: Params) {
  const { slug } = await params
  const page = PAGES.find((item) => item.slug === slug)
  if (!page) notFound()

  return (
    <article className="container-content max-w-[760px] py-16 sm:py-24">
      <p className="eyebrow mb-3">Informations légales</p>
      <h1 className="title-lg text-ink">{page.title}</h1>
      <p className="mt-3 text-sm text-ink-muted">Dernière mise à jour : {page.updatedAt}</p>

      <div className="mt-12 space-y-10">
        {page.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-xl font-bold tracking-[-0.02em] text-ink">{section.heading}</h2>
            <div className="mt-3 space-y-3">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-[15px] leading-[1.75] text-ink-muted">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  )
}
