import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { FinalCta } from '@/components/landing/Sections'
import { ARTICLES } from '@/data/articles'
import { buildMetadata } from '@/lib/seo'

export const metadata: Metadata = buildMetadata({
  title: 'Conseils CV et candidature',
  description:
    "Guides pratiques pour rédiger un CV efficace en Côte d'Ivoire : structure, ATS, lettre de motivation, premier emploi.",
  path: '/conseils',
  keywords: ['conseils CV', 'comment faire un CV', 'entretien embauche Abidjan'],
})

export default function ArticlesPage() {
  return (
    <>
      <section className="border-b border-cloud-300 bg-cloud">
        <div className="container-content py-16 sm:py-24">
          <p className="eyebrow mb-3">Ressources</p>
          <h1 className="title-xl max-w-3xl text-ink">
            Des conseils concrets, écrits pour le marché local
          </h1>
          <p className="prose-muted mt-5 max-w-2xl">
            Pas de généralités recopiées : des repères applicables à une candidature envoyée depuis
            Abidjan, Bouaké ou Dakar.
          </p>
        </div>
      </section>

      <section className="container-content py-16 sm:py-20">
        <div className="grid gap-px overflow-hidden rounded-2xl border border-cloud-300 bg-cloud-300 sm:grid-cols-2">
          {ARTICLES.map((article) => (
            <article key={article.slug} className="group bg-white p-8 transition-colors hover:bg-cloud">
              <p className="eyebrow">{article.category}</p>
              <h2 className="mt-3 text-xl font-bold leading-snug tracking-[-0.02em] text-ink">
                <Link href={`/conseils/${article.slug}`} className="after:absolute">
                  {article.title}
                </Link>
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">{article.excerpt}</p>
              <p className="mt-6 flex items-center gap-2 text-[13px] font-semibold text-ink">
                Lire l’article
                <ArrowUpRight
                  size={15}
                  className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
                <span className="font-normal text-ink-muted">· {article.readingTime}</span>
              </p>
            </article>
          ))}
        </div>
      </section>

      <FinalCta />
    </>
  )
}
