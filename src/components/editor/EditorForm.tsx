'use client'

import { useRef, useState } from 'react'
import { ImagePlus, Sparkles, Trash2 } from 'lucide-react'
import {
  Accordion,
  AddButton,
  Field,
  ItemCard,
  RangeInput,
  TextArea,
  TextInput,
} from '@/components/editor/fields'
import { ConfirmButton } from '@/components/ui/ConfirmButton'
import { useCvStore } from '@/lib/store'

type PanelId =
  | 'profile'
  | 'experiences'
  | 'educations'
  | 'skills'
  | 'languages'
  | 'awards'
  | 'references'
  | 'hobbies'

export function EditorForm() {
  const data = useCvStore((s) => s.data)
  const setProfile = useCvStore((s) => s.setProfile)
  const setHobbies = useCvStore((s) => s.setHobbies)
  const addItem = useCvStore((s) => s.addItem)
  const updateItem = useCvStore((s) => s.updateItem)
  const removeItem = useCvStore((s) => s.removeItem)
  const moveItem = useCvStore((s) => s.moveItem)
  const loadSample = useCvStore((s) => s.loadSample)
  const reset = useCvStore((s) => s.reset)

  const [open, setOpen] = useState<PanelId>('profile')
  /** Message d'erreur affiché sous le bouton photo, sans fenêtre système. */
  const [photoErreur, setPhotoErreur] = useState('')
  const toggle = (panel: PanelId) => setOpen((current) => (current === panel ? ('' as PanelId) : panel))
  const fileInput = useRef<HTMLInputElement>(null)

  const onPhoto = (file?: File) => {
    if (!file) return
    if (file.size > 2_000_000) {
      setPhotoErreur('Photo trop lourde : choisissez une image de moins de 2 Mo.')
      return
    }
    setPhotoErreur('')
    const reader = new FileReader()
    reader.onload = () => setProfile({ photo: String(reader.result) })
    reader.onerror = () => setPhotoErreur('Image illisible : essayez un fichier JPG ou PNG.')
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-cloud-300 px-5 py-3">
        <button
          type="button"
          onClick={loadSample}
          className="inline-flex items-center gap-1.5 rounded-full bg-cloud-200 px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-cloud-300"
        >
          <Sparkles size={13} />
          Remplir avec l’exemple
        </button>
        <ConfirmButton
          label="Tout effacer"
          confirmLabel="Confirmer l’effacement ?"
          icon={<Trash2 size={13} />}
          onConfirm={reset}
          title="Effacer toutes les informations saisies"
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-ink-muted transition-colors hover:bg-cloud-200 hover:text-ink"
          confirmClassName="bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Profil ------------------------------------------------------- */}
        <Accordion title="Informations personnelles" open={open === 'profile'} onToggle={() => toggle('profile')}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Prénom">
              <TextInput
                value={data.profile.firstName}
                onChange={(v) => setProfile({ firstName: v })}
                placeholder="Aïcha"
              />
            </Field>
            <Field label="Nom">
              <TextInput
                value={data.profile.lastName}
                onChange={(v) => setProfile({ lastName: v })}
                placeholder="Konaté"
              />
            </Field>
            <Field label="Titre du poste" className="sm:col-span-2">
              <TextInput
                value={data.profile.title}
                onChange={(v) => setProfile({ title: v })}
                placeholder="Responsable Marketing Digital"
              />
            </Field>
            <Field label="Téléphone">
              <TextInput
                value={data.profile.phone}
                onChange={(v) => setProfile({ phone: v })}
                placeholder="+225 07 07 12 34 56"
              />
            </Field>
            <Field label="Email">
              <TextInput
                type="email"
                value={data.profile.email}
                onChange={(v) => setProfile({ email: v })}
                placeholder="prenom.nom@email.ci"
              />
            </Field>
            <Field label="Site / LinkedIn">
              <TextInput
                value={data.profile.website}
                onChange={(v) => setProfile({ website: v })}
                placeholder="linkedin.com/in/…"
              />
            </Field>
            <Field label="Quartier / rue">
              <TextInput
                value={data.profile.address}
                onChange={(v) => setProfile({ address: v })}
                placeholder="Rue des Jardins, Cocody"
              />
            </Field>
            <Field label="Ville, pays" className="sm:col-span-2">
              <TextInput
                value={data.profile.city}
                onChange={(v) => setProfile({ city: v })}
                placeholder="Abidjan, Côte d’Ivoire"
              />
            </Field>
            <Field
              label="Accroche / à propos"
              hint="3 à 4 lignes : votre métier, vos années d’expérience, votre valeur ajoutée."
              className="sm:col-span-2"
            >
              <TextArea
                value={data.profile.about}
                onChange={(v) => setProfile({ about: v })}
                rows={5}
                placeholder="Responsable marketing digital avec 8 ans d’expérience à Abidjan…"
              />
            </Field>

            <div className="sm:col-span-2">
              <span className="field-label">Photo</span>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => onPhoto(event.target.files?.[0])}
                />
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="inline-flex items-center gap-2 rounded-lg border border-cloud-400 px-3 py-2 text-sm font-semibold text-ink transition-colors hover:border-ink"
                >
                  <ImagePlus size={15} />
                  {data.profile.photo ? 'Changer la photo' : 'Ajouter une photo'}
                </button>
                {data.profile.photo ? (
                  <button
                    type="button"
                    onClick={() => setProfile({ photo: undefined })}
                    className="text-sm font-semibold text-ink-muted hover:text-ink"
                  >
                    Retirer
                  </button>
                ) : null}
              </div>
              {photoErreur ? (
                <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-[12px] font-medium text-red-700">
                  {photoErreur}
                </p>
              ) : null}
            </div>
          </div>
        </Accordion>

        {/* Expériences -------------------------------------------------- */}
        <Accordion
          title="Expériences professionnelles"
          count={data.experiences.length}
          open={open === 'experiences'}
          onToggle={() => toggle('experiences')}
        >
          {data.experiences.map((exp, index) => (
            <ItemCard
              key={exp.id}
              index={index}
              title="Expérience"
              onRemove={() => removeItem('experiences', exp.id)}
              onMoveUp={() => moveItem('experiences', exp.id, -1)}
              onMoveDown={() => moveItem('experiences', exp.id, 1)}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Poste" className="sm:col-span-2">
                  <TextInput
                    value={exp.role}
                    onChange={(v) => updateItem('experiences', exp.id, { role: v })}
                    placeholder="Responsable Marketing Digital"
                  />
                </Field>
                <Field label="Entreprise">
                  <TextInput
                    value={exp.company}
                    onChange={(v) => updateItem('experiences', exp.id, { company: v })}
                    placeholder="Ivoire Telecom"
                  />
                </Field>
                <Field label="Lieu">
                  <TextInput
                    value={exp.location}
                    onChange={(v) => updateItem('experiences', exp.id, { location: v })}
                    placeholder="Abidjan"
                  />
                </Field>
                <Field label="Début">
                  <TextInput
                    value={exp.start}
                    onChange={(v) => updateItem('experiences', exp.id, { start: v })}
                    placeholder="2021"
                  />
                </Field>
                <Field label="Fin">
                  <TextInput
                    value={exp.end}
                    onChange={(v) => updateItem('experiences', exp.id, { end: v })}
                    placeholder="2024"
                  />
                </Field>
                <label className="flex items-center gap-2 text-sm text-ink sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={exp.current}
                    onChange={(event) =>
                      updateItem('experiences', exp.id, { current: event.target.checked })
                    }
                    className="h-4 w-4 rounded border-cloud-400 accent-ink"
                  />
                  Poste occupé actuellement
                </label>
                <Field
                  label="Missions et résultats"
                  hint="Une ligne par mission. Commencez par un verbe d’action et chiffrez vos résultats."
                  className="sm:col-span-2"
                >
                  <TextArea
                    value={exp.description}
                    onChange={(v) => updateItem('experiences', exp.id, { description: v })}
                    rows={4}
                    placeholder={'Pilotage d’un budget de 120 M FCFA\nCroissance de 42 % des inscriptions'}
                  />
                </Field>
              </div>
            </ItemCard>
          ))}
          <AddButton label="Ajouter une expérience" onClick={() => addItem('experiences')} />
        </Accordion>

        {/* Formations --------------------------------------------------- */}
        <Accordion
          title="Formations"
          count={data.educations.length}
          open={open === 'educations'}
          onToggle={() => toggle('educations')}
        >
          {data.educations.map((edu, index) => (
            <ItemCard
              key={edu.id}
              index={index}
              title="Formation"
              onRemove={() => removeItem('educations', edu.id)}
              onMoveUp={() => moveItem('educations', edu.id, -1)}
              onMoveDown={() => moveItem('educations', edu.id, 1)}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Diplôme" className="sm:col-span-2">
                  <TextInput
                    value={edu.degree}
                    onChange={(v) => updateItem('educations', edu.id, { degree: v })}
                    placeholder="Master Marketing & Stratégie"
                  />
                </Field>
                <Field label="Établissement">
                  <TextInput
                    value={edu.school}
                    onChange={(v) => updateItem('educations', edu.id, { school: v })}
                    placeholder="INP-HB"
                  />
                </Field>
                <Field label="Lieu">
                  <TextInput
                    value={edu.location}
                    onChange={(v) => updateItem('educations', edu.id, { location: v })}
                    placeholder="Yamoussoukro"
                  />
                </Field>
                <Field label="Début">
                  <TextInput
                    value={edu.start}
                    onChange={(v) => updateItem('educations', edu.id, { start: v })}
                    placeholder="2014"
                  />
                </Field>
                <Field label="Fin">
                  <TextInput
                    value={edu.end}
                    onChange={(v) => updateItem('educations', edu.id, { end: v })}
                    placeholder="2016"
                  />
                </Field>
                <Field label="Précisions" className="sm:col-span-2">
                  <TextArea
                    value={edu.description}
                    onChange={(v) => updateItem('educations', edu.id, { description: v })}
                    rows={2}
                    placeholder="Mention Bien. Spécialisation marketing digital."
                  />
                </Field>
              </div>
            </ItemCard>
          ))}
          <AddButton label="Ajouter une formation" onClick={() => addItem('educations')} />
        </Accordion>

        {/* Compétences -------------------------------------------------- */}
        <Accordion
          title="Compétences"
          count={data.skills.length}
          open={open === 'skills'}
          onToggle={() => toggle('skills')}
        >
          {data.skills.map((skill) => (
            <div key={skill.id} className="mb-3 flex items-center gap-3">
              <input
                className="field flex-1"
                value={skill.name}
                placeholder="Stratégie digitale"
                onChange={(event) => updateItem('skills', skill.id, { name: event.target.value })}
              />
              <div className="w-28 shrink-0">
                <RangeInput
                  value={skill.level}
                  onChange={(v) => updateItem('skills', skill.id, { level: v })}
                />
              </div>
              <button
                type="button"
                onClick={() => removeItem('skills', skill.id)}
                className="rounded-md p-2 text-ink-muted hover:bg-cloud-200 hover:text-ink"
                aria-label="Supprimer la compétence"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <AddButton label="Ajouter une compétence" onClick={() => addItem('skills')} />
        </Accordion>

        {/* Langues ------------------------------------------------------ */}
        <Accordion
          title="Langues"
          count={data.languages.length}
          open={open === 'languages'}
          onToggle={() => toggle('languages')}
        >
          {data.languages.map((lang) => (
            <div key={lang.id} className="mb-3 flex items-center gap-3">
              <input
                className="field flex-1"
                value={lang.name}
                placeholder="Français"
                onChange={(event) => updateItem('languages', lang.id, { name: event.target.value })}
              />
              <div className="w-28 shrink-0">
                <RangeInput
                  value={lang.level}
                  onChange={(v) => updateItem('languages', lang.id, { level: v })}
                />
              </div>
              <button
                type="button"
                onClick={() => removeItem('languages', lang.id)}
                className="rounded-md p-2 text-ink-muted hover:bg-cloud-200 hover:text-ink"
                aria-label="Supprimer la langue"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <AddButton label="Ajouter une langue" onClick={() => addItem('languages')} />
        </Accordion>

        {/* Distinctions ------------------------------------------------- */}
        <Accordion
          title="Distinctions"
          count={data.awards.length}
          open={open === 'awards'}
          onToggle={() => toggle('awards')}
        >
          {data.awards.map((award, index) => (
            <ItemCard
              key={award.id}
              index={index}
              title="Distinction"
              onRemove={() => removeItem('awards', award.id)}
              onMoveUp={() => moveItem('awards', award.id, -1)}
              onMoveDown={() => moveItem('awards', award.id, 1)}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Intitulé" className="sm:col-span-2">
                  <TextInput
                    value={award.title}
                    onChange={(v) => updateItem('awards', award.id, { title: v })}
                    placeholder="Campagne de l’année"
                  />
                </Field>
                <Field label="Organisme">
                  <TextInput
                    value={award.organization}
                    onChange={(v) => updateItem('awards', award.id, { organization: v })}
                    placeholder="Ivoire Digital Awards"
                  />
                </Field>
                <Field label="Année">
                  <TextInput
                    value={award.period}
                    onChange={(v) => updateItem('awards', award.id, { period: v })}
                    placeholder="2023"
                  />
                </Field>
                <Field label="Description" className="sm:col-span-2">
                  <TextArea
                    value={award.description}
                    onChange={(v) => updateItem('awards', award.id, { description: v })}
                    rows={2}
                  />
                </Field>
              </div>
            </ItemCard>
          ))}
          <AddButton label="Ajouter une distinction" onClick={() => addItem('awards')} />
        </Accordion>

        {/* Références --------------------------------------------------- */}
        <Accordion
          title="Références"
          count={data.references.length}
          open={open === 'references'}
          onToggle={() => toggle('references')}
        >
          {data.references.map((ref, index) => (
            <ItemCard
              key={ref.id}
              index={index}
              title="Référence"
              onRemove={() => removeItem('references', ref.id)}
              onMoveUp={() => moveItem('references', ref.id, -1)}
              onMoveDown={() => moveItem('references', ref.id, 1)}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nom et prénom">
                  <TextInput
                    value={ref.name}
                    onChange={(v) => updateItem('references', ref.id, { name: v })}
                    placeholder="Koffi N’Guessan"
                  />
                </Field>
                <Field label="Fonction">
                  <TextInput
                    value={ref.role}
                    onChange={(v) => updateItem('references', ref.id, { role: v })}
                    placeholder="Directeur Marketing"
                  />
                </Field>
                <Field label="Entreprise">
                  <TextInput
                    value={ref.company}
                    onChange={(v) => updateItem('references', ref.id, { company: v })}
                    placeholder="Ivoire Telecom"
                  />
                </Field>
                <Field label="Contact">
                  <TextInput
                    value={ref.contact}
                    onChange={(v) => updateItem('references', ref.id, { contact: v })}
                    placeholder="+225 01 02 03 04 05"
                  />
                </Field>
              </div>
            </ItemCard>
          ))}
          <AddButton label="Ajouter une référence" onClick={() => addItem('references')} />
        </Accordion>

        {/* Centres d’intérêt -------------------------------------------- */}
        <Accordion
          title="Centres d’intérêt"
          count={data.hobbies.length}
          open={open === 'hobbies'}
          onToggle={() => toggle('hobbies')}
        >
          <Field label="Séparés par une virgule" hint="Affichés sur le modèle Cocody.">
            <TextInput
              value={data.hobbies.join(', ')}
              onChange={(v) =>
                setHobbies(
                  v
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean),
                )
              }
              placeholder="Lecture, Course à pied, Photographie"
            />
          </Field>
        </Accordion>

        <div className="px-5 py-8 text-center text-xs text-neutral-400">
          Vos informations sont enregistrées automatiquement dans ce navigateur.
        </div>
      </div>
    </div>
  )
}
