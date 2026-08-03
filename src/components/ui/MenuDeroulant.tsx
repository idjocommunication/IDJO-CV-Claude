'use client'

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Bouton à menu déroulant des barres d'habillage.
 *
 * Les listes de modèles, de palettes et de polices sont trop longues pour
 * tenir à plat au-dessus de l'aperçu : elles se replient ici derrière un
 * bouton qui rappelle le choix en cours. Le menu se ferme au clic extérieur,
 * à la touche Échap, et sur demande du contenu (`fermer`).
 */
export function MenuDeroulant({
  label,
  valeur,
  vignette,
  largeur = 268,
  align = 'left',
  children,
}: {
  /** Intitulé fixe, à gauche du séparateur. */
  label: string
  /** Choix en cours, rappelé sur le bouton. */
  valeur: string
  /** Pastille facultative affichée avant l'intitulé (couleur, icône). */
  vignette?: ReactNode
  largeur?: number
  align?: 'left' | 'right'
  children: (fermer: () => void) => ReactNode
}) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const id = useId()

  useEffect(() => {
    if (!open) return
    const onClick = (event: MouseEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative shrink-0" ref={box}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? id : undefined}
        className="inline-flex items-center gap-2 rounded-full border border-cloud-400 bg-white py-1.5 pl-2.5 pr-2.5 text-[12px] font-semibold text-ink transition-colors hover:border-ink"
      >
        {vignette}
        <span className="whitespace-nowrap">
          {label} <span className="text-ink-muted">·</span> {valeur}
        </span>
        <ChevronDown size={14} className={cn('transition-transform', open && 'rotate-180')} />
      </button>

      {open ? (
        <div
          id={id}
          role="menu"
          className={cn(
            'absolute top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-cloud-300 bg-white py-1.5 shadow-float',
            align === 'right' ? 'right-0' : 'left-0',
          )}
          style={{ width: largeur }}
        >
          {children(() => setOpen(false))}
        </div>
      ) : null}
    </div>
  )
}

/** Entrée de menu à choix unique : coche, intitulé et précision facultative. */
export function OptionMenu({
  choisi,
  titre,
  detail,
  vignette,
  onClick,
}: {
  choisi: boolean
  titre: ReactNode
  detail?: ReactNode
  /** Aperçu facultatif à droite de l'intitulé (pastille, échantillon). */
  vignette?: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={choisi}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 px-3.5 py-2 text-left transition-colors',
        choisi ? 'bg-cloud' : 'hover:bg-cloud-200',
      )}
    >
      <Check
        size={14}
        strokeWidth={3}
        className={cn('shrink-0', choisi ? 'text-ink' : 'text-transparent')}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold text-ink">{titre}</span>
        {detail ? <span className="block text-[11px] text-ink-muted">{detail}</span> : null}
      </span>
      {vignette}
    </button>
  )
}
