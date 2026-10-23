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
} from 'lucide-react'
import { useCvStore } from '@/lib/store'
import { useLetterStore } from '@/lib/letter'
import { copyToClipboard, downloadJson, isEmbedded, type PrintTarget } from '@/lib/print'
import { TelechargementDialog } from '@/components/editor/PaiementDialog'
import { paiementRequis, prixLisible, type DocumentPayant } from '@/lib/paiement'
import { lancerTelechargement, type Moyen } from '@/lib/telechargement'
import { useAcces } from '@/lib/use-acces'
import { cn, fullName } from '@/lib/utils'

/**
 * Bouton « Télécharger » commun au CV et à la lettre. Les PDF passent par la
 * boîte d'impression du navigateur (« Enregistrer au format PDF ») au sein
 * d'une séance de téléchargement (voir `lib/telechargement.ts`) ; les
 * sauvegardes `.json` se téléchargent directement et restent gratuites.
 */
export function DownloadMenu({ current }: { current: 'cv' | 'lettre' }) {
  const cv = useCvStore((s) => s.data)
  const letter = useLetterStore((s) => s.data)
  const [open, setOpen] = useState(false)
  const [copie, setCopie] = useState('')
  /** Aperçu intégré : le cadre y interdit impression et téléchargements. */
  const [integre, setIntegre] = useState(false)
  /** Document dont on demande la livraison (e-mail, puis paiement si besoin). */
  const [aLivrer, setALivrer] = useState<DocumentPayant | null>(null)
  const { autorise, acces } = useAcces()
  /** Un téléchargement payé attend d'être utilisé. */
  const telechargementPaye = paiementRequis() && acces !== null
  /** La lettre de motivation est gratuite ; le CV est payant tant que le téléchargement n'est pas réglé. */
  const libre = autorise || current === 'lettre'
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

  /**
   * Toute demande de PDF passe d'abord par les coordonnées : c'est là que le
   * client indique l'adresse qui recevra son document, et règle le
   * téléchargement quand il est payant.
   */
  const toPdf = (target: PrintTarget) => {
    setOpen(false)
    setALivrer(target)
  }

  /** Fichier imprimable ou aperçu en grand : même séance, même règlement. */
  const autreMoyen = (moyen: Moyen) => {
    setOpen(false)
    if (!libre) {
      setALivrer(current)
      return
    }
    lancerTelechargement(current, moyen)
  }

  return (
    <div className="relative" ref={box}>
      <div className="flex items-stretch">
        <button
          type="button"
          onClick={() => toPdf(current)}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-l-full bg-ink pl-3 pr-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-ink-soft sm:h-10 sm:gap-2 sm:pl-5 sm:pr-3"
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
          onTelecharger={(cible) => lancerTelechargement(cible)}
        />
      ) : null}

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-[290px] overflow-hidden rounded-xl border border-cloud-300 bg-white py-1.5 shadow-float">
          {!autorise ? (
            <div className="mx-2 mb-1.5 rounded-lg bg-azur-50 px-3 py-2.5">
              <p className="text-[11px] font-bold text-navy-700">
                Téléchargement du CV — {prixLisible()}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-navy-700/80">
                La création, l’aperçu et l’assistant restent gratuits. Chaque téléchargement du CV
                coûte {prixLisible()}. La lettre de motivation reste gratuite.
              </p>
            </div>
          ) : telechargementPaye ? (
            <p className="mx-2 mb-1.5 rounded-lg bg-cloud px-3 py-2 text-[11px] font-semibold text-ink-muted">
              1 téléchargement payé du CV vous attend
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
            hint={hasLetter ? 'gratuite' : 'lettre encore vide'}
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
            icon={libre ? <FileCode2 size={15} /> : <Lock size={15} />}
            onClick={() => autreMoyen('fichier')}
          >
            Document imprimable (.html)
          </MenuItem>
          <MenuItem
            icon={libre ? <Maximize2 size={15} /> : <Lock size={15} />}
            onClick={() => autreMoyen('grand')}
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
