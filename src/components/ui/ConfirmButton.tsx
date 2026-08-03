'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Bouton à confirmation intégrée.
 *
 * Remplace `window.confirm`, qui reste sans effet dès que la page est affichée
 * dans un cadre intégré (démo, webview, aperçu) : le bouton semblait alors ne
 * rien faire. Ici la confirmation fait partie de l'interface, donc elle
 * fonctionne partout.
 */
export function ConfirmButton({
  label,
  confirmLabel,
  icon,
  onConfirm,
  className,
  confirmClassName,
  title,
}: {
  label: ReactNode
  /** Texte affiché pendant les quelques secondes de confirmation. */
  confirmLabel: string
  icon?: ReactNode
  onConfirm: () => void
  className?: string
  confirmClassName?: string
  title?: string
}) {
  const [asking, setAsking] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), [])

  const cancelSoon = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setAsking(false), 4000)
  }

  return (
    <button
      type="button"
      title={title}
      onClick={() => {
        if (!asking) {
          setAsking(true)
          cancelSoon()
          return
        }
        if (timer.current) clearTimeout(timer.current)
        setAsking(false)
        onConfirm()
      }}
      onBlur={() => setAsking(false)}
      className={cn(className, asking && confirmClassName)}
    >
      {asking ? null : icon}
      {asking ? confirmLabel : label}
    </button>
  )
}
