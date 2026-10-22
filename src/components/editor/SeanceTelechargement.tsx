'use client'

import { useEffect } from 'react'
import { CheckCircle2, FileCode2, FileDown, Maximize2, Printer } from 'lucide-react'
import { CvSheet } from '@/cv-templates'
import { LetterSheet } from '@/cv-templates/LetterSheet'
import { useCvStore } from '@/lib/store'
import { useLetterStore } from '@/lib/letter'
import { prixLisible } from '@/lib/paiement'
import { PRINT_LABELS, printDocument, type PrintTarget } from '@/lib/print'
import {
  fermerEnGrand,
  lancerTelechargement,
  terminerSeance,
  useTelechargement,
} from '@/lib/telechargement'

/**
 * Fin d'un téléchargement : le client confirme que son PDF est enregistré et
 * revient à l'accueil, ou réessaie sans repayer. La fenêtre ne se ferme pas
 * autrement : c'est elle qui garde en mémoire le téléchargement payé.
 */
export function SeanceTelechargement() {
  const seance = useTelechargement((s) => s.seance)
  if (!seance || seance.essais === 0) return null

  const { cible, payee, bloque, enGrand } = seance

  return (
    <>
      <div className="no-print fixed inset-0 z-[115] flex items-end justify-center bg-navy-900/60 backdrop-blur-sm sm:items-center sm:p-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="seance-titre"
          className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-float sm:rounded-2xl"
        >
          <header className="border-b border-cloud-300 px-6 py-5">
            <h2 id="seance-titre" className="flex items-center gap-2 text-[17px] font-bold text-ink">
              <FileDown size={17} className="text-azur-600" />
              Votre PDF est-il bien enregistré ?
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
              {PRINT_LABELS[cible]}
              {payee ? ` — téléchargement payé (${prixLisible()})` : ''}
            </p>
          </header>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {bloque ? (
              <p className="rounded-xl bg-amber-50 px-4 py-3 text-[13px] leading-relaxed text-amber-900">
                Votre navigateur n’a pas ouvert la fenêtre d’impression. Utilisez l’une des
                solutions ci-dessous.
              </p>
            ) : (
              <p className="rounded-xl bg-cloud px-4 py-3 text-[13px] leading-relaxed text-ink-muted">
                Dans la fenêtre d’impression, choisissez <strong className="text-ink">« Enregistrer
                au format PDF »</strong> comme imprimante, puis enregistrez le fichier sur votre
                appareil.
              </p>
            )}

            <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-muted">
              Ça n’a pas marché ? Réessayez{payee ? ' sans repayer' : ''}
            </p>
            <div className="mt-2 grid gap-2">
              <Essai icone={<Printer size={15} />} onClick={() => lancerTelechargement(cible, 'impression')}>
                Relancer l’impression
              </Essai>
              <Essai icone={<FileCode2 size={15} />} onClick={() => lancerTelechargement(cible, 'fichier')}>
                Télécharger le document (.html), à imprimer en PDF
              </Essai>
              <Essai icone={<Maximize2 size={15} />} onClick={() => lancerTelechargement(cible, 'grand')}>
                Afficher en grand, puis Ctrl+P
              </Essai>
            </div>

            {payee ? (
              <p className="mt-4 text-[12px] leading-relaxed text-ink-muted">
                Votre téléchargement payé reste disponible tant que cette fenêtre est ouverte. Si
                vous rechargez la page, il est considéré comme utilisé.
              </p>
            ) : null}
          </div>

          <footer className="border-t border-cloud-300 px-6 py-4">
            <button
              type="button"
              onClick={terminerSeance}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-azur-btn text-[15px] font-semibold text-white transition-[filter] hover:brightness-110"
            >
              <CheckCircle2 size={17} />
              Oui, mon PDF est enregistré
            </button>
            <p className="mt-2 text-center text-[11.5px] leading-relaxed text-ink-muted">
              Vous revenez alors à l’accueil. Votre CV reste enregistré sur cet appareil
              {payee ? ` : chaque nouveau téléchargement coûte ${prixLisible()}.` : '.'}
            </p>
          </footer>
        </div>
      </div>

      {enGrand ? <ApercuImpression cible={cible} onClose={fermerEnGrand} /> : null}
    </>
  )
}

function Essai({
  icone,
  onClick,
  children,
}: {
  icone: React.ReactNode
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-xl border border-cloud-400 px-4 py-2.5 text-left text-[13px] font-semibold text-ink transition-colors hover:border-azur-400 hover:text-navy-700"
    >
      <span className="text-ink-muted">{icone}</span>
      {children}
    </button>
  )
}

/**
 * Le document en grand, dans la page.
 *
 * Dernier recours universel : quand un navigateur refuse l'impression déclenchée
 * par un bouton, il n'empêche jamais l'utilisateur d'imprimer lui-même la page
 * qu'il a sous les yeux. Les copies `.print-only` étant déjà dans le document,
 * un Ctrl+P depuis cet écran sort exactement le bon PDF.
 */
function ApercuImpression({ cible, onClose }: { cible: PrintTarget; onClose: () => void }) {
  const cv = useCvStore((s) => s.data)
  const letter = useLetterStore((s) => s.data)

  useEffect(() => {
    const precedent = document.body.dataset.print
    document.body.dataset.print = cible
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      if (precedent) document.body.dataset.print = precedent
      window.removeEventListener('keydown', onKey)
    }
  }, [cible, onClose])

  return (
    <div className="no-print fixed inset-0 z-[120] flex flex-col bg-navy-900/80 backdrop-blur-sm">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-3">
        <p className="text-[13px] font-semibold text-white">
          {PRINT_LABELS[cible]} — appuyez sur <kbd className="rounded bg-white/15 px-1.5">Ctrl</kbd>
          {' + '}
          <kbd className="rounded bg-white/15 px-1.5">P</kbd> (ou{' '}
          <kbd className="rounded bg-white/15 px-1.5">⌘</kbd>
          {' + '}
          <kbd className="rounded bg-white/15 px-1.5">P</kbd>) puis « Enregistrer au format PDF ».
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => printDocument(cible)}
            className="inline-flex h-9 items-center gap-2 rounded-full bg-white px-4 text-[13px] font-semibold text-ink hover:bg-azur-100"
          >
            <Printer size={14} />
            Imprimer
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center rounded-full border border-white/30 px-4 text-[13px] font-semibold text-white hover:bg-white/10"
          >
            Fermer
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto px-4 py-6">
        <div className="mx-auto flex w-full max-w-[794px] flex-col gap-6">
          {cible !== 'lettre' ? <CvSheet data={cv} className="shadow-page" /> : null}
          {cible !== 'cv' ? <LetterSheet data={letter} className="shadow-page" /> : null}
        </div>
      </div>
    </div>
  )
}
