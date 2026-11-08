import { cn } from '@/lib/utils'

/**
 * Logo « idjô CV ».
 *
 * Les formes viennent de `public/logo-idjo-cv.svg` (le « ô » seul de
 * `public/logo-o.svg`), vectorisées d'après le logo fourni par IDJÔ. Elles
 * servent de masque CSS (`.logo-idjo-cv` et `.logo-o` dans `globals.css`) sur
 * un fond `currentColor` : un seul fichier, mis en cache une fois, pour le
 * logo noir sur fond clair comme pour le logo blanc sur fond bleu nuit.
 */
export function Logo({
  className,
  inverted = false,
  compact = false,
}: {
  className?: string
  inverted?: boolean
  /** Sur téléphone, le « ô » seul : la barre d'outils de l'éditeur a besoin
   *  de toute la largeur. */
  compact?: boolean
}) {
  return (
    <span
      role="img"
      aria-label="IDJÔ CV"
      className={cn('inline-flex items-center', inverted ? 'text-white' : 'text-ink', className)}
    >
      {compact ? <span aria-hidden className="logo-o block h-9 bg-current sm:hidden" /> : null}
      <span
        aria-hidden
        className={cn('logo-idjo-cv block h-8 bg-current', compact && 'hidden sm:block')}
      />
    </span>
  )
}
