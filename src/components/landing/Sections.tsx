import Link from 'next/link'
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  FileDown,
  Languages,
  LayoutTemplate,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Wifi,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ButtonLink } from '@/components/ui/Button'
import { TemplateCard } from '@/components/landing/TemplateCard'
import { AutoScaleLetter } from '@/components/ui/AutoScaleLetter'
import { TEMPLATES } from '@/data/templates'
import { PAIEMENT, prixLisible } from '@/lib/paiement'
import { FAQ, FEATURES, GUARANTEES, OFFRE, STATS, STEPS } from '@/data/marketing'
import { cn } from '@/lib/utils'

const ICONS: Record<string, LucideIcon> = {
  LayoutTemplate,
  ScanLine,
  Wifi,
  FileDown,
  Languages,
  ShieldCheck,
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  variant = 'light',
  className,
}: {
  eyebrow?: string
  title: string
  description?: string
  align?: 'left' | 'center'
  /** « dark » : titre posé sur un fond bleu nuit. */
  variant?: 'light' | 'dark'
  className?: string
}) {
  const dark = variant === 'dark'
  return (
    <div className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center', className)}>
      {eyebrow ? (
        <p className={cn('eyebrow mb-3', dark && 'text-azur-300')}>{eyebrow}</p>
      ) : null}
      <h2 className={cn('title-lg', dark ? 'text-white' : 'text-ink')}>{title}</h2>
      {description ? (
        <p className={cn('mt-4', dark ? 'text-[15px] leading-relaxed text-azur-200 sm:text-base' : 'prose-muted')}>
          {description}
        </p>
      ) : null}
    </div>
  )
}

