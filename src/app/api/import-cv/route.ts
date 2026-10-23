import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod'
import { z } from 'zod'
import { z as z4 } from 'zod/v4'
import { EMPTY_CV } from '@/data/sample-cv'
import { parseCvText } from '@/lib/cv-parse'
import type { CvData } from '@/lib/types'
import { uid } from '@/lib/utils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Transforme un CV existant — son texte, ou ses pages en image — en champs de
 * l'éditeur.
 *
 * Avec `ANTHROPIC_API_KEY`, Claude fait la structuration : c'est lui qui
 * distingue un intitulé de poste d'un nom d'entreprise ou d'une date, et qui
 * lit une photo de CV. Sans clé — ou en cas de panne — l'analyse locale de
 * `cv-parse.ts` prend le relais pour le texte ; pour une image, la route
 * répond 503 et le navigateur bascule sur sa propre reconnaissance de texte.
 *
 * Le navigateur n'appelle cette route qu'après l'accord explicite de
 * l'utilisateur, prévenu que son CV (coordonnées et photo comprises) sera lu
 * par Anthropic. Rien n'est écrit dans l'éditeur sans sa validation : la
 * route se contente de proposer un contenu, et ne conserve rien.
 */

/** Une page de CV en JPEG ne dépasse guère 1 Mo ; 5 Mo est la limite de l'API. */
const IMAGE_MAX = 5_000_000

const requestSchema = z.union([
  z.object({ text: z.string().min(20).max(60_000) }),
  z.object({
    images: z
      .array(z.string().min(100).max(Math.ceil((IMAGE_MAX * 4) / 3)).regex(/^[A-Za-z0-9+/=]+$/))
      .min(1)
      .max(3),
  }),
])

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
- Le texte vient souvent d'un PDF : l'ordre des blocs peut être bousculé et des colonnes peuvent se mélanger. Rattache chaque information à la bonne rubrique d'après son sens, pas d'après sa position.
- Le CV peut aussi être fourni en image (photo, capture, scan) : lis tout le texte visible, colonnes et encadrés compris. Un mot illisible reste vide plutôt que deviné.
- Les personnes citées en référence ne sont pas le candidat : ne reprends jamais leur nom, leur téléphone ni leur e-mail dans les coordonnées.
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

/** Le navigateur demande s'il peut proposer la lecture par IA. */
export function GET() {
  return NextResponse.json({ ia: Boolean(process.env.ANTHROPIC_API_KEY) })
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null)
  const parsed = requestSchema.safeParse(payload)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Texte trop court ou document illisible pour être analysé.' },
      { status: 400 },
    )
  }

  const corps = parsed.data
  const apiKey = process.env.ANTHROPIC_API_KEY

  const local = () => {
    if (!('text' in corps)) {
      return NextResponse.json(
        { error: 'Lecture par IA indisponible.', code: 'ia-indisponible' },
        { status: 503 },
      )
    }
    const { data, found } = parseCvText(corps.text)
    return NextResponse.json({ data, found, source: 'local' as const })
  }

  if (!apiKey) return local()

  const contenu: Anthropic.Beta.BetaContentBlockParam[] =
    'text' in corps
      ? [{ type: 'text', text: `Voici le texte extrait d'un CV :\n\n${corps.text}` }]
      : [
          ...corps.images.map(
            (data): Anthropic.Beta.BetaImageBlockParam => ({
              type: 'image',
              source: { type: 'base64', media_type: 'image/jpeg', data },
            }),
          ),
          {
            type: 'text',
            text:
              corps.images.length > 1
                ? `Voici les ${corps.images.length} pages d'un CV, dans l'ordre. Extrais-en le contenu.`
                : "Voici l'image d'un CV. Extrais-en le contenu.",
          },
        ]

  try {
    const client = new Anthropic({ apiKey })
    const response = await client.beta.messages.parse({
      model: 'claude-opus-5-5',
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'medium', format: betaZodOutputFormat(structure) },
      // En cas de refus par un filtre de sécurité, l'API relance d'elle-même
      // la demande sur un autre modèle au lieu de répondre vide.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: SYSTEM,
      messages: [{ role: 'user', content: contenu }],
    })

    if (response.stop_reason === 'refusal' || !response.parsed_output) return local()

    const data = toCvData(response.parsed_output)
    return NextResponse.json({ data, found: resume(data), source: 'ia' as const })
  } catch (error) {
    console.error('Analyse du CV importé indisponible, bascule sur l’analyse locale.', error)
    return local()
  }
}
