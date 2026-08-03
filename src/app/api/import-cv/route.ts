import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod'
import { z as z4 } from 'zod/v4'
import { EMPTY_CV } from '@/data/sample-cv'
import { parseCvText } from '@/lib/cv-parse'
import type { CvData } from '@/lib/types'
import { uid } from '@/lib/utils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Transforme le texte d'un CV existant en champs de l'éditeur.
 *
 * Avec `ANTHROPIC_API_KEY`, Claude fait la structuration : c'est lui qui
 * distingue un intitulé de poste d'un nom d'entreprise ou d'une date. Sans
 * clé — ou en cas de panne — l'analyse locale de `cv-parse.ts` prend le
 * relais. Dans les deux cas, rien n'est écrit dans l'éditeur sans validation
 * de l'utilisateur : la route se contente de proposer un contenu.
 */

const requestSchema = z.object({
  text: z.string().min(20).max(60_000),
})

/** Forme attendue de Claude — volontairement plate et sans champ optionnel. */
const structure = z4.object({
  firstName: z4.string(),
  lastName: z4.string(),
  title: z4.string(),
  email: z4.string(),
  phone: z4.string(),
  website: z4.string(),
  address: z4.string(),
  city: z4.string(),
  about: z4.string(),
  experiences: z4.array(
    z4.object({
      role: z4.string(),
      company: z4.string(),
      location: z4.string(),
      start: z4.string(),
      end: z4.string(),
      current: z4.boolean(),
      description: z4.string(),
    }),
  ),
  educations: z4.array(
    z4.object({
      degree: z4.string(),
      school: z4.string(),
      location: z4.string(),
      start: z4.string(),
      end: z4.string(),
      description: z4.string(),
    }),
  ),
  skills: z4.array(z4.string()),
  languages: z4.array(z4.object({ name: z4.string(), level: z4.number() })),
  awards: z4.array(
    z4.object({ title: z4.string(), organization: z4.string(), period: z4.string(), description: z4.string() }),
  ),
  hobbies: z4.array(z4.string()),
})

type Structure = z4.infer<typeof structure>

const SYSTEM = `Tu extrais le contenu d'un CV existant pour le replacer dans un éditeur de CV.

Règles :
- Recopie fidèlement ce qui est écrit. N'invente rien, ne reformule pas, ne complète pas : un champ absent reste une chaîne vide ou un tableau vide.
- Dates : garde l'année sur quatre chiffres (« 2019 »). Poste toujours en cours : "current": true et "end" vide.
- "description" d'une expérience : une mission par ligne, séparées par des retours à la ligne, sans puce ni tiret au début.
- "level" d'une langue : 100 langue maternelle ou bilingue, 85 courant, 60 intermédiaire, 35 notions.
- Le texte vient d'un PDF : l'ordre des blocs peut être bousculé et des colonnes peuvent se mélanger. Rattache chaque information à la bonne rubrique d'après son sens, pas d'après sa position.
- Ne mets jamais un intitulé de rubrique (« Expérience », « Formation ») dans un champ.`

/** Passe de la forme plate du modèle au document de l'éditeur. */
function toCvData(s: Structure): CvData {
  const base = JSON.parse(JSON.stringify(EMPTY_CV)) as CvData
  return {
    ...base,
    profile: {
      ...base.profile,
      firstName: s.firstName,
      lastName: s.lastName,
      title: s.title,
      email: s.email,
      phone: s.phone,
      website: s.website,
      address: s.address,
      city: s.city,
      about: s.about,
    },
    experiences: s.experiences.map((item) => ({ id: uid('exp'), ...item })),
    educations: s.educations.map((item) => ({ id: uid('edu'), ...item })),
    skills: s.skills.map((name) => ({ id: uid('sk'), name, level: 70 })),
    languages: s.languages.map((item) => ({
      id: uid('lg'),
      name: item.name,
      level: Math.min(100, Math.max(10, Math.round(item.level || 70))),
    })),
    awards: s.awards.map((item) => ({ id: uid('aw'), ...item })),
    hobbies: s.hobbies,
  }
}

/** Résumé lisible de ce qui a été reconnu, pour l'écran de confirmation. */
function resume(data: CvData) {
  const found: string[] = []
  if (data.profile.firstName || data.profile.lastName) found.push('Nom et prénom')
  if (data.profile.title) found.push('Titre du poste')
  if (data.profile.email) found.push('Email')
  if (data.profile.phone) found.push('Téléphone')
  if (data.profile.city) found.push('Ville')
  if (data.profile.about) found.push('Accroche')
  if (data.experiences.length) found.push(`${data.experiences.length} expérience(s)`)
  if (data.educations.length) found.push(`${data.educations.length} formation(s)`)
  if (data.skills.length) found.push(`${data.skills.length} compétence(s)`)
  if (data.languages.length) found.push(`${data.languages.length} langue(s)`)
  if (data.awards.length) found.push(`${data.awards.length} distinction(s)`)
  if (data.hobbies.length) found.push(`${data.hobbies.length} centre(s) d’intérêt`)
  return found
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null)
  const parsed = requestSchema.safeParse(payload)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Texte trop court ou illisible pour être analysé.' },
      { status: 400 },
    )
  }

  const { text } = parsed.data
  const apiKey = process.env.ANTHROPIC_API_KEY

  const local = () => {
    const { data, found } = parseCvText(text)
    return NextResponse.json({ data, found, source: 'local' as const })
  }

  if (!apiKey) return local()

  try {
    const client = new Anthropic({ apiKey })
    const response = await client.messages.parse({
      model: 'claude-opus-5',
      max_tokens: 8000,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'medium', format: zodOutputFormat(structure) },
      system: SYSTEM,
      messages: [
        { role: 'user', content: `Voici le texte extrait d'un CV :\n\n${text}` },
      ],
    })

    if (!response.parsed_output) return local()

    const data = toCvData(response.parsed_output)
    return NextResponse.json({ data, found: resume(data), source: 'ia' as const })
  } catch (error) {
    console.error('Analyse du CV importé indisponible, bascule sur l’analyse locale.', error)
    return local()
  }
}
