'use client'

import { useMemo } from 'react'
import { AlertTriangle, Check, Info, X } from 'lucide-react'
import { analyseCv, scoreLabel, type AtsCheck } from '@/lib/ats'
import { useCvStore } from '@/lib/store'
import { cn } from '@/lib/utils'

const SECTIONS: { id: AtsCheck['section']; label: string }[] = [
  { id: 'contact', label: 'Coordonnées' },
  { id: 'contenu', label: 'Contenu' },
  { id: 'redaction', label: 'Rédaction' },
  { id: 'lisibilite', label: 'Lisibilité' },
]

/** Pastille de score affichée dans la barre d'outils de l'éditeur. */
export function AtsBadge({ onClick, open }: { onClick: () => void; open: boolean }) {
  const data = useCvStore((s) => s.data)
  const report = useMemo(() => analyseCv(data), [data])

  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      className={cn(
        'inline-flex h-9 items-center gap-2 rounded-full border px-3 text-[13px] font-semibold transition-colors sm:h-10 sm:px-4',
        open ? 'border-ink bg-ink text-white' : 'border-cloud-400 bg-white text-ink hover:border-ink',
      )}
      title="Analyse ATS de votre CV"
    >
      <span className="relative flex h-5 w-5 items-center justify-center">
        <svg viewBox="0 0 24 24" className="h-5 w-5 -rotate-90">
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.2" />
          <circle
            cx="12"
            cy="12"
            r="10"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${(report.score / 100) * 62.8} 62.8`}
          />
        </svg>
      </span>
      <span className="tabular-nums">{report.score}</span>
      <span className="hidden sm:inline">/100</span>
    </button>
  )
}

/** Panneau détaillé : liste des vérifications et conseils. */
export function AtsPanel({ onClose }: { onClose: () => void }) {
  const data = useCvStore((s) => s.data)
  const report = useMemo(() => analyseCv(data), [data])

  return (
    <aside
      className="no-print absolute inset-y-0 right-0 z-30 flex w-full max-w-[380px] flex-col border-l border-cloud-300 bg-white shadow-float lg:static lg:shadow-none"
      aria-label="Analyse ATS"
    >
      <header className="flex items-start justify-between gap-3 border-b border-cloud-300 p-5">
        <div>
          <h2 className="text-[15px] font-bold text-ink">Analyse de votre CV</h2>
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">
            {report.passed} points validés sur {report.total}. Analyse effectuée dans votre
            navigateur, rien n’est envoyé.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="-mr-1 -mt-1 rounded-full p-2 text-ink-muted transition-colors hover:bg-cloud-200 hover:text-ink"
          aria-label="Fermer l’analyse"
        >
          <X size={16} />
        </button>
      </header>

      <div className="border-b border-cloud-300 px-5 py-5">
        <div className="flex items-end justify-between">
          <span className="text-4xl font-extrabold tabular-nums tracking-tight text-ink">
            {report.score}
            <span className="text-lg font-bold text-ink-muted">/100</span>
          </span>
          <span className="pb-1.5 text-[13px] font-semibold text-ink-muted">
            {scoreLabel(report.score)}
          </span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-cloud-300">
          <div
            className="h-full rounded-full bg-ink transition-all duration-500"
            style={{ width: `${report.score}%` }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {SECTIONS.map((section) => {
          const items = report.checks.filter((c) => c.section === section.id)
          if (!items.length) return null
          return (
            <section key={section.id} className="border-b border-cloud-200 px-5 py-4">
              <h3 className="eyebrow mb-3">{section.label}</h3>
              <ul className="space-y-3">
                {items.map((check) => (
                  <li key={check.id} className="flex gap-3">
                    <StatusIcon status={check.status} />
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-ink">{check.label}</p>
                      <p className="mt-0.5 text-[12px] leading-relaxed text-ink-muted">
                        {check.detail}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
        <p className="px-5 py-5 text-[11px] leading-relaxed text-neutral-400">
          Ces contrôles reprennent le fonctionnement des logiciels de tri de candidatures :
          structure lisible, texte réel, sections standard, dates cohérentes et résultats
          mesurables.
        </p>
      </div>
    </aside>
  )
}

function StatusIcon({ status }: { status: AtsCheck['status'] }) {
  const common = 'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full'
  if (status === 'ok') {
    return (
      <span className={cn(common, 'bg-ink text-white')}>
        <Check size={12} strokeWidth={3} />
      </span>
    )
  }
  if (status === 'warn') {
    return (
      <span className={cn(common, 'bg-cloud-300 text-ink')}>
        <AlertTriangle size={12} strokeWidth={2.5} />
      </span>
    )
  }
  return (
    <span className={cn(common, 'border border-ink text-ink')}>
      <Info size={12} strokeWidth={2.5} />
    </span>
  )
}
