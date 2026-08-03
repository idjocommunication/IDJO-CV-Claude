import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
// Le helper de sortie structurée attend un schéma Zod 4 ; le reste du site
// valide en Zod 3. Les deux versions cohabitent dans le même paquet.
import { z as z4 } from 'zod/v4'
import {
  EMPTY_OUTPUT,
  assistantBriefSchema,
  assistantOutputSchema,
  localAssistant,
  type AssistantBrief,
} from '@/lib/assistant'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Forme imposée à la réponse du modèle. */
const outputFormat = z4.object({
  accroche: z4.string(),
  bullets: z4.array(z4.string()),
  experiences: z4.array(z4.object({ index: z4.number().int(), bullets: z4.array(z4.string()) })),
  competences: z4.array(z4.string()),
  lettre: z4.object({
    subject: z4.string(),
    hook: z4.string(),
    proof: z4.string(),
    projection: z4.string(),
  }),
  conseils: z4.array(z4.string()),
})

const SYSTEM = `Tu es conseiller emploi à Abidjan et tu rédiges des CV et des lettres de motivation pour le marché ivoirien et ouest-africain.

Règles :
- Écris en français, à la première personne pour l'accroche et la lettre, à l'infinitif ou au participe pour les puces d'expérience.
- N'invente jamais un employeur, un diplôme, une date ni un chiffre qui ne figure pas dans le dossier fourni. S'il manque un chiffre utile, écris la phrase sans chiffre plutôt que d'en inventer un.
- Reste concret : un fait, un périmètre, un résultat. Pas de formules creuses (« dynamique et motivé », « passionné par les défis »).
- Monnaie : le franc CFA (FCFA). Contexte : entreprises et administrations de Côte d'Ivoire.
- Longueurs : accroche 3 à 4 phrases ; puces d'expérience 4 à 6 lignes de 12 à 22 mots ; lettre en trois paragraphes de 3 à 5 phrases.
- Ne remplis que les champs demandés par la tâche, laisse les autres vides (chaîne vide ou tableau vide).
- « conseils » : au plus deux remarques courtes destinées au candidat.
- Champ « experiences » : une entrée par expérience réécrite, « index » étant sa position dans la liste fournie (la première vaut 0).`

function userPrompt(brief: AssistantBrief) {
  const lines: string[] = []

  lines.push(`Tâche demandée : ${brief.task}`)
  lines.push('')
  lines.push('DOSSIER DU CANDIDAT')
  if (brief.title) lines.push(`Intitulé : ${brief.title}`)
  if (brief.city) lines.push(`Ville : ${brief.city}`)
  if (brief.years) lines.push(`Années d'expérience couvertes : ${brief.years}`)
  if (brief.about) lines.push(`Accroche actuelle : ${brief.about}`)

  if (brief.experiences.length) {
    lines.push('')
    lines.push('Expériences (de la plus récente à la plus ancienne) :')
    brief.experiences.forEach((item, index) => {
      lines.push(
        `${index + 1}. ${item.role || 'Poste non précisé'} — ${item.company || 'Entreprise non précisée'} (${item.period || 'période non précisée'})`,
      )
      if (item.description) lines.push(`   Détail saisi : ${item.description}`)
    })
  }

  if (brief.educations.length) {
    lines.push('')
    lines.push('Formation :')
    brief.educations.forEach((item) => {
      lines.push(`- ${item.degree} — ${item.school} (${item.period})`)
    })
  }

  if (brief.skills.length) lines.push(`\nCompétences déjà saisies : ${brief.skills.join(', ')}`)
  if (brief.languages.length) lines.push(`Langues : ${brief.languages.join(', ')}`)

  if (brief.task === 'cv') {
    lines.push('')
    lines.push(
      "Rédige d'un seul coup tout le contenu rédactionnel du CV : l'accroche, les puces de CHAQUE expérience listée ci-dessus (champ « experiences »), et 6 à 8 compétences adaptées au poste (champ « competences »). Reformule ce qui est saisi, sans ajouter de fait nouveau ; laisse « bullets » vide.",
    )
  }

  if (brief.task === 'experience') {
    const target = brief.experiences[brief.experienceIndex]
    lines.push('')
    lines.push(
      `Rédige les puces de l'expérience n°${brief.experienceIndex + 1}${
        target ? ` (${target.role} — ${target.company})` : ''
      }. Reformule le détail saisi s'il existe, sans ajouter de fait nouveau.`,
    )
  }

  if (brief.task === 'lettre') {
    lines.push('')
    lines.push('CANDIDATURE VISÉE')
    lines.push(`Entreprise : ${brief.company || 'non précisée'}`)
    lines.push(`Poste : ${brief.targetRole || brief.title || 'non précisé'}`)
    if (brief.offer) lines.push(`Annonce : ${brief.offer}`)
    lines.push(
      "Rédige l'objet et les trois paragraphes : l'accroche (le poste et pourquoi il vous correspond), la preuve (deux réalisations tirées du dossier), la projection (ce que le candidat apporte dans les premiers mois).",
    )
  }

  return lines.join('\n')
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null)
  const parsed = assistantBriefSchema.safeParse(payload)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Demande invalide.', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const brief = parsed.data
  const apiKey = process.env.ANTHROPIC_API_KEY

  // Sans clé, le site reste autonome : le générateur intégré prend le relais.
  if (!apiKey) return NextResponse.json(localAssistant(brief))

  try {
    const client = new Anthropic({ apiKey })
    const response = await client.messages.parse({
      model: 'claude-opus-5',
      // Le CV complet réécrit toutes les expériences d'un coup.
      max_tokens: brief.task === 'cv' ? 8000 : 4000,
      thinking: { type: 'adaptive' },
      output_config: {
        effort: brief.task === 'cv' || brief.task === 'lettre' ? 'high' : 'medium',
        format: zodOutputFormat(outputFormat),
      },
      system: SYSTEM,
      messages: [{ role: 'user', content: userPrompt(brief) }],
    })

    // Le texte reste relu par le schéma partagé avec le client.
    const output = assistantOutputSchema.safeParse(response.parsed_output)
    if (!output.success) return NextResponse.json(localAssistant(brief))

    return NextResponse.json({
      ...EMPTY_OUTPUT,
      ...output.data,
      lettre: { ...EMPTY_OUTPUT.lettre, ...output.data.lettre },
      source: 'ia' as const,
    })
  } catch (error) {
    // Panne, quota ou clé invalide : on répond quand même quelque chose d'utile.
    console.error('Assistant IA indisponible, bascule sur le générateur local.', error)
    return NextResponse.json(localAssistant(brief))
  }
}
