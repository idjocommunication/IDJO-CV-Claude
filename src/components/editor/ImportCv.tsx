'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, FileUp, Loader2, ShieldCheck, Smartphone, Sparkles, Upload, X } from 'lucide-react'
import { useCvStore } from '@/lib/store'
import { useLetterStore, type LetterData } from '@/lib/letter'
import { ImportError, pagesPourIa, readImportedFile } from '@/lib/cv-import'
import { parseCvText } from '@/lib/cv-parse'
import { SANS_SERVEUR } from '@/lib/deploiement'
import type { CvData } from '@/lib/types'
import { cn } from '@/lib/utils'

type Etape = 'depot' | 'lecture' | 'choix' | 'resultat'

interface Analyse {
  data: CvData
  found: string[]
  source: 'ia' | 'local'
  /** Texte obtenu par reconnaissance de caractères sur l'appareil. */
  ocr?: boolean
}

/** Contenu lu, en attente du choix de l'utilisateur : IA ou appareil. */
type AAnalyser =
  | { type: 'texte'; texte: string }
  | { type: 'images'; pages: HTMLCanvasElement[]; origine: 'image' | 'scan' }

/**
 * Import d'un CV existant.
 *
 * Deux chemins mènent au même endroit : déposer un fichier (PDF, photo, Word,
 * texte ou sauvegarde `.json`) ou coller le texte du CV. Le contenu reconnu
 * est toujours présenté avant d'être écrit dans l'éditeur — un import ne doit
 * jamais effacer un travail en cours sans que l'utilisateur l'ait vu venir.
 *
 * Quand l'IA est disponible, l'utilisateur choisit avant tout envoi : lecture
 * par Claude (la plus fiable, mais le CV complet part chez Anthropic) ou
 * lecture sur l'appareil, où rien ne quitte le navigateur. Seuls les PDF
 * exportés depuis IDJÔ CV échappent à ce choix : ils portent leurs propres
 * données et sont restaurés tels quels.
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
  const [avertissement, setAvertissement] = useState('')
  const [survol, setSurvol] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [iaDisponible, setIaDisponible] = useState(false)
  const [enAttente, setEnAttente] = useState<AAnalyser | null>(null)
  const [lecture, setLecture] = useState({ titre: '', detail: '' })
  const panneau = useRef<HTMLDivElement>(null)
  /** Un résultat arrivé après fermeture ou changement de fichier est ignoré. */
  const jeton = useRef(0)

  useEffect(() => {
    if (!ouvert) return
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOuvert(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [ouvert])

  // La lecture par IA n'est proposée que si le serveur a une clé Anthropic.
  useEffect(() => {
    if (!ouvert || SANS_SERVEUR) return
    let actif = true
    fetch('/api/import-cv')
      .then((reponse) => (reponse.ok ? reponse.json() : { ia: false }))
      .then((json: { ia?: boolean }) => actif && setIaDisponible(Boolean(json.ia)))
      .catch(() => actif && setIaDisponible(false))
    return () => {
      actif = false
    }
  }, [ouvert])

  const reinitialiser = () => {
    jeton.current += 1
    setEtape('depot')
    setTexte('')
    setAnalyse(null)
    setErreur('')
    setAvertissement('')
    setEnAttente(null)
  }

  const fermer = () => {
    setOuvert(false)
    if (etape !== 'resultat') reinitialiser()
  }

  const montrerResultat = (resultat: Analyse) => {
    setAnalyse(resultat)
    setEtape('resultat')
  }

  /** Reconnaissance de texte sur l'appareil, puis analyse locale. */
  const lireSurAppareil = async (pages: HTMLCanvasElement[], moi: number) => {
    setLecture({
      titre: 'Reconnaissance du texte…',
      detail: 'La première fois, le moteur de lecture (environ 5 Mo) se télécharge.',
    })
    setEtape('lecture')
    const { reconnaitreTexte } = await import('@/lib/ocr')
    const lu = await reconnaitreTexte(pages, (part) => {
      if (jeton.current !== moi) return
      setLecture({
        titre: `Reconnaissance du texte… ${Math.round(part * 100)} %`,
        detail: 'Comptez une à deux minutes sur un téléphone.',
      })
    })
    if (jeton.current !== moi) return

    if (lu.trim().length < 40) {
      throw new ImportError(
        'Aucun texte lisible n’a été trouvé dans cette image. Reprenez une photo nette, bien éclairée et de face, ou collez le texte de votre CV ci-dessous.',
      )
    }
    setTexte(lu)
    const { data, found } = parseCvText(lu)
    montrerResultat({ data, found, source: 'local', ocr: true })
  }

  /** Lance l'analyse choisie ; en cas d'échec de l'IA, l'appareil prend le relais. */
  const lancer = async (contenu: AAnalyser, mode: 'ia' | 'appareil') => {
    const moi = ++jeton.current
    setErreur('')
    setAvertissement('')
    setEnAttente(null)

    try {
      if (contenu.type === 'texte') {
        if (mode === 'appareil') {
          const { data, found } = parseCvText(contenu.texte)
          montrerResultat({ data, found, source: 'local' })
          return
        }
        setLecture({ titre: 'Analyse par l’IA…', detail: 'Une quinzaine de secondes.' })
        setEtape('lecture')
        try {
          const response = await fetch('/api/import-cv', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: contenu.texte }),
          })
          if (!response.ok) throw new Error('analyse')
          const json = (await response.json()) as Analyse
          if (jeton.current === moi) montrerResultat(json)
        } catch {
          // Hors ligne ou route absente : l'analyse se fait dans le navigateur.
          if (jeton.current !== moi) return
          const { data, found } = parseCvText(contenu.texte)
          montrerResultat({ data, found, source: 'local' })
        }
        return
      }

      if (mode === 'ia') {
        setLecture({
          titre: 'Lecture de l’image par l’IA…',
          detail: 'Une vingtaine de secondes, davantage pour plusieurs pages.',
        })
        setEtape('lecture')
        try {
          const response = await fetch('/api/import-cv', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ images: pagesPourIa(contenu.pages) }),
          })
          const json = (await response.json()) as Analyse
          if (!response.ok || json.source !== 'ia') throw new Error('analyse')
          if (jeton.current !== moi) return
          setTexte('')
          montrerResultat(json)
          return
        } catch {
          if (jeton.current !== moi) return
          setAvertissement(
            'La lecture par IA n’a pas abouti : le CV a été lu sur votre appareil à la place.',
          )
        }
      }

      await lireSurAppareil(contenu.pages, moi)
    } catch (error) {
      if (jeton.current !== moi) return
      setErreur(
        error instanceof ImportError
          ? error.message
          : 'La lecture de ce document a échoué. Collez plutôt le texte de votre CV ci-dessous.',
      )
      setEtape('depot')
    }
  }

  /** Demande le mode de lecture si l'IA est disponible, sinon lit sur l'appareil. */
  const proposer = (contenu: AAnalyser) => {
    if (iaDisponible) {
      setEnAttente(contenu)
      setEtape('choix')
      return
    }
    void lancer(contenu, 'appareil')
  }

  const traiterFichier = async (file?: File | null) => {
    if (!file) return
    const moi = ++jeton.current
    setLecture({ titre: 'Lecture du document…', detail: 'Les PDF de plusieurs pages demandent quelques secondes.' })
    setEtape('lecture')
    setErreur('')
    setAvertissement('')
    try {
      const lu = await readImportedFile(file)
      if (jeton.current !== moi) return

      if (lu.kind === 'cv') {
        // La photo n'est pas embarquée dans le PDF : on garde celle déjà en
        // place si le CV restauré est bien celui de la même personne.
        const memePersonne =
          `${lu.data.profile.firstName} ${lu.data.profile.lastName}`.trim().toLowerCase() ===
          `${cv.profile.firstName} ${cv.profile.lastName}`.trim().toLowerCase()
        const photo = lu.origine === 'pdf' ? (memePersonne ? cv.profile.photo : '') : lu.data.profile.photo
        replaceCv({ ...lu.data, profile: { ...lu.data.profile, photo } })
        setConfirmation(
          lu.origine === 'pdf'
            ? `CV IDJÔ restauré à l’identique.${photo ? '' : ' Ajoutez de nouveau votre photo.'}`
            : 'Sauvegarde du CV restaurée.',
        )
        setOuvert(false)
        reinitialiser()
        return
      }
      if (lu.kind === 'lettre') {
        replaceLetter(lu.data as LetterData)
        setConfirmation('Sauvegarde de la lettre restaurée.')
        setOuvert(false)
        reinitialiser()
        return
      }

      if (lu.kind === 'texte') {
        setTexte(lu.text)
        proposer({ type: 'texte', texte: lu.text })
        return
      }

      setTexte('')
      proposer({ type: 'images', pages: lu.pages, origine: lu.origine })
    } catch (error) {
      if (jeton.current !== moi) return
      setErreur(
        error instanceof ImportError
          ? error.message
          : 'Impossible de lire ce fichier. Collez plutôt le texte de votre CV ci-dessous.',
      )
      setEtape('depot')
    }
  }

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
        title="Importer un CV existant (PDF, photo, Word, texte ou sauvegarde)"
        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-2 text-[13px] font-semibold text-ink-muted transition-colors hover:bg-cloud-200 hover:text-ink sm:px-3"
      >
        <Upload size={14} />
        <span className={compact ? 'hidden lg:inline' : undefined}>Importer</span>
      </button>

      {/* Bulle en bas d'écran plutôt que texte dans la barre d'outils : sur
          téléphone, la barre n'a pas la place et le message masquait le logo. */}
      {confirmation ? (
        <p
          role="status"
          className="fixed inset-x-4 bottom-20 z-[90] mx-auto max-w-sm rounded-xl bg-ink px-4 py-3 text-center text-[13px] font-semibold text-white shadow-float lg:bottom-6"
        >
          {confirmation}
        </p>
      ) : null}

      {ouvert ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-navy-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          onMouseDown={(event) => {
            if (!panneau.current?.contains(event.target as Node)) fermer()
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
                onClick={fermer}
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
                  <p className="text-sm font-semibold text-ink" role="status">
                    {lecture.titre}
                  </p>
                  <p className="max-w-xs text-[12px] text-ink-muted">{lecture.detail}</p>
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
                      PDF, photo ou capture d’écran (JPEG, PNG), Word (.docx), texte, ou une
                      sauvegarde IDJÔ CV (.json)
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt,.md,.json,.png,.jpg,.jpeg,.webp,application/pdf,application/json,text/plain,image/*"
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
                      onClick={() => proposer({ type: 'texte', texte })}
                      className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-azur-btn text-[14px] font-semibold text-white transition-[filter] hover:brightness-110 disabled:opacity-50"
                    >
                      <Sparkles size={16} />
                      Analyser ce texte
                    </button>
                  </div>
                </>
              ) : null}

              {etape === 'choix' && enAttente ? (
                <ChoixLecture
                  images={enAttente.type === 'images'}
                  onIa={() => void lancer(enAttente, 'ia')}
                  onAppareil={() => void lancer(enAttente, 'appareil')}
                />
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
                      {analyse.source === 'ia'
                        ? 'Analyse IA'
                        : analyse.ocr
                          ? 'Lecture sur l’appareil'
                          : 'Analyse locale'}
                    </span>
                  </div>

                  {avertissement ? (
                    <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-[12px] leading-relaxed text-amber-900">
                      {avertissement}
                    </p>
                  ) : null}

                  {analyse.source === 'local' ? (
                    <p className="mb-4 rounded-xl bg-cloud px-4 py-3 text-[12px] leading-relaxed text-ink-muted">
                      {analyse.ocr
                        ? 'Texte reconnu dans l’image par votre navigateur. La reconnaissance peut confondre certaines lettres et mélanger les colonnes : relisez attentivement le nom, le téléphone et l’e-mail avant de valider.'
                        : 'Analyse effectuée dans votre navigateur. Elle suit bien les CV présentés en une colonne ; sur une mise en page en colonnes, l’ordre du texte se mélange et certaines rubriques peuvent être mal réparties. Relisez avant de valider.'}
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

                  {texte ? (
                    <details className="mt-4">
                      <summary className="cursor-pointer text-[12px] font-semibold text-navy-700">
                        Voir le texte lu dans le document
                      </summary>
                      <pre className="mt-2 max-h-52 overflow-auto whitespace-pre-wrap rounded-xl border border-cloud-300 bg-white p-3 text-[11px] leading-relaxed text-ink-muted">
                        {texte}
                      </pre>
                    </details>
                  ) : null}

                  <p className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-[12px] leading-relaxed text-amber-900">
                    Ceci remplacera le contenu actuel de l’éditeur. Votre modèle et vos couleurs
                    sont conservés.
                  </p>
                </>
              ) : null}
            </div>

            {etape === 'choix' ? (
              <footer className="border-t border-cloud-300 px-6 py-4">
                <button
                  type="button"
                  onClick={reinitialiser}
                  className="inline-flex h-11 w-full items-center justify-center rounded-full border border-cloud-400 text-[14px] font-semibold text-ink transition-colors hover:border-ink"
                >
                  Choisir un autre fichier
                </button>
              </footer>
            ) : null}

            {etape === 'resultat' ? (
              // `w-full` et non `flex-1` : en colonne, `flex-1` écrasait les
              // boutons sous la hauteur d'un doigt sur téléphone.
              <footer className="grid gap-2 border-t border-cloud-300 px-6 py-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={appliquer}
                  className="inline-flex h-11 w-full items-center sm:order-last justify-center gap-2 rounded-full bg-ink text-[14px] font-semibold text-white transition-colors hover:bg-ink-soft"
                >
                  Remplir mon CV
                </button>
                <button
                  type="button"
                  onClick={reinitialiser}
                  className="inline-flex h-11 w-full items-center justify-center rounded-full border border-cloud-400 text-[14px] font-semibold text-ink transition-colors hover:border-ink"
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

/**
 * Choix du mode de lecture, présenté avant tout envoi. L'utilisateur sait ce
 * qui part chez Anthropic avant de cliquer : c'est la condition pour lui
 * proposer l'IA.
 */
function ChoixLecture({
  images,
  onIa,
  onAppareil,
}: {
  images: boolean
  onIa: () => void
  onAppareil: () => void
}) {
  return (
    <div>
      <h3 className="text-[15px] font-bold text-ink">Comment lire ce CV ?</h3>
      <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
        {images
          ? 'Ce CV est une image : son texte doit être reconnu avant d’être réparti dans les rubriques.'
          : 'Choisissez qui répartit le texte de votre CV dans les rubriques de l’éditeur.'}
      </p>

      <div className="mt-4 grid gap-3">
        <div className="rounded-2xl border-2 border-azur-400 bg-azur-50 p-4">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-azur-600" />
            <p className="text-[14px] font-bold text-ink">Lecture par l’IA</p>
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-navy-700">
              Recommandé
            </span>
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-ink-muted">
            La plus précise, même pour une photo ou un CV en colonnes.
          </p>
          <p className="mt-2 flex gap-2 rounded-xl bg-white px-3 py-2 text-[12px] leading-relaxed text-ink">
            <ShieldCheck size={15} className="mt-0.5 shrink-0 text-navy-700" />
            <span>
              Votre CV complet — nom, téléphone, e-mail{images ? ' et photo' : ''} — est envoyé à
              Anthropic (Claude) pour être lu. IDJÔ CV n’en garde aucune copie.
            </span>
          </p>
          <button
            type="button"
            onClick={onIa}
            className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-azur-btn text-[14px] font-semibold text-white transition-[filter] hover:brightness-110"
          >
            J’accepte, lire avec l’IA
          </button>
        </div>

        <div className="rounded-2xl border border-cloud-400 p-4">
          <div className="flex items-center gap-2">
            <Smartphone size={16} className="text-ink-muted" />
            <p className="text-[14px] font-bold text-ink">Lecture sur cet appareil</p>
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-ink-muted">
            Rien ne quitte votre téléphone ou votre ordinateur.{' '}
            {images
              ? 'Plus lente et moins précise, surtout sur une photo floue ou un CV très graphique. Le premier usage télécharge environ 5 Mo.'
              : 'Moins précise sur les CV en colonnes.'}
          </p>
          <button
            type="button"
            onClick={onAppareil}
            className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-full border border-cloud-400 text-[14px] font-semibold text-ink transition-colors hover:border-ink"
          >
            Lire sur cet appareil
          </button>
        </div>
      </div>
    </div>
  )
}