export function StatsBar() {
  return (
    <section className="bg-navy-800">
      <div className="container-content grid grid-cols-2 divide-white/10 py-8 sm:grid-cols-4 sm:divide-x">
        {STATS.map((stat) => (
          <div key={stat.label} className="px-2 py-3 text-center">
            <p className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              {stat.value}
            </p>
            <p className="mt-1 text-[13px] text-azur-200">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export function Features() {
  return (
    <section className="bg-navy-glow py-20 sm:py-28" id="atouts">
      <div className="container-content">
      <SectionHeading
        variant="dark"
        eyebrow="Pourquoi IDJÔ CV"
        title="Un outil taillé pour le marché de l’emploi ivoirien"
        description="Pas un modèle Word retouché : une plateforme complète qui produit un document propre, lisible par les recruteurs comme par leurs logiciels."
      />

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => {
          const Icon = ICONS[feature.icon] ?? Sparkles
          return (
            <article
              key={feature.title}
              className="glass group p-7 transition-colors duration-300 hover:border-white/25 hover:bg-white/[.1]"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-azur-btn text-white shadow-[0_10px_24px_-10px_rgba(44,124,236,.9)]">
                <Icon size={19} strokeWidth={1.9} />
              </span>
              <h3 className="mt-5 text-[17px] font-bold tracking-[-0.01em] text-white">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-azur-200">{feature.description}</p>
            </article>
          )
        })}
      </div>
      </div>
    </section>
  )
}

export function TemplatesShowcase() {
  return (
    <section className="border-y border-cloud-300 bg-azur-50 py-20 sm:py-28" id="modeles">
      <div className="container-content">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            eyebrow="La bibliothèque"
            title="Huit modèles, une même exigence"
            description="Chaque modèle existe en version photo ou sans photo, et s’adapte automatiquement à la longueur de votre parcours."
          />
          <ButtonLink href="/modeles" variant="outline" size="md" className="shrink-0">
            Voir tous les modèles
            <ArrowUpRight size={16} />
          </ButtonLink>
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {TEMPLATES.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      </div>
    </section>
  )
}

/** Section « Lettre » : cible de l'entrée de menu du même nom. */
export function LetterShowcase() {
  const steps = [
    {
      title: 'L’accroche',
      text: 'Le poste visé, où vous l’avez vu, et ce qui vous rend pertinent — en deux phrases.',
    },
    {
      title: 'La preuve',
      text: 'Deux réalisations chiffrées, choisies parce qu’elles ressemblent au poste.',
    },
    {
      title: 'La projection',
      text: 'Ce que vous comptez apporter dans les six premiers mois.',
    },
  ]

  return (
    <section className="bg-navy-glow py-20 text-white sm:py-28" id="lettre">
      <div className="container-content grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <SectionHeading
            variant="dark"
            eyebrow="La lettre de motivation"
            title="Un CV ne part jamais seul"
            description="Trois paragraphes guidés, la même palette et la même typographie que votre CV, et le même export PDF A4. L’assistant peut même écrire le premier jet à partir de votre CV."
          />

          <ol className="mt-10 space-y-5">
            {steps.map((step, index) => (
              <li key={step.title} className="glass flex gap-4 p-5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-azur-btn text-[13px] font-bold text-white">
                  {index + 1}
                </span>
                <span>
                  <span className="block text-[15px] font-bold text-white">{step.title}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-azur-200">
                    {step.text}
                  </span>
                </span>
              </li>
            ))}
          </ol>

          <div className="mt-9 flex flex-wrap gap-3">
            <ButtonLink
              href="/lettre-de-motivation"
              size="lg"
              className="bg-white text-navy-700 hover:bg-azur-100"
            >
              Écrire ma lettre
              <ArrowRight size={16} />
            </ButtonLink>
            <Link
              href="/conseils/lettre-de-motivation"
              className="inline-flex h-12 items-center justify-center rounded-full border border-white/30 px-7 text-[15px] font-semibold text-white transition-colors hover:bg-white/10 sm:h-14 sm:px-8"
            >
              Lire le guide
            </Link>
          </div>
        </div>

        <Link
          href="/lettre-de-motivation"
          className="group relative mx-auto block w-full max-w-[420px] overflow-hidden rounded-xl shadow-float transition-transform duration-300 hover:-translate-y-1"
          style={{ aspectRatio: '794 / 1123' }}
          aria-label="Ouvrir l’éditeur de lettre de motivation"
        >
          {/* Aperçu en bleu roi, la teinte de la charte du site. */}
          <AutoScaleLetter theme="azur" rounded={11} lazy />
          <span className="absolute inset-0 flex items-end justify-center bg-navy-900/0 p-5 transition-colors duration-300 group-hover:bg-navy-900/40">
            <span className="translate-y-2 rounded-full bg-white px-4 py-2 text-[12px] font-semibold text-ink opacity-0 shadow-card transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              Ouvrir l’éditeur de lettre
            </span>
          </span>
        </Link>
      </div>
    </section>
  )
}

export function Steps() {
  return (
    <section className="container-content py-20 sm:py-28" id="methode">
      <SectionHeading
        eyebrow="La méthode"
        title="De la page blanche au PDF, en quatre étapes"
      />
      <ol className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step) => (
          <li key={step.number} className="relative border-t-2 border-azur-500 pt-5">
            <span className="font-display text-4xl leading-none text-azur-300">{step.number}</span>
            <h3 className="mt-4 text-[17px] font-bold text-ink">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{step.description}</p>
          </li>
        ))}
      </ol>
      <div className="mt-12">
        <ButtonLink href="/editeur" size="lg">
          Créer mon CV maintenant
        </ButtonLink>
      </div>
    </section>
  )
}

/**
 * Section « Garanties ». Elle remplace les témoignages : aucun avis ne sera
 * affiché tant qu'il ne viendra pas d'un utilisateur réel et consentant.
 */
export function Guarantees() {
  return (
    <section className="border-y border-cloud-300 bg-azur-50 py-20 sm:py-28" id="garanties">
      <div className="container-content">
        <SectionHeading
          eyebrow="Nos engagements"
          title="Ce que vous obtenez, écrit noir sur blanc"
          description="Pas de promesse invérifiable : voici précisément ce que la plateforme fait, et ce qu’elle ne fait pas."
          align="center"
        />
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {GUARANTEES.map((item) => (
            <article
              key={item.title}
              className="flex h-full flex-col rounded-2xl border border-azur-100 bg-white p-7 shadow-card"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-azur-btn text-white">
                <ShieldCheck size={18} strokeWidth={1.9} />
              </span>
              <h3 className="mt-5 text-[15px] font-bold text-ink">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{item.description}</p>
            </article>
          ))}
        </div>
        <p className="mt-10 text-center text-[13px] text-ink-muted">
          Vous avez utilisé IDJÔ CV et décroché un entretien ?{' '}
          <Link href="/contact" className="font-semibold text-navy-700 underline underline-offset-2">
            Racontez-nous
          </Link>{' '}
          — nous publierons les retours réels, avec votre accord.
        </p>
      </div>
    </section>
  )
}

export function Pricing({ compact = false }: { compact?: boolean }) {
  return (
    <section className={cn('container-content', compact ? 'py-14' : 'py-20 sm:py-28')} id="tarifs">
      <SectionHeading
        eyebrow="Tarif"
        title={`Gratuit pour composer, ${prixLisible()} pour emporter`}
        description={`Tout l’éditeur est ouvert sans payer : modèles, couleurs, assistant, analyse ATS, lettre. Le règlement n’intervient qu’au téléchargement du PDF — une fois, pour ${PAIEMENT.dureeJours} jours.`}
        align="center"
      />

      <article className="relative mx-auto mt-14 flex max-w-md flex-col rounded-2xl border border-azur-500 bg-navy-glow p-8 text-white shadow-glow">
        <h3 className="text-lg font-bold text-white">{OFFRE.name}</h3>
        <p className="mt-1 text-[13px] text-azur-200">{OFFRE.description}</p>

        <p className="mt-7 text-3xl font-extrabold tracking-[-0.03em] text-white">
          {OFFRE.priceLabel}
        </p>
        <p className="mt-1 text-xs text-azur-300">{OFFRE.period}</p>

        <ul className="mt-7 flex-1 space-y-3">
          {OFFRE.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm">
              <Check size={16} className="mt-0.5 shrink-0 text-azur-300" />
              <span className="text-azur-100">{feature}</span>
            </li>
          ))}
        </ul>

        <ButtonLink
          href={OFFRE.href}
          variant="secondary"
          size="md"
          className="mt-8 w-full bg-white text-navy-700 hover:bg-azur-100"
        >
          {OFFRE.cta}
        </ButtonLink>
      </article>

      <p className="mx-auto mt-8 max-w-2xl text-center text-[13px] leading-relaxed text-ink-muted">
        Paiement par Wave, Orange Money, MTN MoMo, Moov Money ou carte bancaire, en francs CFA.
        Paiement unique : aucun abonnement, aucun prélèvement automatique.
      </p>
    </section>
  )
}

