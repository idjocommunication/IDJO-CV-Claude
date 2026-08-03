import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { ButtonLink } from '@/components/ui/Button'
import { ARTICLES, getArticle } from '@/data/articles'
import { JsonLd, SITE, buildMetadata } from '@/lib/seo'

type Params = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return ARTICLES.map((article) => ({ slug: article.slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const article = getArticle(slug)
  if (!article) return buildMetadata({ title: 'Article introuvable', description: '', path: '/conseils' })

  return buildMetadata({
    title: article.title,
    description: article.excerpt,
    path: `/conseils/${article.slug}`,
  })
}

export default async function ArticlePage({ params }: Params) {
  const { slug } = await params
  const article = getArticle(slug)
  if (!article) notFound()

  const related = ARTICLES.filter((item) => item.slug !== article.slug).slice(0, 3)

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: article.title,
          description: article.excerpt,
          datePublished: article.updatedAt,
          dateModified: article.updatedAt,
          inLanguage: 'fr',
          author: { '@type': 'Organization', name: SITE.name },
          publisher: { '@type': 'Organization', name: SITE.name },
        }}
      />

      <article className="container-content max-w-[760px] py-14 sm:py-20">
        <Link
          href="/conseils"
          className="inline-flex items-center gap-2 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeft size={15} />
          Tous les conseils
        </Link>

        <p className="eyebrow mt-8">
          {article.category} · {article.readingTime} de lecture
        </p>
        <h1 className="title-xl mt-3 text-ink">{article.title}</h1>
        <p className="mt-5 text-lg leading-relaxed text-ink-muted">{article.excerpt}</p>

        <div className="mt-12 space-y-6">
          {article.blocks.map((block, index) => {
            if (block.type === 'h2') {
              return (
                <h2 key={index} className="pt-4 text-2xl font-bold tracking-[-0.02em] text-ink">
                  {block.text}
                </h2>
              )
            }
            if (block.type === 'ul') {
              return (
                <ul key={index} className="space-y-2.5">
                  {block.items?.map((item) => (
                    <li key={item} className="flex gap-3 text-[15px] leading-relaxed text-ink-muted">
                      <span className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />
                      {item}
                    </li>
                  ))}
                </ul>
              )
            }
            if (block.type === 'quote') {
              return (
                <blockquote
                  key={index}
                  className="border-l-2 border-ink py-1 pl-5 text-lg font-medium leading-relaxed text-ink"
                >
                  {block.text}
                </blockquote>
              )
            }
            return (
              <p key={index} className="text-[15px] leading-[1.75] text-ink-muted">
                {block.text}
              </p>
            )
          })}
        </div>

        <div className="mt-14 rounded-2xl border border-cloud-300 bg-cloud p-8">
          <h2 className="text-lg font-bold text-ink">Mettez ces conseils en pratique</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            Ouvrez l’éditeur, choisissez un modèle et appliquez la structure décrite ci-dessus.
            L’aperçu se met à jour au fur et à mesure de votre saisie.
          </p>
          <ButtonLink href="/editeur" className="mt-6" size="md">
            Créer mon CV
          </ButtonLink>
        </div>

        <div className="mt-14 border-t border-cloud-300 pt-10">
          <h2 className="text-[15px] font-bold text-ink">À lire ensuite</h2>
          <ul className="mt-4 space-y-3">
            {related.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/conseils/${item.slug}`}
                  className="text-[15px] font-semibold text-ink-muted transition-colors hover:text-ink"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </article>
    </>
  )
}
