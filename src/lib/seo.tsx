import type { Metadata } from 'next'
import { PAIEMENT } from '@/lib/paiement'

/**
 * Identité et coordonnées du site. Tout ce qui est propre à l'exploitant se
 * règle par variables d'environnement : aucune coordonnée inventée ne doit
 * rester affichée en production. Une valeur vide masque simplement le bloc
 * correspondant plutôt que d'afficher un numéro fictif.
 */
export const SITE = {
  name: 'IDJÔ CV',
  domain: 'idjocv.ci',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://idjocv.ci',
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'idjocommunication@gmail.com',
  /** Format international, ex. « +225 07 07 12 34 56 ». Vide = bloc masqué. */
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE ?? '',
  /** Numéro WhatsApp en chiffres, ex. « 2250707123456 ». Vide = bloc masqué. */
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP ?? '',
  /** Raison sociale affichée dans les mentions légales. */
  legalName: process.env.NEXT_PUBLIC_LEGAL_NAME ?? 'IDJÔ Communication',
  /** Hébergeur déclaré dans les mentions légales. */
  host: process.env.NEXT_PUBLIC_HOST_NAME ?? '',
  city: 'Abidjan',
  country: 'CI',
  description:
    "Créez un CV professionnel en 10 minutes avec IDJÔ CV : modèles pensés pour les recruteurs de Côte d'Ivoire et d'Afrique francophone, export PDF prêt à envoyer, compatible ATS.",
  locale: 'fr_CI',
}

export function buildMetadata({
  title,
  description,
  path = '/',
  keywords = [],
}: {
  title: string
  description: string
  path?: string
  keywords?: string[]
}): Metadata {
  const url = `${SITE.url}${path}`
  return {
    title,
    description,
    keywords: [
      'créer un CV',
      'CV en ligne',
      'modèle de CV',
      'CV Côte d’Ivoire',
      'CV Abidjan',
      'exemple de CV',
      'CV PDF gratuit',
      'lettre de motivation',
      ...keywords,
    ],
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      locale: SITE.locale,
      url,
      siteName: SITE.name,
      title,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE.name,
    url: SITE.url,
    email: SITE.email,
    address: {
      '@type': 'PostalAddress',
      addressLocality: SITE.city,
      addressCountry: SITE.country,
    },
    areaServed: ['CI', 'SN', 'BF', 'ML', 'BJ', 'TG', 'CM', 'GN'],
    description: SITE.description,
  }
}

export function softwareJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE.name,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    inLanguage: 'fr',
    offers: [
      {
        '@type': 'Offer',
        name: 'Gratuit',
        price: '0',
        priceCurrency: 'XOF',
      },
      {
        '@type': 'Offer',
        name: 'Téléchargement',
        price: String(PAIEMENT.prix),
        priceCurrency: 'XOF',
      },
    ],
  }
}

export function faqJsonLd(items: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }
}

/** Lien « cliquer pour discuter » WhatsApp, message pré-rempli. */
export function whatsappLink(message?: string) {
  if (!SITE.whatsapp) return null
  const digits = SITE.whatsapp.replace(/\D/g, '')
  return `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ''}`
}

/** Lien « mailto » pré-rempli, utilisé comme secours du formulaire. */
export function mailtoLink(subject: string, body: string) {
  return `mailto:${SITE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