export function FaqSection() {
  return (
    <section className="container-content py-20 sm:py-28" id="questions">
      <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <SectionHeading
          eyebrow="Questions fréquentes"
          title="Tout ce qu’il faut savoir avant de commencer"
          description="Une question qui n’apparaît pas ici ? Écrivez-nous, on répond sous 24 heures."
        />
        <div className="divide-y divide-cloud-300 border-y border-cloud-300">
          {FAQ.map((item) => (
            <details key={item.question} className="group py-5">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-[15px] font-semibold text-ink marker:hidden">
                {item.question}
                <span className="mt-1 shrink-0 text-ink-muted transition-transform duration-200 group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-muted">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

export function FinalCta() {
  return (
    <section className="bg-navy-glow py-20 text-white sm:py-24" id="commencer">
      <div className="container-content text-center">
        <p className="eyebrow mb-4 text-white/50">Prêt à postuler</p>
        <h2 className="mx-auto max-w-3xl text-3xl font-extrabold leading-[1.08] tracking-[-0.03em] sm:text-5xl">
          Votre prochain entretien commence par un bon CV.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-azur-200">
          Choisissez un modèle, remplissez vos informations, téléchargez votre PDF. Gratuit pour
          commencer, sans compte.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <ButtonLink
            href="/editeur"
            size="lg"
            className="bg-white text-navy-700 hover:bg-azur-100"
          >
            Créer mon CV gratuitement
          </ButtonLink>
          <Link
            href="/modeles"
            className="inline-flex h-12 items-center justify-center rounded-full border border-white/30 px-7 text-[15px] font-semibold text-white transition-colors hover:bg-white/10 sm:h-14 sm:px-8"
          >
            Parcourir les modèles
          </Link>
        </div>
      </div>
    </section>
  )
}
