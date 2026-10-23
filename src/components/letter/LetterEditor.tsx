'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Check, Eye, FileText, PanelLeft, Sparkles, Trash2, Wand2 } from 'lucide-react'
import { A4_HEIGHT, A4_WIDTH, CvSheet } from '@/cv-templates'
import { LetterSheet } from '@/cv-templates/LetterSheet'
import { Field, TextArea, TextInput } from '@/components/editor/fields'
import { AssistantPanel } from '@/components/assistant/AssistantPanel'
import { DownloadMenu } from '@/components/editor/DownloadMenu'
import { DocumentVerrouille } from '@/components/editor/DocumentVerrouille'
import { LienDonneesCv } from '@/components/editor/LienDonneesCv'
import { ImportCv } from '@/components/editor/ImportCv'
import { ConfirmButton } from '@/components/ui/ConfirmButton'
import { MenuDeroulant, OptionMenu } from '@/components/ui/MenuDeroulant'
import { Logo } from '@/components/site/Logo'
import { useCvStore } from '@/lib/store'
import { formatFrenchDate, useLetterStore, type LetterData } from '@/lib/letter'
import { FONT_CHOICES, THEMES, THEME_BY_ID, type FontChoice } from '@/lib/theme'
import { useProprietaireImpression } from '@/lib/print-registry'
import { paiementRequis } from '@/lib/paiement'
import { useTelechargement } from '@/lib/telechargement'
import { SeanceTelechargement } from '@/components/editor/SeanceTelechargement'
import { clamp, cn, fullName } from '@/lib/utils'

const SCALES = [
  { value: 0.94, label: 'S' },
  { value: 1, label: 'M' },
  { value: 1.06, label: 'L' },
]

/** Regroupement des palettes dans le menu des couleurs. */
const FAMILLES: { id: (typeof THEMES)[number]['family']; label: string }[] = [
  { id: 'neutre', label: 'Neutres' },
  { id: 'froid', label: 'Froides' },
  { id: 'nature', label: 'Naturelles' },
  { id: 'chaud', label: 'Chaudes' },
]

