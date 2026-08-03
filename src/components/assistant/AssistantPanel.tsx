'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Check, Loader2, Sparkles, X } from 'lucide-react'
import { Field, TextArea, TextInput } from '@/components/editor/fields'
import { useCvStore } from '@/lib/store'
import { useLetterStore } from '@/lib/letter'
import {
  EMPTY_OUTPUT,
  buildBrief,
  requestAssistant,
  type AssistantResult,
  type AssistantTask,
} from '@/lib/assistant'
import { cn, fullName, uid } from '@/lib/utils'

const CV_TASKS: { id: AssistantTask; label: string; hint: string }[] = [
  {
    id: 'cv',
    label: 'Tout mon CV',
    hint: 'Accroche, toutes les expériences et les compétences, d’un coup',
  },
  { id: 'accroche', label: 'Mon accroche', hint: 'Le paragraphe de présentation en haut du CV' },
  { id: 'experience', label: 'Une expérience', hint: 'Transformer une mission en lignes lisibles' },
  { id: 'competences', label: 'Mes compétences', hint: 'Des compétences attendues sur ce poste' },
  {
    id: 'lettre',
    label: 'Ma lettre de motivation',
    hint: 'Écrite à partir du CV, pour une entreprise précise',
  },
]

/**
 * Assistant de rédaction. Le même panneau sert dans l'éditeur de CV et dans
 * celui de la lettre de motivation ; `mode` change les tâches proposées et la
 * destination des textes générés.
 */
