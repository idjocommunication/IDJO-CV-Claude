'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { ButtonLink } from '@/components/ui/Button'
import { Logo } from '@/components/site/Logo'
import { SECTIONS, SectionNav, useActiveSection } from '@/components/site/SectionNav'
import { cn } from '@/lib/utils'

const FULLSCREEN = ['/editeur', '/lettre-de-motivation']

/** Pages du site, proposées hors accueil et dans le menu mobile. */
const PAGES = [
  { href: '/modeles', label: 'Modèles' },
  { href: '/exemples', label: 'Exemples' },
  { href: '/lettre-de-motivation', label: 'Lettre' },
  { href: '/tarifs', label: 'Tarifs' },
  { href: '/conseils', label: 'Conseils CV' },
  { href: '/contact', label: 'Contact' },
]

export function SiteHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const onHome = pathname === '/'
  const activeSection = useActiveSection(onHome)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setOpen(false), [pathname])

  // L'éditeur dispose de sa propre barre d'outils plein écran.
  if (FULLSCREEN.some((route) => pathname?.startsWith(route))) return null

  // Sur l'accueil, l'en-tête flotte au-dessus du hero coloré tant qu'on n'a
  // pas défilé : fond transparent et texte blanc.
  // Menu mobile ouvert : l'en-tête redevient opaque, sinon le logo blanc
  // se perdrait sur le panneau blanc.
  const overHero = pathname === '/' && !scrolled && !open

  return (
    <header
      className={cn(
        'no-print sticky top-0 z-50 w-full border-b transition-colors duration-300',
        overHero
          ? '-mb-16 border-transparent bg-transparent sm:-mb-[72px]'
          : scrolled
            ? 'border-cloud-300 bg-white/90 backdrop-blur-md'
            : 'border-transparent bg-white',
      )}
    >
      <div className="container-content flex h-16 items-center justify-between gap-6 sm:h-[72px]">
        <Link href="/" className="shrink-0" aria-label="IDJÔ CV — accueil">
          <Logo inverted={overHero} />
        </Link>

        {onHome ? (
          <SectionNav
            onHome
            overHero={overHero}
            active={activeSection}
            className="no-scrollbar hidden min-w-0 flex-1 justify-center overflow-x-auto md:flex"
          />
        ) : (
          <nav
            className="no-scrollbar hidden min-w-0 flex-1 items-center justify-center gap-0.5 overflow-x-auto md:flex lg:gap-1"
            aria-label="Navigation principale"
          >
            {PAGES.map((item) => {
              const active = pathname === item.href || pathname?.startsWith(`${item.href}/`)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'shrink-0 rounded-full px-2.5 py-1.5 text-[13px] font-medium transition-colors lg:px-3.5 lg:py-2 lg:text-sm',
                    active
                      ? 'bg-azur-100 text-navy-700'
                      : 'text-ink-muted hover:bg-azur-50 hover:text-navy-700',
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        )}

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <ButtonLink
            href="/modeles"
            variant="ghost"
            size="sm"
            className={overHero ? 'text-white hover:bg-white/15' : undefined}
          >
            Voir les modèles
          </ButtonLink>
          <ButtonLink
            href="/editeur"
            size="sm"
            className={overHero ? 'bg-white text-ink hover:bg-white/90' : undefined}
          >
            Créer mon CV
          </ButtonLink>
        </div>

        <button
          type="button"
          className={cn(
            '-mr-2 inline-flex h-10 w-10 items-center justify-center rounded-full lg:hidden',
            overHero ? 'text-white' : 'text-ink',
          )}
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open ? (
        <div className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-cloud-300 bg-white lg:hidden">
          <div className="container-content flex flex-col py-4">
            <p className="eyebrow mb-2">Sections</p>
            <div className="flex flex-wrap gap-2">
              {SECTIONS.map((section) => (
                <a
                  key={section.id}
                  href={onHome ? `#${section.id}` : `/#${section.id}`}
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-azur-50 px-3.5 py-2 text-sm font-medium text-navy-700"
                >
                  {section.label}
                </a>
              ))}
            </div>

            <p className="eyebrow mb-2 mt-6">Pages</p>
            <nav className="flex flex-col" aria-label="Navigation mobile">
              {PAGES.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="border-b border-cloud-200 py-3 text-[15px] font-medium text-ink last:border-0"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <ButtonLink href="/editeur" className="mt-5 w-full" size="md">
              Créer mon CV
            </ButtonLink>
            <ButtonLink
              href="/lettre-de-motivation"
              variant="outline"
              className="mt-2.5 w-full"
              size="md"
            >
              Écrire ma lettre
            </ButtonLink>
          </div>
        </div>
      ) : null}
    </header>
  )
}
