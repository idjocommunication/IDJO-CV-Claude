import type { Metadata } from 'next'
import { HeroCarousel } from '@/components/landing/HeroCarousel'
import {
  FaqSection,
  Features,
  FinalCta,
  LetterShowcase,
  Pricing,
  StatsBar,
  Steps,
  TemplatesShowcase,
  Guarantees,
} from '@/components/landing/Sections'
import { FAQ } from '@/data/marketing'
import { JsonLd, buildMetadata, faqJsonLd } from '@/lib/seo'

export const metadata: Metadata = buildMetadata({
  title: 'IDJÔ CV — Créez un CV professionnel en 10 minutes',
  description:
    "Modèles de CV professionnels pour la Côte d'Ivoire et l'Afrique francophone. Éditeur en ligne, aperçu temps réel, export PDF A4 compatible ATS. Gratuit pour commencer.",
  path: '/',
})

export default function HomePage() {
  return (
    <>
      <JsonLd data={faqJsonLd(FAQ)} />
      <div id="accueil">
        <HeroCarousel />
      </div>
      <StatsBar />
      <Features />
      <TemplatesShowcase />
      <LetterShowcase />
      <Steps />
      <Guarantees />
      <Pricing />
      <FaqSection />
      <FinalCta />
    </>
  )
}
