import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { AutoScaleSheet } from '@/components/ui/AutoScaleSheet'
import { SAMPLE_CV } from '@/data/sample-cv'
import type { TemplateMeta } from '@/lib/types'
import { cn } from '@/lib/utils'

export function TemplateCard({
  template,
  className,
}: {
  template: TemplateMeta
  className?: string
}) {
  const data = {
    ...SAMPLE_CV,
    settings: { ...SAMPLE_CV.settings, template: template.id, theme: template.defaultTheme },
  }

  return (
    <article className={cn('group relative flex flex-col', className)}>
      <div
        className="relative overflow-hidden rounded-xl border border-cloud-300 bg-white shadow-card transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-float"
        style={{ aspectRatio: '794 / 1123' }}
      >
        <AutoScaleSheet data={data} rounded={11} lazy />
        {/* Voile au survol : la carte entière est cliquable. */}
        <span className="absolute inset-0 flex items-end justify-center bg-navy-900/0 p-4 transition-colors duration-300 group-hover:bg-navy-900/45">
          <span className="translate-y-2 rounded-full bg-white px-4 py-2 text-[12px] font-semibold text-ink opacity-0 shadow-card transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            Voir le modèle
          </span>
        </span>
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-bold text-ink">
            {/* Lien étendu : il couvre toute la carte grâce au pseudo-élément. */}
            <Link
              href={`/modeles/${template.slug}`}
              className="rounded after:absolute after:inset-0 after:content-['']"
            >
              Modèle {template.name}
            </Link>
            <span className="ml-2 text-[13px] font-medium text-ink-muted">{template.tagline}</span>
          </h3>
          <p className="mt-1 text-[13px] text-ink-muted">Lisibilité ATS · {template.atsScore}/100</p>
        </div>
        <Link
          href={`/editeur?modele=${template.id}`}
          className="relative z-10 mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cloud-400 text-ink transition-colors hover:border-navy-700 hover:bg-navy-700 hover:text-white"
          aria-label={`Utiliser le modèle ${template.name}`}
          title={`Utiliser le modèle ${template.name}`}
        >
          <ArrowRight size={15} />
        </Link>
      </div>
    </article>
  )
}
