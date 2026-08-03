'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, FileUp, Loader2, Sparkles, Upload, X } from 'lucide-react'
import { useCvStore } from '@/lib/store'
import { useLetterStore, type LetterData } from '@/lib/letter'
import { ImportError, readImportedFile } from '@/lib/cv-import'
import { parseCvText } from '@/lib/cv-parse'
import { SANS_SERVEUR } from '@/lib/deploiement'
import type { CvData } from '@/lib/types'
import { cn } from '@/lib/utils'

type Etape = 'depot' | 'lecture' | 'resultat'

interface Analyse {
  data: CvData
  found: string[]
  source: 'ia' | 'local'
}

/**
 * Import d'un CV existant.
 *
 * Deux chemins mènent au même endroit : déposer un fichier (PDF, Word, texte
 * ou sauvegarde `.json`) ou coller le texte du CV. Le contenu reconnu est
 * toujours présenté avant d'être écrit dans l'éditeur — un import ne doit
 * jamais effacer un travail en cours sans que l'utilisateur l'ait vu venir.
 */
export function ImportCv({ compact = false }: { compact?: boolean }) {
  const cv = useCvStore((s) => s.data)
  const replaceCv = useCvStore((s) => s.replace)
  const replaceLetter = useLetterStore((s) => s.replace)

  const [ouvert, setOuvert] = useState(false)
  const [etape, setEtape] = useState<Etape>('depot')
  const [texte, setTexte] = useState('')
  const [analyse, setAnalyse] = useState<Analyse | null>(null)
  const [erreur, setErreur] = useState('')
  const [survol, setSurvol] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const panneau = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ouvert) return
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOuvert(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [ouvert])

  const reinitialiser = () => {
    setEtape('depot')
    setTexte('')
    setAnalyse(null)
    setErreur('')
  }

  /** Envoie le texte au serveur, qui structure avec l'IA ou en local. */
  const analyser = useCallback(async (contenu: string) => {
    setEtape('lecture')
    setErreur('')

    // Export statique : l'analyse se fait directement dans le navigateur.
    if (SANS_SERVEUR) {
      const { data, found } = parseCvText(contenu)
      setAnalyse({ data, found, source: 'local' })
      setEtape('resultat')
      return
    }

    try {
      const response = await fetch('/api/import-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: contenu }),
      })
      if (!response.ok) throw new Error('analyse')
      const json = (await response.json()) as Analyse
      setAnalyse(json)
    } catch {
      // Hors ligne ou route absente : l'analyse se fait dans le navigateur.
      const { data, found } = parseCvText(contenu)
      setAnalyse({ data, found, source: 'local' })
    }
    setEtape('resultat')
  }, [])

  const traiterFichier = useCallback(
    async (file?: File | null) => {
      if (!file) return
      setEtape('lecture')
      setErreur('')
      try {
        const lu = await readImportedFile(file)

        if (lu.kind === 'cv') {
          replaceCv(lu.data)
          setConfirmation('Sauvegarde du CV restaurée.')
          setOuvert(false)
          setEtape('depot')
          return
        }
        if (lu.kind === 'lettre') {
          replaceLetter(lu.data as LetterData)
          setConfirmation('Sauvegarde de la lettre restaurée.')
          setOuvert(false)
          setEtape('depot')
          return
        }

        setTexte(lu.text)
        await analyser(lu.text)
      } catch (error) {
        setErreur(
          error instanceof ImportError
            ? error.message
            : 'Impossible de lire ce fichier. Collez plutôt le texte de votre CV ci-dessous.',
        )
        setEtape('depot')
      }
    },
    [analyser, replaceCv, replaceLetter],
  )

  /** Écrit le résultat dans l'éditeur, en gardant le modèle et les couleurs. */
  const appliquer = () => {
    if (!analyse) return
    replaceCv({ ...analyse.data, settings: cv.settings })
    setConfirmation('CV importé : vérifiez chaque rubrique avant de télécharger.')
    setOuvert(false)
    reinitialiser()
  }

  useEffect(() => {
    if (!confirmation) return
    const id = window.setTimeout(() => setConfirmation(''), 7000)
    return () => window.clearTimeout(id)
  }, [confirmation])

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        title="Importer un CV existant (PDF, Word, texte ou sauvegarde)"
        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-2 text-[13px] font-semibold text-ink-muted transition-colors hover:bg-cloud-200 hover:text-ink sm:px-3"
      >
        <Upload size={14} />
        <span className={compact ? 'hidden lg:inline' : undefined}>Importer</span>
      </button>

      {confirmation ? (
        <span className="max-w-[40vw] truncate text-xs font-semibold text-navy-700" role="status">
          {confirmation}
        </span>
      ) : null}

      {ouvert ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-navy-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          onMouseDown={(event) => {
            if (!panneau.current?.contains(event.target as Node)) setOuvert(false)
          }}
        >
          <div
            ref={panneau}
            role="dialog"
            aria-modal="true"
            aria-label="Importer un CV"
            className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-float sm:rounded-2xl"
          >
            <header className="flex items-start justify-between gap-4 border-b border-cloud-300 px-6 py-5">
              <div>
                <h2 className="text-[17px] font-bold text-ink">Importer un CV existant</h2>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
                  Récupérez le contenu d’un CV déjà rédigé : les informations reconnues remplissent
                  l’éditeur, vous n’avez plus qu’à corriger.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOuvert(false)}
                className="-mr-2 -mt-1 rounded-full p-2 text-ink-muted transition-colors hover:bg-cloud-200 hover:text-ink"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {etape === 'lecture' ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <Loader2 size={26} className="animate-spin text-azur-600" />
                  <p className="text-sm font-semibold text-ink">Lecture du document…</p>
                  <p className="max-w-xs text-[12px] text-ink-muted">
                    Les PDF de plusieurs pages demandent quelques secondes.
                  </p>
                </div>
              ) : null}

              {etape === 'depot' ? (
                <>
                  <label
                    onDragOver={(event) => {
                      event.preventDefault()
                      setSurvol(true)
                    }}
                    onDragLeave={() => setSurvol(false)}
                    onDrop={(event) => {
                      event.preventDefault()
                      setSurvol(false)
                      void traiterFichier(event.dataTransfer.files?.[0])
                    }}
                    className={cn(
                      'flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors',
                      survol
                        ? 'border-azur-500 bg-azur-50'
                        : 'border-cloud-400 bg-cloud hover:border-azur-400',
                    )}
                  >
                    <FileUp size={26} className="text-azur-600" />
                    <span className="mt-3 text-[15px] font-bold text-ink">
                      Choisir un fichier ou le déposer ici
                    </span>
                    <span className="mt-1 text-[12px] text-ink-muted">
                      PDF, Word (.docx), texte, ou une sauvegarde IDJÔ CV (.json)
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt,.md,.json,application/pdf,application/json,text/plain"
                      className="sr-only"
                      onChange={(event) => {
                        void traiterFichier(event.target.files?.[0])
                        event.target.value = ''
                      }}
                    />
                  </label>

                  {erreur ? (
                    <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-[13px] leading-relaxed text-amber-900">
                      {erreur}
                    </p>
                  ) : null}

                  <div className="mt-6">
                    <p className="eyebrow mb-2">Ou collez le texte de votre CV</p>
                    <textarea
                      value={texte}
                      onChange={(event) => setTexte(event.target.value)}
                      rows={7}
                      placeholder="Sélectionnez tout le texte de votre CV (Ctrl+A, Ctrl+C) puis collez-le ici…"
                      className="field resize-y leading-relaxed"
                    />
                    <button
                      type="button"
                      disabled={texte.trim().length < 20}
                      onClick={() => void analyser(texte)}
                      className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-azur-btn text-[14px] font-semibold text-white transition-[filter] hover:brightness-110 disabled:opacity-50"
                    >
                      <Sparkles size={16} />
                      Analyser ce texte
                    </button>
                  </div>
                </>
              ) : null}

              {etape === 'resultat' && analyse ? (
                <>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="eyebrow">Informations reconnues</h3>
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em]',
                        analyse.source === 'ia'
                          ? 'bg-azur-100 text-navy-700'
                          : 'bg-cloud-200 text-ink-muted',
                      )}
                    >
                      {analyse.source === 'ia' ? 'Analyse IA' : 'Analyse locale'}
                    </span>
                  </div>

                  {analyse.source === 'local' ? (
                    <p className="mb-4 rounded-xl bg-cloud px-4 py-3 text-[12px] leading-relaxed text-ink-muted">
                      Analyse effectuée dans votre navigateur. Elle suit bien les CV présentés en
                      une colonne ; sur une mise en page en colonnes, l’ordre du texte se mélange et
                      certaines rubriques peuvent être mal réparties. Relisez avant de valider.
                    </p>
                  ) : null}

                  {analyse.found.length ? (
                    <ul className="flex flex-wrap gap-2">
                      {analyse.found.map((item) => (
                        <li
                          key={item}
                          className="inline-flex items-center gap-1.5 rounded-full border border-azur-200 bg-azur-50 px-3 py-1.5 text-[12px] font-semibold text-navy-700"
                        >
                          <Check size={12} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="rounded-xl bg-amber-50 px-4 py-3 text-[13px] leading-relaxed text-amber-900">
                      Rien n’a pu être reconnu automatiquement. Le texte reste disponible ci-dessous :
                      copiez-collez chaque partie dans les champs de l’éditeur.
                    </p>
                  )}

                  <div className="mt-5 rounded-xl border border-cloud-300 bg-cloud p-4">
                    <p className="text-[12px] font-semibold text-ink">
                      {analyse.data.profile.firstName || analyse.data.profile.lastName
                        ? `${analyse.data.profile.firstName} ${analyse.data.profile.lastName}`.trim()
                        : 'Nom non reconnu'}
                    </p>
                    {analyse.data.profile.title ? (
                      <p className="text-[12px] text-ink-muted">{analyse.data.profile.title}</p>
                    ) : null}
                    <p className="mt-1 text-[11px] text-ink-muted">
                      {[analyse.data.profile.phone, analyse.data.profile.email, analyse.data.profile.city]
                        .filter(Boolean)
                        .join('  ·  ') || 'Aucune coordonnée reconnue'}
                    </p>
                  </div>

                  <details className="mt-4">
                    <summary className="cursor-pointer text-[12px] font-semibold text-navy-700">
                      Voir le texte lu dans le document
                    </summary>
                    <pre className="mt-2 max-h-52 overflow-auto whitespace-pre-wrap rounded-xl border border-cloud-300 bg-white p-3 text-[11px] leading-relaxed text-ink-muted">
                      {texte}
                    </pre>
                  </details>

                  <p className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-[12px] leading-relaxed text-amber-900">
                    Ceci remplacera le contenu actuel de l’éditeur. Votre modèle et vos couleurs
                    sont conservés.
                  </p>
                </>
              ) : null}
            </div>

            {etape === 'resultat' ? (
              <footer className="flex flex-col gap-2 border-t border-cloud-300 px-6 py-4 sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={appliquer}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-ink text-[14px] font-semibold text-white transition-colors hover:bg-ink-soft"
                >
                  Remplir mon CV
                </button>
                <button
                  type="button"
                  onClick={reinitialiser}
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-full border border-cloud-400 text-[14px] font-semibold text-ink transition-colors hover:border-ink"
                >
                  Choisir un autre fichier
                </button>
              </footer>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  )
}
