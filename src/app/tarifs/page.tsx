import type { Metadata } from 'next'
import { FaqSection, FinalCta, Pricing } from '@/components/landing/Sections'
import { buildMetadata } from '@/lib/seo'
import { PAIEMENT, prixLisible } from '@/lib/paiement'

export const metadata: Metadata = buildMetadata({
  title: `Tarif — création gratuite, téléchargement à ${prixLisible()}`,
  description: `Composez votre CV et votre lettre gratuitement. Le téléchargement du PDF du CV coûte ${prixLisible()}, une seule fois, pour ${PAIEMENT.dureeJours} jours d'exports illimités. Paiement Wave, Orange Money, MTN, Moov ou carte.`,
  path: '/tarifs',
  keywords: ['CV en ligne Côte d’Ivoire', 'paiement Wave Orange Money', 'CV pas cher Abidjan'],
})

export default function PricingPage() {
  return (
    <>
      <section className="border-b border-cloud-300 bg-cloud">
        <div className="container-content py-16 text-center sm:py-24">
          <p className="eyebrow mb-3">Tarif</p>
          <h1 className="title-xl mx-auto max-w-3xl text-ink">
            Composez gratuitement. Payez seulement pour télécharger votre CV.
          </h1>
          <p className="prose-muted mx-auto mt-5 max-w-2xl">
            Vous montez tout votre CV, vous le voyez en A4, vous le corrigez autant que vous
            voulez — sans rien payer et sans créer de compte. Le règlement n’arrive qu’au moment
            d’emporter le PDF de votre CV.
          </p>
        </div>
      </section>

      <Pricing compact />

      <section className="border-t border-cloud-300 bg-cloud py-16">
        <div className="container-content grid gap-8 sm:grid-cols-3">
          {[
            {
              title: 'Payer avec ce que vous avez déjà',
              text: 'Wave, Orange Money, MTN MoMo, Moov Money ou carte bancaire. Le règlement se fait sur la page sécurisée de notre partenaire : nous ne voyons ni votre code secret, ni votre solde.',
            },
            {
              title: 'Aucun abonnement',
              text: `Un paiement unique ouvre ${PAIEMENT.dureeJours} jours de téléchargements illimités du CV. Rien ne se renouvelle tout seul, aucune carte n’est conservée sur la plateforme.`,
            },
            {
              title: 'Vous voyez avant de payer',
              text: 'Le CV s’affiche en entier, en A4, pendant toute la saisie. Vous savez exactement ce que vous emportez avant d’engager le moindre franc.',
            },
          ].map((item) => (
            <div key={item.title}>
              <h2 className="text-[15px] font-bold text-ink">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <FaqSection />
      <FinalCta />
    </>
  )
}