/** Éditeur de lettre de motivation : saisie guidée en trois paragraphes. */
export function LetterEditor() {
  const data = useLetterStore((s) => s.data)
  const update = useLetterStore((s) => s.set)
  const loadSample = useLetterStore((s) => s.loadSample)
  const reset = useLetterStore((s) => s.reset)
  const cv = useCvStore((s) => s.data)
  /** Le CV ne sort qu'au sein d'une séance de téléchargement payée. */
  const seancePayee = useTelechargement((s) => Boolean(s.seance?.payee))
  const cvImprimable = !paiementRequis() || seancePayee
  const rendImpression = useProprietaireImpression()

  const [mobileView, setMobileView] = useState<'form' | 'preview'>('form')
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [autoScale, setAutoScale] = useState(0.5)
  const stage = useRef<HTMLDivElement>(null)

  // Ctrl+P depuis cette page imprime la lettre, pas le CV.
  useEffect(() => {
    document.body.dataset.print = 'lettre'
    return () => {
      delete document.body.dataset.print
    }
  }, [])

  useEffect(() => {
    const node = stage.current
    if (!node) return
    const update = () => {
      const byWidth = (node.clientWidth - 48) / A4_WIDTH
      const byHeight = (node.clientHeight - 48) / A4_HEIGHT
      setAutoScale(clamp(Math.min(byWidth, byHeight), 0.25, 1.1))
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => observer.disconnect()
  }, [mobileView])

  const scale = useMemo(() => clamp(autoScale, 0.2, 1.2), [autoScale])

  /** Reprend l'identité déjà saisie dans le CV. */
  const importFromCv = useCallback(() => {
    update({
      senderName: fullName(cv.profile.firstName, cv.profile.lastName),
      senderTitle: cv.profile.title,
      senderPhone: cv.profile.phone,
      senderEmail: cv.profile.email,
      senderCity: [cv.profile.address, cv.profile.city].filter(Boolean).join(', '),
      city: cv.profile.city.split(',')[0] || 'Abidjan',
    })
  }, [cv, update])

  /** Aligne l'habillage de la lettre sur celui du CV. */
  const importDesign = useCallback(() => {
    update({
      theme: cv.settings.theme,
      accent: cv.settings.accent,
      fontFamily: cv.settings.fontFamily,
    })
  }, [cv.settings, update])

  const sameDesign =
    data.theme === cv.settings.theme &&
    data.accent === cv.settings.accent &&
    data.fontFamily === cv.settings.fontFamily

  const hasCv = Boolean(cv.profile.firstName || cv.profile.lastName)

  return (
    <>
      <div className="screen-only flex h-[100dvh] flex-col overflow-hidden bg-cloud">
        <header className="no-print z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-cloud-300 bg-white px-3 sm:h-16 sm:px-5">
          <div className="flex items-center gap-4">
            <Link href="/" aria-label="Retour à l’accueil">
              <Logo />
            </Link>
            <span className="hidden text-xs text-ink-muted lg:inline">Lettre de motivation</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/editeur"
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-2 text-[13px] font-semibold text-ink-muted transition-colors hover:bg-cloud-200 hover:text-ink sm:px-3"
              title="Revenir à mon CV"
            >
              <FileText size={14} />
              <span className="hidden lg:inline">Mon CV</span>
            </Link>
            <button
              type="button"
              onClick={() => setAssistantOpen((v) => !v)}
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
            <ImportCv compact />
            <DownloadMenu current="lettre" />
          </div>
        </header>

        <div className="relative flex min-h-0 flex-1">
          <aside
            className={cn(
              'no-print w-full shrink-0 flex-col border-r border-cloud-300 bg-white lg:flex lg:w-[440px] xl:w-[480px]',
              mobileView === 'form' ? 'flex' : 'hidden',
            )}
          >
            <div className="flex flex-wrap items-center gap-2 border-b border-cloud-300 px-5 py-3">
              <button
                type="button"
                onClick={loadSample}
                className="inline-flex items-center gap-1.5 rounded-full bg-cloud-200 px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-cloud-300"
              >
                <Sparkles size={13} />
                Lettre d’exemple
              </button>
              {hasCv ? (
                <button
                  type="button"
                  onClick={importFromCv}
                  className="inline-flex items-center gap-1.5 rounded-full bg-cloud-200 px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-cloud-300"
                >
                  <Wand2 size={13} />
                  Reprendre mes coordonnées du CV
                </button>
              ) : null}
              <ConfirmButton
                label="Effacer"
                confirmLabel="Confirmer l’effacement ?"
                icon={<Trash2 size={13} />}
                onConfirm={reset}
                title="Effacer la lettre"
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-ink-muted transition-colors hover:bg-cloud-200 hover:text-ink"
                confirmClassName="bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
              />
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-6">
              <Block title="Vos coordonnées">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Nom complet">
                    <TextInput
                      value={data.senderName}
                      onChange={(v) => update({ senderName: v })}
                      placeholder="Aïcha Konaté"
                    />
                  </Field>
                  <Field label="Titre">
                    <TextInput
                      value={data.senderTitle}
                      onChange={(v) => update({ senderTitle: v })}
                      placeholder="Responsable Marketing Digital"
                    />
                  </Field>
                  <Field label="Téléphone">
                    <TextInput
                      value={data.senderPhone}
                      onChange={(v) => update({ senderPhone: v })}
                      placeholder="+225 07 07 12 34 56"
                    />
                  </Field>
                  <Field label="Email">
                    <TextInput
                      value={data.senderEmail}
                      onChange={(v) => update({ senderEmail: v })}
                      placeholder="prenom.nom@email.ci"
                    />
                  </Field>
                  <Field label="Adresse" className="sm:col-span-2">
                    <TextInput
                      value={data.senderCity}
                      onChange={(v) => update({ senderCity: v })}
                      placeholder="Cocody, Abidjan"
                    />
                  </Field>
                </div>
              </Block>

              <Block title="Destinataire">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Entreprise">
                    <TextInput
                      value={data.companyName}
                      onChange={(v) => update({ companyName: v })}
                      placeholder="Groupe Sifca"
                    />
                  </Field>
                  <Field label="Interlocuteur">
                    <TextInput
                      value={data.recipientName}
                      onChange={(v) => update({ recipientName: v })}
                      placeholder="Service Ressources Humaines"
                    />
                  </Field>
                  <Field label="Adresse de l’entreprise">
                    <TextInput
                      value={data.companyAddress}
                      onChange={(v) => update({ companyAddress: v })}
                      placeholder="Plateau, Abidjan"
                    />
                  </Field>
                  <Field label="Ville et date">
                    <div className="flex gap-2">
                      <TextInput
                        value={data.city}
                        onChange={(v) => update({ city: v })}
                        placeholder="Abidjan"
                      />
                      <TextInput
                        value={data.date}
                        onChange={(v) => update({ date: v })}
                        placeholder={formatFrenchDate()}
                      />
                    </div>
                  </Field>
                </div>
              </Block>

              <Block title="Objet">
                <div className="grid gap-4">
                  <Field label="Objet de la lettre">
                    <TextInput
                      value={data.subject}
                      onChange={(v) => update({ subject: v })}
                      placeholder="Candidature au poste de Responsable Marketing Digital"
                    />
                  </Field>
                  <Field label="Référence de l’offre" hint="Où et quand vous avez vu l’annonce.">
                    <TextInput
                      value={data.reference}
                      onChange={(v) => update({ reference: v })}
                      placeholder="Offre publiée sur Emploi.ci le 12 janvier"
                    />
                  </Field>
                </div>
              </Block>

              <Block title="Le corps de la lettre">
                <div className="grid gap-4">
                  <Field label="Formule d’appel">
                    <TextInput
                      value={data.greeting}
                      onChange={(v) => update({ greeting: v })}
                      placeholder="Madame, Monsieur,"
                    />
                  </Field>
                  <Field
                    label="1 · L’accroche"
                    hint="Le poste visé, où vous l’avez vu, et ce qui vous rend pertinent — en deux phrases."
                  >
                    <TextArea
                      value={data.hook}
                      onChange={(v) => update({ hook: v })}
                      rows={4}
                      placeholder="Votre annonce pour le poste de… a retenu mon attention car…"
                    />
                  </Field>
                  <Field
                    label="2 · La preuve"
                    hint="Deux réalisations concrètes et chiffrées, choisies parce qu’elles ressemblent au poste."
                  >
                    <TextArea
                      value={data.proof}
                      onChange={(v) => update({ proof: v })}
                      rows={5}
                      placeholder="Chez…, je pilote un budget de… et nous avons obtenu…"
                    />
                  </Field>
                  <Field
                    label="3 · La projection"
                    hint="Ce que vous comptez apporter dans les six premiers mois."
                  >
                    <TextArea
                      value={data.projection}
                      onChange={(v) => update({ projection: v })}
                      rows={4}
                      placeholder="Rejoindre votre équipe me permettrait de…"
                    />
                  </Field>
                  <Field label="Formule de politesse">
                    <TextArea
                      value={data.closing}
                      onChange={(v) => update({ closing: v })}
                      rows={3}
                    />
                  </Field>
                </div>
              </Block>

              <p className="pb-6 text-center text-xs text-neutral-400">
                Votre lettre est enregistrée automatiquement dans ce navigateur.
              </p>
            </div>
          </aside>

          <div
            ref={stage}
            className={cn(
              'min-w-0 flex-1 overflow-auto bg-cloud-200 lg:block',
              mobileView === 'preview' ? 'block' : 'hidden',
            )}
          >
            <DesignRow
              data={data}
              update={update}
              onImportDesign={importDesign}
              sameDesign={sameDesign}
            />

            <div className="flex justify-center px-6 py-6">
              <div style={{ width: A4_WIDTH * scale, height: A4_HEIGHT * scale }}>
                <div
                  className="origin-top-left"
                  style={{ transform: `scale(${scale})`, width: A4_WIDTH, height: A4_HEIGHT }}
                >
                  <LetterSheet data={data} className="shadow-page ring-1 ring-cloud-300" />
                </div>
              </div>
            </div>
          </div>

          {assistantOpen ? (
            <AssistantPanel mode="lettre" onClose={() => setAssistantOpen(false)} />
          ) : null}
        </div>

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

      {/* Copies plein format utilisées par l'impression et l'export PDF :
          la lettre et le CV, pour pouvoir télécharger les deux d'ici. La lettre
          est gratuite ; le CV ne sort qu'au sein d'une séance payée. */}
      {!rendImpression ? null : (
        <>
          <SeanceTelechargement />
          <div className="print-only print-doc print-doc-cv" aria-hidden>
            {cvImprimable ? (
              <>
                <LienDonneesCv data={cv} />
                <CvSheet data={cv} />
              </>
            ) : (
              <DocumentVerrouille />
            )}
          </div>
          <div className="print-only print-doc print-doc-lettre" aria-hidden>
            <LetterSheet data={data} />
          </div>
        </>
      )}
    </>
  )
}

/** Barre d'habillage : palette, typographie, taille — au-dessus de l'aperçu. */
function DesignRow({
  data,
  update,
  onImportDesign,
  sameDesign,
}: {
  data: LetterData
  update: (patch: Partial<LetterData>) => void
  onImportDesign: () => void
  sameDesign: boolean
}) {
  const palette = THEME_BY_ID[data.theme]
  const police = FONT_CHOICES.find((f) => f.id === data.fontFamily) ?? FONT_CHOICES[0]

  return (
    <div className="no-print sticky top-0 z-20 flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-cloud-300 bg-cloud-200/85 px-4 py-2.5 backdrop-blur">
      {/* Vingt-quatre palettes et neuf polices : elles se replient derrière
          deux boutons pour laisser la place à l'aperçu. */}
      <MenuDeroulant
        label="Couleur"
        valeur={palette?.name ?? 'Personnalisée'}
        largeur={276}
        vignette={
          <span
            className="h-5 w-5 shrink-0 rounded-full ring-1 ring-black/10"
            style={{ background: data.accent }}
            aria-hidden
          />
        }
      >
        {(fermer) => (
          <div className="px-3 py-1.5">
            {FAMILLES.map((famille) => (
              <div key={famille.id} className="mb-3 last:mb-1">
                <p className="mb-1.5 text-[11px] font-medium text-neutral-400">{famille.label}</p>
                <div className="flex flex-wrap gap-2">
                  {THEMES.filter((theme) => theme.family === famille.id).map((theme) => {
                    const active = data.theme === theme.id
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => {
                          update({ theme: theme.id, accent: theme.accent })
                          fermer()
                        }}
                        title={theme.name}
                        aria-label={`Palette ${theme.name}`}
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-full ring-offset-2 transition-all',
                          active ? 'ring-2 ring-ink' : 'hover:scale-110',
                        )}
                        style={{ background: theme.accent }}
                      >
                        {active ? <Check size={13} className="text-white" strokeWidth={3} /> : null}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </MenuDeroulant>

      <MenuDeroulant label="Police" valeur={police.label} largeur={250}>
        {(fermer) =>
          FONT_CHOICES.map((font) => (
            <OptionMenu
              key={font.id}
              choisi={data.fontFamily === font.id}
              titre={font.label}
              detail={font.hint}
              vignette={
                <span
                  className="shrink-0 text-[17px] leading-none text-ink"
                  style={{ fontFamily: font.css }}
                  aria-hidden
                >
                  Ag
                </span>
              }
              onClick={() => {
                update({ fontFamily: font.id as FontChoice })
                fermer()
              }}
            />
          ))
        }
      </MenuDeroulant>

      <div className="flex shrink-0 items-center gap-1 rounded-full border border-cloud-400 bg-white p-1">
        {SCALES.map((scale) => (
          <button
            key={scale.label}
            type="button"
            onClick={() => update({ fontScale: scale.value })}
            className={cn(
              'h-7 w-8 rounded-full text-[12px] font-bold transition-colors',
              data.fontScale === scale.value
                ? 'bg-ink text-white'
                : 'text-ink-muted hover:bg-cloud-200 hover:text-ink',
            )}
          >
            {scale.label}
          </button>
        ))}
      </div>

      {!sameDesign ? (
        <button
          type="button"
          onClick={onImportDesign}
          className="shrink-0 rounded-full border border-cloud-400 bg-white px-3.5 py-1.5 text-[12px] font-semibold text-ink transition-colors hover:border-ink"
        >
          Assortir au CV
        </button>
      ) : null}
    </div>
  )
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-4 border-b border-cloud-300 pb-2 text-[15px] font-bold text-ink">
        {title}
      </h2>
      {children}
    </section>
  )
}
