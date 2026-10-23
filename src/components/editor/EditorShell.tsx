'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  AlertTriangle,
  Eye,
  Minus,
  PanelLeft,
  PenLine,
  Plus,
  Sparkles,
} from 'lucide-react'
import { A4_HEIGHT, A4_WIDTH, CvSheet, ScaledCvSheet } from '@/cv-templates'
import { LetterSheet } from '@/cv-templates/LetterSheet'
import { EditorForm } from '@/components/editor/EditorForm'
import { DesignBar, DesignPanel } from '@/components/editor/DesignPanel'
import { AtsBadge, AtsPanel } from '@/components/editor/AtsPanel'
import { AssistantPanel } from '@/components/assistant/AssistantPanel'
import { DownloadMenu } from '@/components/editor/DownloadMenu'
import { RetourPaiement } from '@/components/editor/PaiementDialog'
import { DocumentVerrouille } from '@/components/editor/DocumentVerrouille'
import { LienDonneesCv } from '@/components/editor/LienDonneesCv'
import { SeanceTelechargement } from '@/components/editor/SeanceTelechargement'
import { ImportCv } from '@/components/editor/ImportCv'
import { Logo } from '@/components/site/Logo'
import { useCvStore } from '@/lib/store'
import { useLetterStore } from '@/lib/letter'
import { useProprietaireImpression } from '@/lib/print-registry'
import { paiementRequis } from '@/lib/paiement'
import { useTelechargement } from '@/lib/telechargement'
import { TEMPLATES } from '@/data/templates'
import type { TemplateId } from '@/lib/types'
import { clamp, cn } from '@/lib/utils'

const TEMPLATE_IDS = TEMPLATES.map((t) => t.id) as string[]

/**
 * Pastille « tient sur une page » / « déborde ». Un CV d'une page et demie
 * arrive chez le recruteur sur deux feuilles dont la seconde est presque vide :
 * mieux vaut le dire pendant la saisie.
 */
function PageBadge({ pages }: { pages: number }) {
  const entieres = Math.ceil(pages - 0.01)
  const deborde = pages > 1.02
  const presquePleine = pages > entieres - 0.15

  return (
    <span
      className={cn(
        'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold',
        deborde && !presquePleine
          ? 'border-amber-300 bg-amber-50 text-amber-800'
          : 'border-cloud-400 bg-white text-ink-muted',
      )}
      title={
        deborde
          ? `Votre CV occupe environ ${pages.toFixed(1).replace('.', ',')} page. Réduisez la taille du texte ou raccourcissez vos descriptions pour tenir sur ${entieres - 1 || 1} page.`
          : 'Votre CV tient sur une seule page.'
      }
    >
      {deborde && !presquePleine ? <AlertTriangle size={13} /> : null}
      {entieres} page{entieres > 1 ? 's' : ''}
      {deborde && !presquePleine ? (
        <span className="hidden font-medium sm:inline">· la dernière est peu remplie</span>
      ) : null}
    </span>
  )
}

