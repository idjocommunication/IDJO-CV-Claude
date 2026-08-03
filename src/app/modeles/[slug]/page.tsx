import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Check } from 'lucide-react'
import { AutoScaleSheet } from '@/components/ui/AutoScaleSheet'
import { TemplateCard } from '@/components/landing/TemplateCard'
import { ButtonLink } from '@/components/ui/Button'
import { SAMPLE_CV } from '@/data/sample-cv'
import { TEMPLATES, getTemplate } from '@/data/templates'
import { buildMetadata } from '@/lib/seo'

type Params = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return TEMPLATES.map((template) => ({ slug: template.slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const template = getTemplate(slug)
  if (!template) return buildMetadata({ title: 'Modèle introuvable', description: '', path: '/modeles' })

  return buildMetadata({
    title: `Modèle de CV ${template.name} — ${template.tagline}`,
    description: template.description,
    path: `/modeles/${template.slug}`,
    keywords: [`modèle CV ${template.name}`, ...template.bestFor],
  })
}

export default async function TemplateDetailPage({ params }: Params) {
  const { slug } = await params
  const template = getTemplate(slug)
  if (!template) notFound()

  const data = { ...SAMPLE_CV, settings: { ...SAMPLE_CV.settings, template: template.id, theme: template.defaultTheme } }
  const others = TEMPLATES.filter((t) => t.id !== template.id)

  return (
    <>
      <section className="border-b border-cloud-300 bg-cloud">
        <div className="container-content py-10 sm:py-14">
          <Link
            href="/modeles"
            className="inline-flex items-center gap-2 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
          >
            <ArrowLeft size={15} />
            Tous les modèles
          </Link>

          <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_1.05fr] lg:items-start">
            <div className="lg:sticky lg:top-24">
              <div
                className="overflow-hidden rounded-xl border border-cloud-300 bg-white shadow-float"
                style={{ aspectRatio: '794 / 1123' }}
              >
                <AutoScaleSheet data={data} rounded={11} />
              </div>
            </div>

            <div>
              <p className="eyebrow mb-3">{template.tagline}</p>
              <h1 className="title-xl text-ink">Modèle de CV {template.name}</h1>
              <p className="prose-muted mt-5">{template.description}</p>

              <dl className="mt-8 grid gap-px overflow-hidden rounded-xl border border-cloud-300 bg-cloud-300 sm:grid-cols-2">
                <div className="bg-white p-5">
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                    Lisibilité ATS
                  </dt>
                  <dd className="mt-1.5 text-2xl font-extrabold text-ink">
                    {template.atsScore}
                    <span className="text-base font-semibold text-ink-muted">/100</span>
                  </dd>
                </div>
                <div className="bg-white p-5">
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                    Format
                  </dt>
                  <dd className="mt-1.5 text-2xl font-extrabold text-ink">
                    A4<span className="text-base font-semibold text-ink-muted"> · 1 page</span>
                  </dd>
                </div>
              </dl>

              <h2 className="mt-10 text-[15px] font-bold text-ink">Recommandé pour</h2>
              <ul className="mt-3 space-y-2">
                {template.bestFor.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-ink-muted">
                    <Check size={16} className="mt-0.5 shrink-0 text-ink" />
                    {item}
                  </li>
                ))}
              </ul>

              <h2 className="mt-8 text-[15px] font-bold text-ink">Sections incluses</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {template.sections.map((section) => (
                  <span
                    key={section}
                    className="rounded-full border border-cloud-400 bg-white px-3 py-1.5 text-xs font-semibold capitalize text-ink-muted"
                  >
                    {SECTION_LABELS[section] ?? section}
                  </span>
                ))}
              </div>

              <div className="mt-10 flex flex-wrap gap-3">
                <ButtonLink href={`/editeur?modele=${template.id}`} size="lg">
                  Utiliser ce modèle
                </ButtonLink>
                <ButtonLink href="/tarifs" variant="outline" size="lg">
                  Voir les tarifs
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-content py-16 sm:py-20">
        <h2 className="title-lg text-ink">Les autres modèles</h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {others.map((other) => (
            <TemplateCard key={other.id} template={other} />
          ))}
        </div>
      </section>
    </>
  )
}

const SECTION_LABELS: Record<string, string> = {
  profile: 'Profil',
  experiences: 'Expériences',
  educations: 'Formations',
  skills: 'Compétences',
  languages: 'Langues',
  awards: 'Distinctions',
  references: 'Références',
  hobbies: 'Centres d’intérêt',
}
