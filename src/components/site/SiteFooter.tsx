'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import { Logo } from '@/components/site/Logo'
import { TEMPLATES } from '@/data/templates'
import { SITE, whatsappLink } from '@/lib/seo'

const FULLSCREEN = ['/editeur', '/lettre-de-motivation']

const COLUMNS = [
  {
    title: 'Produit',
    links: [
      { href: '/editeur', label: 'Créer un CV' },
      { href: '/modeles', label: 'Modèles de CV' },
      { href: '/exemples', label: 'Exemples par métier' },
      { href: '/lettre-de-motivation', label: 'Lettre de motivation' },
      { href: '/tarifs', label: 'Tarifs' },
      { href: '/conseils', label: 'Conseils & guides' },
    ],
  },
  {
    title: 'Ressources',
    links: [
      { href: '/conseils/reussir-son-cv-en-cote-divoire', label: 'Réussir son CV en Côte d’Ivoire' },
      { href: '/conseils/cv-compatible-ats', label: 'Passer les filtres ATS' },
      { href: '/conseils/lettre-de-motivation', label: 'Lettre de motivation' },
      { href: '/conseils/premier-emploi', label: 'CV premier emploi' },
    ],
  },
  {
    title: 'Entreprise',
    links: [
      { href: '/contact', label: 'Nous contacter' },
      { href: '/legal/mentions-legales', label: 'Mentions légales' },
      { href: '/legal/confidentialite', label: 'Confidentialité' },
      { href: '/legal/cgu', label: 'CGU' },
    ],
  },
]

export function SiteFooter() {
  const pathname = usePathname()
  const whatsapp = whatsappLink('Bonjour, je vous écris depuis IDJÔ CV.')

  // L'éditeur occupe tout l'écran : pas de pied de page.
  if (FULLSCREEN.some((route) => pathname?.startsWith(route))) return null

  return (
    <footer className="no-print bg-navy-900 text-white">
      <div className="container-content py-14 sm:py-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo inverted />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-azur-200">
              La plateforme de création de CV pensée pour les candidats de Côte d’Ivoire et
              d’Afrique francophone. Modèles professionnels, export PDF illimité.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-azur-200">
              <li className="flex items-center gap-2.5">
                <Mail size={15} className="shrink-0 text-azur-400" />
                <a href={`mailto:${SITE.email}`} className="hover:text-white">
                  {SITE.email}
                </a>
              </li>
              {SITE.phone ? (
                <li className="flex items-center gap-2.5">
                  <Phone size={15} className="shrink-0 text-azur-400" />
                  <a href={`tel:${SITE.phone.replace(/\s/g, '')}`} className="hover:text-white">
                    {SITE.phone}
                  </a>
                </li>
              ) : null}
              {whatsapp ? (
                <li className="flex items-center gap-2.5">
                  <MessageCircle size={15} className="shrink-0 text-azur-400" />
                  <a href={whatsapp} target="_blank" rel="noreferrer" className="hover:text-white">
                    Nous écrire sur WhatsApp
                  </a>
                </li>
              ) : null}
              <li className="flex items-center gap-2.5">
                <MapPin size={15} className="shrink-0 text-azur-400" />
                Abidjan, Côte d’Ivoire
              </li>
            </ul>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
                {column.title}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-azur-200 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-white/10 pt-8">
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {TEMPLATES.map((template) => (
              <Link
                key={template.id}
                href={`/modeles/${template.slug}`}
                className="text-xs text-azur-300/70 transition-colors hover:text-white"
              >
                Modèle de CV {template.name}
              </Link>
            ))}
          </div>
          <p className="mt-6 text-xs text-azur-300/60">
            © {new Date().getFullYear()} IDJÔ CV — Tous droits réservés. Conçu à Abidjan.
          </p>
        </div>
      </div>
    </footer>
  )
}
