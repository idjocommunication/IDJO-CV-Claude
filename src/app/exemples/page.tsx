import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { FinalCta } from '@/components/landing/Sections'
import { AutoScaleSheet } from '@/components/ui/AutoScaleSheet'
import { EXAMPLES } from '@/data/examples'
import { buildMetadata } from '@/lib/seo'

export const metadata: Metadata = buildMetadata({
  title: 'Exemples de CV par métier',
  description:
    "Exemples de CV complets et rédigés pour les métiers les plus recherchés en Côte d'Ivoire : comptable, développeur, commercial, assistante de direction, technicien, infirmier.",
  path: '/exemples',
  keywords: ['exemple de CV', 'modèle CV métier', 'CV rempli exemple'],
})

export default function ExamplesPage() {
  return (
    <>
      <section className="border-b border-cloud-300 bg-cloud">
        <div className="container-content py-16 sm:py-24">
          <p className="eyebrow mb-3">Exemples</p>
          <h1 className="title-xl max-w-3xl text-ink">
            Des CV déjà rédigés, métier par métier
          </h1>
          <p className="prose-muted mt-5 max-w-2xl">
            La page blanche est le premier obstacle. Partez d’un exemple complet pour votre métier,
            ouvrez-le dans l’éditeur et remplacez le contenu par le vôtre.
          </p>
        </div>
      </section>

      <section className="container-content py-16 sm:py-20">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {EXAMPLES.map((example) => (
            <article key={example.slug} className="group flex flex-col">
              <Link
                href={`/exemples/${example.slug}`}
                className="block overflow-hidden rounded-xl border border-cloud-300 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-float"
                style={{ aspectRatio: '794 / 1123' }}
              >
                <AutoScaleSheet data={example.data} rounded={11} />
              </Link>
              <div className="mt-4">
                <p className="eyebrow">{example.sector}</p>
                <h2 className="mt-1.5 text-[17px] font-bold text-ink">
                  <Link href={`/exemples/${example.slug}`}>Exemple de CV {example.job}</Link>
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{example.summary}</p>
                <p className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink">
                  Voir l’exemple
                  <ArrowUpRight
                    size={14}
                    className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <FinalCta />
    </>
  )
}