export function AssistantPanel({ mode, onClose }: { mode: 'cv' | 'lettre'; onClose: () => void }) {
  const cv = useCvStore((s) => s.data)
  const setProfile = useCvStore((s) => s.setProfile)
  const updateItem = useCvStore((s) => s.updateItem)
  const replace = useCvStore((s) => s.replace)
  const letter = useLetterStore((s) => s.data)
  const setLetter = useLetterStore((s) => s.set)

  const [task, setTask] = useState<AssistantTask>(mode === 'lettre' ? 'lettre' : 'cv')
  const [experienceIndex, setExperienceIndex] = useState(0)
  const [company, setCompany] = useState(letter.companyName)
  const [targetRole, setTargetRole] = useState(letter.subject ? '' : cv.profile.title)
  const [offer, setOffer] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AssistantResult | null>(null)
  const [inserted, setInserted] = useState(false)

  const experiences = cv.experiences
  const hasContent = useMemo(
    () =>
      Boolean(
        cv.profile.title ||
          cv.experiences.length ||
          cv.educations.length ||
          cv.skills.length,
      ),
    [cv],
  )

  const run = async () => {
    setLoading(true)
    setInserted(false)
    setResult(null)
    const brief = buildBrief(cv, task, { company, targetRole, offer, experienceIndex })
    const answer = await requestAssistant(brief)
    setResult(answer)
    setLoading(false)
  }

  const insert = () => {
    if (!result) return

    if (task === 'cv') {
      // Un seul écrit dans le store : accroche, expériences et compétences.
      const experiences = cv.experiences.map((item, index) => {
        const written = result.experiences.find((entry) => entry.index === index)
        return written?.bullets.length
          ? { ...item, description: written.bullets.join('\n') }
          : item
      })
      replace({
        ...cv,
        profile: { ...cv.profile, about: result.accroche || cv.profile.about },
        experiences,
        skills: [
          ...cv.skills,
          ...result.competences.map((name) => ({ id: uid('sk'), name, level: 70 })),
        ],
      })
      setInserted(true)
      return
    }

    if (task === 'accroche' && result.accroche) {
      setProfile({ about: result.accroche })
    }
    if (task === 'experience' && result.bullets.length) {
      const target = experiences[experienceIndex]
      if (target) updateItem('experiences', target.id, { description: result.bullets.join('\n') })
    }
    if (task === 'competences' && result.competences.length) {
      replace({
        ...cv,
        skills: [
          ...cv.skills,
          ...result.competences.map((name) => ({ id: uid('sk'), name, level: 70 })),
        ],
      })
    }
    if (task === 'lettre') {
      // La lettre est écrite entièrement : coordonnées reprises du CV quand
      // elles manquent, destinataire, objet, puis les trois paragraphes.
      const senderName = letter.senderName || fullName(cv.profile.firstName, cv.profile.lastName)
      setLetter({
        senderName,
        senderTitle: letter.senderTitle || cv.profile.title,
        senderPhone: letter.senderPhone || cv.profile.phone,
        senderEmail: letter.senderEmail || cv.profile.email,
        senderCity:
          letter.senderCity || [cv.profile.address, cv.profile.city].filter(Boolean).join(', '),
        city: letter.city || cv.profile.city.split(',')[0] || 'Abidjan',
        companyName: company || letter.companyName,
        recipientName: letter.recipientName || 'À l’attention du service Ressources Humaines',
        subject: result.lettre.subject || letter.subject,
        hook: result.lettre.hook,
        proof: result.lettre.proof,
        projection: result.lettre.projection,
        theme: letter.theme,
        fontFamily: letter.fontFamily,
      })
    }
    setInserted(true)
  }

  const output = result ?? EMPTY_OUTPUT

  return (
    <aside
      className="no-print absolute inset-y-0 right-0 z-40 flex w-full max-w-[420px] flex-col border-l border-cloud-300 bg-white shadow-float lg:static lg:shadow-none"
      aria-label="Assistant de rédaction"
    >
      <header className="flex items-start justify-between gap-3 border-b border-cloud-300 p-5">
        <div>
          <h2 className="flex items-center gap-2 text-[15px] font-bold text-ink">
            <Sparkles size={16} className="text-azur-600" />
            Assistant de rédaction
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">
            {mode === 'lettre'
              ? 'Il reprend votre CV pour écrire la lettre. Ni téléphone, ni e-mail, ni photo ne sont envoyés.'
              : 'Il rédige tout le CV ou une partie seulement. Ni téléphone, ni e-mail, ni photo ne sont envoyés.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="-mr-1 -mt-1 rounded-full p-2 text-ink-muted transition-colors hover:bg-cloud-200 hover:text-ink"
          aria-label="Fermer l’assistant"
        >
          <X size={16} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        {mode === 'cv' ? (
          <section className="mb-5">
            <h3 className="eyebrow mb-3">Que voulez-vous écrire ?</h3>
            <div className="grid gap-2">
              {CV_TASKS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setTask(item.id)
                    setResult(null)
                    setInserted(false)
                  }}
                  className={cn(
                    'rounded-xl border px-4 py-3 text-left transition-colors',
                    task === item.id
                      ? 'border-ink bg-cloud'
                      : 'border-cloud-300 hover:border-neutral-400',
                  )}
                >
                  <span className="block text-[13px] font-semibold text-ink">{item.label}</span>
                  <span className="mt-0.5 block text-[11px] text-ink-muted">{item.hint}</span>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {mode === 'cv' && task === 'experience' ? (
          <Field label="Expérience à détailler">
            {experiences.length ? (
              <select
                className="field"
                value={experienceIndex}
                onChange={(event) => setExperienceIndex(Number(event.target.value))}
              >
                {experiences.map((item, index) => (
                  <option key={item.id} value={index}>
                    {item.role || 'Poste'} {item.company ? `— ${item.company}` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-[13px] text-ink-muted">
                Ajoutez d’abord une expérience dans le formulaire.
              </p>
            )}
          </Field>
        ) : null}

        {mode === 'cv' && task === 'accroche' ? (
          <Field label="Poste visé" hint="Facultatif : l’accroche sera orientée vers ce poste.">
            <TextInput
              value={targetRole}
              onChange={setTargetRole}
              placeholder={cv.profile.title || 'Responsable logistique'}
            />
          </Field>
        ) : null}

        {task === 'lettre' ? (
          <div className="grid gap-4">
            <Field label="Entreprise">
              <TextInput value={company} onChange={setCompany} placeholder="Groupe Sifca" />
            </Field>
            <Field label="Poste visé">
              <TextInput
                value={targetRole}
                onChange={setTargetRole}
                placeholder={cv.profile.title || 'Responsable Marketing Digital'}
              />
            </Field>
            <Field
              label="Texte de l’annonce"
              hint="Facultatif : collez l’offre, la lettre reprendra ses mots-clés."
            >
              <TextArea value={offer} onChange={setOffer} rows={5} placeholder="Missions : …" />
            </Field>
          </div>
        ) : null}

        {!hasContent ? (
          <p className="mt-4 rounded-xl border border-cloud-300 bg-cloud px-4 py-3 text-[12px] leading-relaxed text-ink-muted">
            Votre CV est encore vide. Remplissez au moins votre titre et une expérience — l’assistant
            n’invente ni employeur ni diplôme.
          </p>
        ) : null}

        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-azur-btn text-[14px] font-semibold text-white transition-[filter] hover:brightness-110 disabled:opacity-60"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {loading
            ? 'Rédaction en cours…'
            : task === 'cv'
              ? 'Rédiger tout mon CV'
              : task === 'lettre'
                ? 'Rédiger ma lettre'
                : 'Rédiger'}
        </button>

        {result ? (
          <section className="mt-6 border-t border-cloud-200 pt-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="eyebrow">Proposition</h3>
              <span
                className={cn(
                  'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em]',
                  result.source === 'ia' ? 'bg-azur-100 text-navy-700' : 'bg-cloud-200 text-ink-muted',
                )}
              >
                {result.source === 'ia' ? 'Rédigé par l’IA' : 'Modèle intégré'}
              </span>
            </div>

            {task === 'accroche' && output.accroche ? (
              <p className="whitespace-pre-line rounded-xl border border-cloud-300 bg-cloud p-4 text-[13px] leading-relaxed text-ink">
                {output.accroche}
              </p>
            ) : null}

            {task === 'cv' ? (
              <div className="space-y-4">
                {output.accroche ? (
                  <div>
                    <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-ink-muted">
                      Accroche
                    </p>
                    <p className="rounded-xl border border-cloud-300 bg-cloud p-4 text-[13px] leading-relaxed text-ink">
                      {output.accroche}
                    </p>
                  </div>
                ) : null}

                {output.experiences.map((entry) => {
                  const source = experiences[entry.index]
                  return (
                    <div key={entry.index}>
                      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-ink-muted">
                        {source?.role || `Expérience ${entry.index + 1}`}
                        {source?.company ? ` — ${source.company}` : ''}
                      </p>
                      <ul className="space-y-2 rounded-xl border border-cloud-300 bg-cloud p-4">
                        {entry.bullets.map((line, index) => (
                          <li key={index} className="flex gap-2 text-[13px] leading-relaxed text-ink">
                            <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-ink-muted" />
                            {line}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}

                {output.competences.length ? (
                  <div>
                    <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-ink-muted">
                      Compétences à ajouter
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {output.competences.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full border border-cloud-400 bg-white px-3 py-1.5 text-[12px] font-medium text-ink"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {task === 'experience' && output.bullets.length ? (
              <ul className="space-y-2 rounded-xl border border-cloud-300 bg-cloud p-4">
                {output.bullets.map((line, index) => (
                  <li key={index} className="flex gap-2 text-[13px] leading-relaxed text-ink">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-ink-muted" />
                    {line}
                  </li>
                ))}
              </ul>
            ) : null}

            {task === 'competences' && output.competences.length ? (
              <div className="flex flex-wrap gap-2">
                {output.competences.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-cloud-400 bg-white px-3 py-1.5 text-[12px] font-medium text-ink"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : null}

            {task === 'lettre' ? (
              <div className="space-y-3">
                {output.lettre.subject ? (
                  <p className="text-[13px] font-semibold text-ink">
                    Objet : {output.lettre.subject}
                  </p>
                ) : null}
                {[output.lettre.hook, output.lettre.proof, output.lettre.projection]
                  .filter(Boolean)
                  .map((paragraph, index) => (
                    <p
                      key={index}
                      className="rounded-xl border border-cloud-300 bg-cloud p-4 text-[13px] leading-relaxed text-ink"
                    >
                      {paragraph}
                    </p>
                  ))}
              </div>
            ) : null}

            {output.conseils.length ? (
              <ul className="mt-4 space-y-1.5">
                {output.conseils.map((tip, index) => (
                  <li key={index} className="text-[11px] leading-relaxed text-ink-muted">
                    · {tip}
                  </li>
                ))}
              </ul>
            ) : null}

            <button
              type="button"
              onClick={insert}
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-ink text-[14px] font-semibold text-white transition-colors hover:bg-ink-soft"
            >
              {inserted ? <Check size={16} /> : null}
              {inserted
                ? 'Inséré'
                : task === 'cv'
                  ? 'Écrire tout ça dans mon CV'
                  : task === 'competences'
                  ? 'Ajouter à mes compétences'
                  : task === 'lettre'
                    ? 'Insérer dans ma lettre'
                    : 'Insérer dans mon CV'}
            </button>

            {task === 'lettre' && mode === 'cv' ? (
              <Link
                href="/lettre-de-motivation"
                className="mt-3 block text-center text-[12px] font-semibold text-navy-700 underline underline-offset-2"
              >
                Ouvrir la lettre pour la télécharger
              </Link>
            ) : null}
          </section>
        ) : null}
      </div>
    </aside>
  )
}
