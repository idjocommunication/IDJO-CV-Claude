'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Check,
  ChevronDown,
  ClipboardCopy,
  Download,
  FileCode2,
  FileDown,
  FileJson,
  Files,
  Info,
  Lock,
  Maximize2,
  Printer,
} from 'lucide-react'
import { CvSheet } from '@/cv-templates'
import { LetterSheet } from '@/cv-templates/LetterSheet'
import { useCvStore } from '@/lib/store'
import { useLetterStore } from '@/lib/letter'
import {
  PRINT_LABELS,
  copyToClipboard,
  downloadJson,
  downloadPrintableHtml,
  isEmbedded,
  printDocument,
  type PrintTarget,
} from '@/lib/print'
import { TelechargementDialog } from '@/components/editor/PaiementDialog'
import { PAIEMENT, dateLisible, prixLisible, type DocumentPayant } from '@/lib/paiement'
import { useAcces } from '@/lib/use-acces'
import { cn, fullName } from '@/lib/utils'

/**
 * Bouton « Télécharger » commun au CV et à la lettre. Les PDF passent par la
 * boîte d'impression du navigateur (« Enregistrer au format PDF »), les
 * sauvegardes `.json` se téléchargent directement.
 */
export function DownloadMenu({ current }: { current: 'cv' | 'lettre' }) {
  const cv = useCvStore((s) => s.data)
  const letter = useLetterStore((s) => s.data)
  const [open, setOpen] = useState(false)
  /** Cible dont l'impression a été bloquée par le navigateur, le cas échéant. */
  const [bloque, setBloque] = useState<PrintTarget | null>(null)
  const [copie, setCopie] = useState('')
  /** Aperçu intégré : le cadre y interdit impression et téléchargements. */
  const [integre, setIntegre] = useState(false)
  /** Document dont on demande la livraison (e-mail, puis paiement si besoin). */
  const [aLivrer, setALivrer] = useState<DocumentPayant | null>(null)
  /** Document affiché en grand, pour une impression déclenchée à la main. */
  const [enGrand, setEnGrand] = useState<PrintTarget | null>(null)
  const { autorise, acces } = useAcces()
  const finAcces = acces?.expire ?? 0
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => setIntegre(isEmbedded()), [])

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

  const slug = fullName(cv.profile.firstName, cv.profile.lastName) || 'document'
  const hasLetter = Boolean(letter.hook || letter.proof || letter.projection || letter.subject)

  const copier = (quoi: 'cv' | 'lettre') => {
    const ok = copyToClipboard(JSON.stringify(quoi === 'cv' ? cv : letter, null, 2))
    setCopie(
      ok
        ? `Sauvegarde ${quoi === 'cv' ? 'du CV' : 'de la lettre'} copiée. Collez-la dans un fichier .json.`
        : 'Copie impossible : sélectionnez le texte à la main.',
    )
    window.setTimeout(() => setCopie(''), 6000)
  }

  /** Impression immédiate sur cet appareil, une fois l'accès acquis. */
  const imprimer = (target: PrintTarget) => {
    setBloque(null)
    // Laisse la boîte se refermer avant d'ouvrir la fenêtre d'impression.
    window.setTimeout(() => {
      if (printDocument(target) === 'bloque') setBloque(target)
    }, 60)
  }

  /**
   * Toute demande de PDF passe d'abord par les coordonnées : c'est là que le
   * client indique l'adresse qui recevra son document, et le numéro à débiter
   * quand le téléchargement est payant.
   */
  const toPdf = (target: PrintTarget) => {
    setOpen(false)
    setBloque(null)
    setALivrer(target)
  }

  return (
    <div className="relative" ref={box}>
      <div className="flex items-stretch">
        <button
          type="button"
          onClick={() => toPdf(current)}
          className="inline-flex h-9 shrink-0 items-center gap-2 rounded-l-full bg-ink pl-4 pr-3 text-[13px] font-semibold text-white transition-colors hover:bg-ink-soft sm:h-10 sm:pl-5"
        >
          {autorise ? <Download size={15} /> : <Lock size={15} />}
          <span className="hidden sm:inline">Télécharger le </span>PDF
        </button>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Autres téléchargements"
          className="inline-flex h-9 shrink-0 items-center rounded-r-full border-l border-white/20 bg-ink px-2 text-white transition-colors hover:bg-ink-soft sm:h-10"
        >
          <ChevronDown size={15} className={cn('transition-transform', open && 'rotate-180')} />
        </button>
      </div>

      {bloque ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-[300px] rounded-xl border border-amber-300 bg-amber-50 p-4 shadow-float">
          <p className="text-[13px] font-bold text-amber-900">Impression bloquée</p>
          <p className="mt-1.5 text-[12px] leading-relaxed text-amber-900/80">
            {integre
              ? 'Cet aperçu est affiché dans un cadre qui interdit l’impression et les téléchargements. Ouvrez le site dans un onglet pour obtenir votre PDF.'
              : 'Votre navigateur a empêché l’ouverture de la fenêtre d’impression. Autorisez les fenêtres surgissantes pour ce site, ou téléchargez le document : il s’ouvre dans n’importe quel navigateur et s’imprime en PDF.'}
          </p>
          <button
            type="button"
            onClick={() => {
              downloadPrintableHtml(bloque, `idjo-${bloque}-${slug}.html`)
              setBloque(null)
            }}
            className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-full bg-ink px-4 text-[13px] font-semibold text-white hover:bg-ink-soft"
          >
            <FileCode2 size={14} />
            Télécharger le document
          </button>
          <button
            type="button"
            onClick={() => {
              setEnGrand(bloque)
              setBloque(null)
            }}
            className="mt-2 inline-flex h-9 w-full items-center justify-center gap-2 rounded-full border border-amber-300 bg-white px-4 text-[13px] font-semibold text-amber-900 hover:bg-amber-100"
          >
            <Maximize2 size={14} />
            Afficher en grand, puis Ctrl+P
          </button>
          <button
            type="button"
            onClick={() => {
              copier(bloque === 'lettre' ? 'lettre' : 'cv')
              setBloque(null)
            }}
            className="mt-2 inline-flex h-9 w-full items-center justify-center gap-2 rounded-full border border-amber-300 bg-white px-4 text-[13px] font-semibold text-amber-900 hover:bg-amber-100"
          >
            <ClipboardCopy size={14} />
            Copier la sauvegarde
          </button>
          <button
            type="button"
            onClick={() => setBloque(null)}
            className="mt-2 w-full text-[12px] font-semibold text-amber-900/70 underline underline-offset-2"
          >
            Fermer
          </button>
        </div>
      ) : null}

      {copie ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-[300px] rounded-xl border border-azur-300 bg-azur-50 px-4 py-3 shadow-float">
          <p className="flex items-start gap-2 text-[12px] font-semibold leading-relaxed text-navy-700">
            <Check size={14} className="mt-0.5 shrink-0" />
            {copie}
          </p>
        </div>
      ) : null}

      {aLivrer ? (
        <TelechargementDialog
          document={aLivrer}
          onClose={() => setALivrer(null)}
          onTelecharger={imprimer}
        />
      ) : null}

      {enGrand ? (
        <ApercuImpression cible={enGrand} onClose={() => setEnGrand(null)} />
      ) : null}

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-[290px] overflow-hidden rounded-xl border border-cloud-300 bg-white py-1.5 shadow-float">
          {!autorise ? (
            <div className="mx-2 mb-1.5 rounded-lg bg-azur-50 px-3 py-2.5">
              <p className="text-[11px] font-bold text-navy-700">
                Téléchargement payant — {prixLisible()}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-navy-700/80">
                La création, l’aperçu et l’assistant restent gratuits. Le règlement ouvre{' '}
                {PAIEMENT.dureeJours} jours de téléchargements illimités, CV et lettre compris.
              </p>
            </div>
          ) : finAcces ? (
            <p className="mx-2 mb-1.5 rounded-lg bg-cloud px-3 py-2 text-[11px] font-semibold text-ink-muted">
              Accès ouvert jusqu’au {dateLisible(finAcces)}
            </p>
          ) : null}

          {integre ? (
            <div className="mx-2 mb-1.5 rounded-lg bg-amber-50 px-3 py-2.5">
              <p className="flex items-start gap-2 text-[11px] font-semibold leading-relaxed text-amber-900">
                <Info size={13} className="mt-0.5 shrink-0" />
                Aperçu intégré : ce cadre bloque l’impression et les
                téléchargements. Ouvrez le site dans un onglet pour récupérer vos fichiers, ou
                copiez votre sauvegarde ci-dessous.
              </p>
            </div>
          ) : null}
          <p className="px-4 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">
            Au format PDF (A4)
          </p>
          <MenuItem
            icon={autorise ? <FileDown size={15} /> : <Lock size={15} />}
            onClick={() => toPdf('cv')}
            hint={autorise ? undefined : prixLisible()}
          >
            Mon CV
          </MenuItem>
          <MenuItem
            icon={<FileDown size={15} />}
            onClick={() => toPdf('lettre')}
            hint={!autorise ? prixLisible() : hasLetter ? undefined : 'lettre encore vide'}
          >
            Ma lettre de motivation
          </MenuItem>
          <MenuItem
            icon={autorise ? <Files size={15} /> : <Lock size={15} />}
            onClick={() => toPdf('tout')}
          >
            Les deux, à la suite
          </MenuItem>

          <div className="my-1.5 h-px bg-cloud-200" />
          <p className="px-4 pb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">
            Sauvegarde (à réimporter)
          </p>
          <MenuItem
            icon={<FileJson size={15} />}
            onClick={() => {
              setOpen(false)
              downloadJson(`idjo-cv-${slug}.json`, cv)
            }}
          >
            Fichier du CV (.json)
          </MenuItem>
          <MenuItem
            icon={<FileJson size={15} />}
            onClick={() => {
              setOpen(false)
              downloadJson(`idjo-lettre-${slug}.json`, letter)
            }}
          >
            Fichier de la lettre (.json)
          </MenuItem>
          <MenuItem
            icon={autorise ? <FileCode2 size={15} /> : <Lock size={15} />}
            onClick={() => {
              setOpen(false)
              if (!autorise) {
                setALivrer(current)
                return
              }
              downloadPrintableHtml(current, `idjo-${current}-${slug}.html`)
            }}
          >
            Document imprimable (.html)
          </MenuItem>
          <MenuItem
            icon={<Maximize2 size={15} />}
            onClick={() => {
              setOpen(false)
              if (!autorise) {
                setALivrer(current)
                return
              }
              setEnGrand(current)
            }}
          >
            Afficher en grand, puis Ctrl+P
          </MenuItem>
          <MenuItem
            icon={<ClipboardCopy size={15} />}
            onClick={() => {
              setOpen(false)
              copier('cv')
            }}
          >
            Copier la sauvegarde du CV
          </MenuItem>
          <MenuItem
            icon={<ClipboardCopy size={15} />}
            onClick={() => {
              setOpen(false)
              copier('lettre')
            }}
          >
            Copier la sauvegarde de la lettre
          </MenuItem>

          <p className="px-4 pb-1 pt-2 text-[11px] leading-relaxed text-ink-muted">
            Dans la boîte d’impression, choisissez « Enregistrer au format PDF ».
          </p>
        </div>
      ) : null}
    </div>
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

function MenuItem({
  icon,
  onClick,
  hint,
  children,
}: {
  icon: React.ReactNode
  onClick: () => void
  hint?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-[13px] font-medium text-ink transition-colors hover:bg-cloud-200"
    >
      <span className="text-ink-muted">{icon}</span>
      <span className="flex-1">{children}</span>
      {hint ? <span className="text-[10px] text-ink-muted">{hint}</span> : null}
    </button>
  )
}
