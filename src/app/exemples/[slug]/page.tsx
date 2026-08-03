import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Check } from 'lucide-react'
import { AutoScaleSheet } from '@/components/ui/AutoScaleSheet'
import { ButtonLink } from '@/components/ui/Button'
import { EXAMPLES, getExample } from '@/data/examples'
import { TEMPLATE_BY_ID } from '@/data/templates'
import { JsonLd, buildMetadata } from '@/lib/seo'
import { periodLabel } from '@/lib/utils'

type Params = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return EXAMPLES.map((example) => ({ slug: example.slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const example = getExample(slug)
  if (!example) return buildMetadata({ title: 'Exemple introuvable', description: '', path: '/exemples' })

  return buildMetadata({
    title: `Exemple de CV ${example.job} — modèle à remplir`,
    description: `${example.summary} Exemple complet, gratuit, à ouvrir directement dans l’éditeur IDJÔ CV.`,
    path: `/exemples/${example.slug}`,
    keywords: example.keywords,
  })
}

export default async function ExamplePage({ params }: Params) {
  const { slug } = await params
  const example = getExample(slug)
  if (!example) notFound()

  const template = TEMPLATE_BY_ID[example.data.settings.template]
  const others = EXAMPLES.filter((item) => item.slug !== example.slug).slice(0, 3)

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          name: `Rédiger un CV de ${example.job}`,
          inLanguage: 'fr',
          description: example.summary,
          step: example.advice.map((text, index) => ({
            '@type': 'HowToStep',
            position: index + 1,
            text,
          })),
        }}
      />

      <section className="border-b border-cloud-300 bg-cloud">
        <div className="container-content py-10 sm:py-14">
          <Link
            href="/exemples"
            className="inline-flex items-center gap-2 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
          >
            <ArrowLeft size={15} />
            Tous les exemples
          </Link>

          <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_1.05fr] lg:items-start">
            <div className="lg:sticky lg:top-24">
              <div
                className="overflow-hidden rounded-xl border border-cloud-300 bg-white shadow-float"
                style={{ aspectRatio: '794 / 1123' }}
              >
                <AutoScaleSheet data={example.data} rounded={11} />
              </div>
              <p className="mt-3 text-center text-xs text-ink-muted">
                Modèle {template?.name} — exemple rempli à titre d’illustration
              </p>
            </div>

            <div>
              <p className="eyebrow mb-3">{example.sector}</p>
              <h1 className="title-xl text-ink">Exemple de CV {example.job}</h1>
              <p className="prose-muted mt-5">{example.summary}</p>

              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href={`/editeur?modele=${example.data.settings.template}`} size="lg">
                  Créer mon CV {example.job.toLowerCase()}
                </ButtonLink>
                <ButtonLink href="/modeles" variant="outline" size="lg">
                  Changer de modèle
                </ButtonLink>
              </div>

              <h2 className="mt-12 text-xl font-bold tracking-[-0.02em] text-ink">
                Ce que le recruteur regarde en premier
              </h2>
              <ul className="mt-4 space-y-3">
                {example.advice.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[15px] text-ink-muted">
                    <Check size={17} className="mt-0.5 shrink-0 text-ink" />
                    {item}
                  </li>
                ))}
              </ul>

              <h2 className="mt-10 text-xl font-bold tracking-[-0.02em] text-ink">
                Le contenu de cet exemple
              </h2>
              <div className="mt-4 divide-y divide-cloud-300 border-y border-cloud-300">
                <div className="py-4">
                  <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-ink-muted">
                    Accroche
                  </p>
                  <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">
                    {example.data.profile.about}
                  </p>
                </div>
                <div className="py-4">
                  <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-ink-muted">
                    Parcours
                  </p>
                  <ul className="mt-2 space-y-2">
                    {example.data.experiences.map((exp) => (
                      <li key={exp.id} className="text-[15px] text-ink-muted">
                        <span className="font-semibold text-ink">{exp.role}</span> — {exp.company},{' '}
                        {periodLabel(exp.start, exp.end, exp.current)}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="py-4">
                  <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-ink-muted">
                    Compétences mises en avant
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {example.data.skills.map((skill) => (
                      <span
                        key={skill.id}
                        className="rounded-full border border-cloud-400 bg-white px-3 py-1.5 text-xs font-semibold text-ink-muted"
                      >
                        {skill.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <p className="mt-6 text-[13px] leading-relaxed text-neutral-500">
                Cet exemple est fictif : il illustre la structure attendue. Reprenez-en la forme,
                jamais le contenu — un CV se juge sur des faits vérifiables.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="container-content py-16 sm:py-20">
        <h2 className="title-lg text-ink">D’autres métiers</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {others.map((other) => (
            <Link
              key={other.slug}
              href={`/exemples/${other.slug}`}
              className="rounded-xl border border-cloud-300 bg-white p-6 transition-colors hover:border-ink"
            >
              <p className="eyebrow">{other.sector}</p>
              <p className="mt-2 text-[15px] font-bold text-ink">Exemple de CV {other.job}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}
