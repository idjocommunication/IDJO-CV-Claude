import type { Metadata } from 'next'
import { TemplateCard } from '@/components/landing/TemplateCard'
import { FinalCta } from '@/components/landing/Sections'
import { ButtonLink } from '@/components/ui/Button'
import { TEMPLATES } from '@/data/templates'
import { buildMetadata } from '@/lib/seo'

export const metadata: Metadata = buildMetadata({
  title: 'Modèles de CV professionnels à remplir',
  description:
    "Huit modèles de CV modernes et compatibles ATS, conçus pour le marché de l'emploi ivoirien. Remplissez en ligne et téléchargez votre PDF A4.",
  path: '/modeles',
  keywords: ['modèle de CV gratuit', 'CV à remplir', 'CV moderne 2026'],
})

export default function TemplatesPage() {
  return (
    <>
      <section className="border-b border-cloud-300 bg-cloud">
        <div className="container-content py-16 sm:py-24">
          <p className="eyebrow mb-3">Bibliothèque</p>
          <h1 className="title-xl max-w-3xl text-ink">
            Des modèles de CV pensés pour être lus, pas seulement regardés
          </h1>
          <p className="prose-muted mt-5 max-w-2xl">
            Chaque mise en page se décline en vingt-quatre palettes, en sept doses de couleur et en
            neuf typographies : le CV s’adapte à votre secteur sans jamais voler la vedette à votre
            parcours. Modifiable en ligne, sans logiciel et sans compte.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/editeur" size="lg">
              Créer mon CV
            </ButtonLink>
            <ButtonLink href="/conseils" variant="outline" size="lg">
              Lire les conseils
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="container-content py-16 sm:py-20">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {TEMPLATES.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>

        <div className="mt-20 overflow-hidden rounded-2xl border border-cloud-300">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Comparatif des modèles de CV IDJÔ CV</caption>
            <thead className="bg-cloud text-[11px] uppercase tracking-[0.12em] text-ink-muted">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">Modèle</th>
                <th scope="col" className="px-5 py-3 font-semibold">Idéal pour</th>
                <th scope="col" className="hidden px-5 py-3 font-semibold sm:table-cell">Sections</th>
                <th scope="col" className="px-5 py-3 font-semibold">ATS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cloud-300">
              {TEMPLATES.map((template) => (
                <tr key={template.id} className="align-top">
                  <th scope="row" className="px-5 py-4 font-bold text-ink">
                    {template.name}
                    <span className="block text-[12px] font-medium text-ink-muted">
                      {template.tagline}
                    </span>
                  </th>
                  <td className="px-5 py-4 text-ink-muted">{template.bestFor.join(', ')}</td>
                  <td className="hidden px-5 py-4 text-ink-muted sm:table-cell">
                    {template.sections.length} sections
                  </td>
                  <td className="px-5 py-4 font-semibold text-ink">{template.atsScore}/100</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <FinalCta />
    </>
  )
}
