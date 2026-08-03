'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Menu d'ancres de la page d'accueil. Les libellés reprennent le parcours du
 * visiteur : pourquoi, quoi, comment, preuve, prix, questions.
 */
export const SECTIONS = [
  { id: 'accueil', label: 'Accueil' },
  { id: 'atouts', label: 'Atouts' },
  { id: 'modeles', label: 'Modèles' },
  { id: 'lettre', label: 'Lettre' },
  { id: 'methode', label: 'Méthode' },
  { id: 'garanties', label: 'Garanties' },
  { id: 'tarifs', label: 'Tarifs' },
  { id: 'questions', label: 'Questions' },
] as const

/** Renvoie l'identifiant de la section actuellement à l'écran. */
export function useActiveSection(enabled: boolean) {
  const [active, setActive] = useState<string>('accueil')

  useEffect(() => {
    if (!enabled) return

    const targets = SECTIONS.map((section) => document.getElementById(section.id)).filter(
      (node): node is HTMLElement => Boolean(node),
    )
    if (!targets.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActive(visible.target.id)
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 1] },
    )

    targets.forEach((target) => observer.observe(target))
    return () => observer.disconnect()
  }, [enabled])

  return active
}

export function SectionNav({
  onHome,
  overHero,
  active,
  onNavigate,
  className,
}: {
  onHome: boolean
  overHero: boolean
  active: string
  onNavigate?: () => void
  className?: string
}) {
  const go = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    if (!onHome) return
    event.preventDefault()
    const target = id === 'accueil' ? document.body : document.getElementById(id)
    target?.scrollIntoView({ behavior: 'smooth', block: id === 'accueil' ? 'start' : 'start' })
    if (id === 'accueil') window.scrollTo({ top: 0, behavior: 'smooth' })
    onNavigate?.()
  }

  return (
    <nav
      className={cn('flex items-center gap-0.5 lg:gap-1', className)}
      aria-label="Sections du site"
    >
      {SECTIONS.map((section) => {
        const current = onHome && active === section.id
        return (
          <a
            key={section.id}
            href={onHome ? `#${section.id}` : `/#${section.id}`}
            onClick={(event) => go(event, section.id)}
            aria-current={current ? 'true' : undefined}
            className={cn(
              'shrink-0 rounded-full px-2.5 py-1.5 text-[13px] font-medium transition-colors lg:px-3.5 lg:py-2 lg:text-sm',
              overHero
                ? current
                  ? 'bg-white/20 text-white'
                  : 'text-white/85 hover:bg-white/15 hover:text-white'
                : current
                  ? 'bg-azur-100 text-navy-700'
                  : 'text-ink-muted hover:bg-azur-50 hover:text-navy-700',
            )}
          >
            {section.label}
          </a>
        )
      })}
    </nav>
  )
}