export function EditorShell() {
  const searchParams = useSearchParams()
  const data = useCvStore((s) => s.data)
  const setSettings = useCvStore((s) => s.setSettings)
  const letter = useLetterStore((s) => s.data)
  /** Le CV ne sort qu'au sein d'une séance de téléchargement payée. */
  const seancePayee = useTelechargement((s) => Boolean(s.seance?.payee))
  const cvImprimable = !paiementRequis() || seancePayee
  const rendImpression = useProprietaireImpression()

  const [mounted, setMounted] = useState(false)
  const [atsOpen, setAtsOpen] = useState(false)
  const [designOpen, setDesignOpen] = useState(false)
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [mobileView, setMobileView] = useState<'form' | 'preview'>('form')
  const [zoom, setZoom] = useState(1)
  /** Nombre de pages A4 occupées par le CV (1,4 = une page et demie environ). */
  const [pages, setPages] = useState(1)
  /** Référence de transaction au retour de la page de paiement. */
  const [paiement, setPaiement] = useState<string | null>(null)
  const [autoScale, setAutoScale] = useState(0.5)
  const stage = useRef<HTMLDivElement>(null)

  // La saisie n'est restaurée du stockage local qu'après le montage client.
  useEffect(() => setMounted(true), [])

  // Ctrl+P depuis cette page imprime le CV, pas la lettre.
  useEffect(() => {
    document.body.dataset.print = 'cv'
    return () => {
      delete document.body.dataset.print
    }
  }, [])

  // Retour depuis la page de paiement, ou transaction laissée en suspens.
  useEffect(() => {
    const reference =
      searchParams.get('paiement') ?? window.sessionStorage.getItem('idjo-cv:paiement-en-cours')
    if (reference) setPaiement(reference)
  }, [searchParams])

  // Modèle passé en paramètre : /editeur?modele=lagune
  useEffect(() => {
    const requested = searchParams.get('modele')
    if (requested && TEMPLATE_IDS.includes(requested)) {
      setSettings({ template: requested as TemplateId })
    }
  }, [searchParams, setSettings])

  // Échelle automatique de la feuille selon la largeur disponible.
  useEffect(() => {
    const node = stage.current
    if (!node) return
    const update = () => {
      const available = node.clientWidth - 48
      const byHeight = (node.clientHeight - 48) / A4_HEIGHT
      setAutoScale(clamp(Math.min(available / A4_WIDTH, byHeight), 0.25, 1.1))
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => observer.disconnect()
  }, [mobileView])

  const scale = useMemo(() => clamp(autoScale * zoom, 0.2, 2), [autoScale, zoom])

  return (
    <>
      <div className="screen-only flex h-[100dvh] flex-col overflow-hidden bg-cloud">
      {/* Barre d'outils */}
      <header className="no-print z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-cloud-300 bg-white px-3 sm:h-16 sm:px-5">
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/" aria-label="Retour à l’accueil" className="shrink-0">
            <Logo />
          </Link>
          <span className="hidden truncate text-xs text-ink-muted lg:inline">
            {mounted ? 'Enregistré sur cet appareil' : 'Chargement…'}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ImportCv compact />
          <button
            type="button"
            onClick={() => {
              setDesignOpen(false)
              setAtsOpen(false)
              setAssistantOpen((v) => !v)
            }}
            aria-pressed={assistantOpen}
            aria-label="Assistant IA"
            title="Assistant de rédaction"
            className={cn(
              'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold transition-colors',
              assistantOpen
                ? 'border-azur-500 bg-azur-50 text-navy-700'
                : 'border-cloud-400 text-ink hover:border-azur-400 hover:text-navy-700',
            )}
          >
            <Sparkles size={14} className="text-azur-600" />
            <span className="hidden sm:inline">Assistant IA</span>
          </button>
          <AtsBadge
            open={atsOpen}
            onClick={() => {
              setDesignOpen(false)
              setAssistantOpen(false)
              setAtsOpen((v) => !v)
            }}
          />
          <Link
            href="/lettre-de-motivation"
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-2 text-[13px] font-semibold text-ink-muted transition-colors hover:bg-cloud-200 hover:text-ink sm:px-3"
            title="Lettre de motivation"
          >
            <PenLine size={14} />
            <span className="hidden lg:inline">Lettre de motivation</span>
          </Link>
          <DownloadMenu current="cv" />
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1">
        {/* Panneau de saisie */}
        <aside
          className={cn(
            'no-print w-full shrink-0 border-r border-cloud-300 bg-white lg:flex lg:w-[420px] lg:flex-col xl:w-[460px]',
            mobileView === 'form' ? 'flex flex-col' : 'hidden',
          )}
        >
          <EditorForm />
        </aside>

        {/* Aperçu */}
        <div
          ref={stage}
          className={cn(
            'relative min-w-0 flex-1 overflow-auto bg-cloud-200 lg:block',
            mobileView === 'preview' ? 'block' : 'hidden',
          )}
        >
          {/* La barre passe à la ligne plutôt que de comprimer les commandes :
              dans une colonne étroite, modèles et couleurs restent atteignables. */}
          <div className="no-print sticky top-0 z-20 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-cloud-300 bg-cloud-200/85 px-4 py-2.5 backdrop-blur">
            <DesignBar
              onOpenPanel={() => {
                setAtsOpen(false)
                setAssistantOpen(false)
                setDesignOpen((v) => !v)
              }}
            />
            <PageBadge pages={pages} />
            <div className="flex shrink-0 items-center gap-1 rounded-full border border-cloud-400 bg-white px-1 py-1">
              <button
                type="button"
                onClick={() => setZoom((z) => clamp(z - 0.1, 0.5, 2))}
                className="flex h-7 w-7 items-center justify-center rounded-full text-ink-muted hover:bg-cloud-200 hover:text-ink"
                aria-label="Réduire l’aperçu"
              >
                <Minus size={14} />
              </button>
              <span className="w-11 text-center text-[11px] font-semibold tabular-nums text-ink-muted">
                {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => clamp(z + 0.1, 0.5, 2))}
                className="flex h-7 w-7 items-center justify-center rounded-full text-ink-muted hover:bg-cloud-200 hover:text-ink"
                aria-label="Agrandir l’aperçu"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="flex justify-center px-6 py-6">
            <ScaledCvSheet data={data} scale={scale} onPagesChange={setPages} />
          </div>
        </div>

        {designOpen ? <DesignPanel onClose={() => setDesignOpen(false)} /> : null}
        {atsOpen ? <AtsPanel onClose={() => setAtsOpen(false)} /> : null}
        {assistantOpen ? (
          <AssistantPanel mode="cv" onClose={() => setAssistantOpen(false)} />
        ) : null}
      </div>

      {paiement ? (
        <RetourPaiement reference={paiement} onFini={() => setPaiement(null)} />
      ) : null}

      {/* Bascule mobile */}
      <div className="no-print flex shrink-0 border-t border-cloud-300 bg-white lg:hidden">
        <button
          type="button"
          onClick={() => setMobileView('form')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 py-3 text-sm font-semibold',
            mobileView === 'form' ? 'text-ink' : 'text-ink-muted',
          )}
        >
          <PanelLeft size={16} />
          Saisie
        </button>
        <button
          type="button"
          onClick={() => setMobileView('preview')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 py-3 text-sm font-semibold',
            mobileView === 'preview' ? 'text-ink' : 'text-ink-muted',
          )}
        >
          <Eye size={16} />
          Aperçu
        </button>
        </div>
      </div>

      {/* Copies plein format utilisées par l'impression et l'export PDF.
          `data-print` sur <body> choisit celle(s) qui partent à l'imprimante.
          Hors séance de téléchargement payée, le CV n'est pas rendu :
          l'impression directe du navigateur ne peut pas contourner le paiement. */}
      {!rendImpression ? null : (
        <>
          <SeanceTelechargement />
          <div className="print-only print-doc print-doc-cv" aria-hidden>
            {cvImprimable ? (
              <>
                <LienDonneesCv data={data} />
                <CvSheet data={data} />
              </>
            ) : (
              <DocumentVerrouille />
            )}
          </div>
          {/* La lettre de motivation est gratuite : elle sort toujours. */}
          <div className="print-only print-doc print-doc-lettre" aria-hidden>
            <LetterSheet data={letter} />
          </div>
        </>
      )}
    </>
  )
}
