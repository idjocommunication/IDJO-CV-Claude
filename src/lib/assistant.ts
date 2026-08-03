import { z } from 'zod'
import type { CvData } from '@/lib/types'
import { SANS_SERVEUR } from '@/lib/deploiement'

/**
 * Assistant de rédaction. Deux moteurs derrière la même interface :
 *
 * 1. le modèle Claude, appelé par `/api/assistant` quand la clé
 *    `ANTHROPIC_API_KEY` est configurée sur le serveur ;
 * 2. un générateur local, déterministe et sans réseau, qui prend le relais
 *    sinon — l'éditeur doit continuer à fonctionner sans compte, sans base de
 *    données et sans service externe.
 *
 * Les deux renvoient la même forme (`AssistantResult`), l'interface ne fait
 * pas la différence hormis l'étiquette de provenance.
 */

export const ASSISTANT_TASKS = ['cv', 'accroche', 'experience', 'competences', 'lettre'] as const
export type AssistantTask = (typeof ASSISTANT_TASKS)[number]

export const TASK_LABELS: Record<AssistantTask, string> = {
  cv: 'Rédiger tout mon CV',
  accroche: 'Rédiger mon accroche',
  experience: 'Détailler une expérience',
  competences: 'Proposer des compétences',
  lettre: 'Rédiger ma lettre',
}

/** Résumé du CV envoyé au moteur : ni téléphone, ni email, ni photo. */
export const assistantBriefSchema = z.object({
  task: z.enum(ASSISTANT_TASKS),
  title: z.string().max(160).default(''),
  city: z.string().max(120).default(''),
  years: z.number().min(0).max(60).default(0),
  about: z.string().max(1500).default(''),
  experiences: z
    .array(
      z.object({
        role: z.string().max(160).default(''),
        company: z.string().max(160).default(''),
        period: z.string().max(80).default(''),
        description: z.string().max(2000).default(''),
      }),
    )
    .max(12)
    .default([]),
  educations: z
    .array(
      z.object({
        degree: z.string().max(200).default(''),
        school: z.string().max(200).default(''),
        period: z.string().max(80).default(''),
      }),
    )
    .max(10)
    .default([]),
  skills: z.array(z.string().max(80)).max(40).default([]),
  languages: z.array(z.string().max(80)).max(12).default([]),
  /** Contexte de candidature, utilisé par la tâche « lettre ». */
  company: z.string().max(160).default(''),
  targetRole: z.string().max(200).default(''),
  offer: z.string().max(3000).default(''),
  /** Expérience visée par la tâche « experience ». */
  experienceIndex: z.number().int().min(0).max(11).default(0),
})

export type AssistantBrief = z.infer<typeof assistantBriefSchema>

/** Réponse attendue du moteur. Les champs inutiles restent vides. */
export const assistantOutputSchema = z.object({
  accroche: z.string(),
  bullets: z.array(z.string()),
  /** Puces par expérience, `index` = position dans la liste du CV. */
  experiences: z.array(z.object({ index: z.number().int(), bullets: z.array(z.string()) })),
  competences: z.array(z.string()),
  lettre: z.object({
    subject: z.string(),
    hook: z.string(),
    proof: z.string(),
    projection: z.string(),
  }),
  conseils: z.array(z.string()),
})

export type AssistantOutput = z.infer<typeof assistantOutputSchema>

export interface AssistantResult extends AssistantOutput {
  /** « ia » : rédigé par Claude. « local » : générateur intégré au site. */
  source: 'ia' | 'local'
}

export const EMPTY_OUTPUT: AssistantOutput = {
  accroche: '',
  bullets: [],
  experiences: [],
  competences: [],
  lettre: { subject: '', hook: '', proof: '', projection: '' },
  conseils: [],
}

/* ------------------------------------------------------------------ */
/* Construction du résumé à partir du CV saisi                         */
/* ------------------------------------------------------------------ */

const YEAR = /(19|20)\d{2}/

function yearOf(value: string) {
  const found = value.match(YEAR)
  return found ? Number(found[0]) : null
}

/** Nombre d'années couvertes par les expériences renseignées. */
export function experienceYears(cv: CvData) {
  const now = new Date().getFullYear()
  let earliest: number | null = null
  let latest: number | null = null

  for (const item of cv.experiences) {
    const start = yearOf(item.start)
    const end = item.current ? now : yearOf(item.end) ?? start
    if (start && (earliest === null || start < earliest)) earliest = start
    if (end && (latest === null || end > latest)) latest = end
  }

  if (earliest === null || latest === null) return 0
  return Math.max(0, Math.min(60, latest - earliest))
}

export function buildBrief(
  cv: CvData,
  task: AssistantTask,
  extras: Partial<Pick<AssistantBrief, 'company' | 'targetRole' | 'offer' | 'experienceIndex'>> = {},
): AssistantBrief {
  return assistantBriefSchema.parse({
    task,
    title: cv.profile.title,
    city: cv.profile.city,
    years: experienceYears(cv),
    about: cv.profile.about,
    experiences: cv.experiences.slice(0, 12).map((item) => ({
      role: item.role,
      company: item.company,
      period: [item.start, item.current ? 'aujourd’hui' : item.end].filter(Boolean).join(' – '),
      description: item.description.slice(0, 2000),
    })),
    educations: cv.educations.slice(0, 10).map((item) => ({
      degree: item.degree,
      school: item.school,
      period: [item.start, item.end].filter(Boolean).join(' – '),
    })),
    skills: cv.skills.map((s) => s.name).filter(Boolean).slice(0, 40),
    languages: cv.languages.map((l) => l.name).filter(Boolean).slice(0, 12),
    company: extras.company ?? '',
    targetRole: extras.targetRole ?? '',
    offer: extras.offer ?? '',
    experienceIndex: extras.experienceIndex ?? 0,
  })
}

/* ------------------------------------------------------------------ */
/* Générateur local                                                    */
/* ------------------------------------------------------------------ */

/** « a, b et c » */
function listFr(items: string[]) {
  const clean = items.filter(Boolean)
  if (clean.length <= 1) return clean[0] ?? ''
  return `${clean.slice(0, -1).join(', ')} et ${clean[clean.length - 1]}`
}

function sentences(text: string) {
  return text
    .split(/\n|(?<=[.;!?])\s+/)
    .map((line) => line.replace(/^[-•*\s]+/, '').replace(/[.;]+$/, '').trim())
    .filter((line) => line.length > 2)
}

function capitalize(value: string) {
  return value ? value[0].toUpperCase() + value.slice(1) : value
}

/** Familles de compétences proposées selon l'intitulé du poste. */
const SKILL_LIBRARY: { match: RegExp; skills: string[] }[] = [
  {
    match: /comptab|financ|audit|gestion|contrôl/i,
    skills: [
      'Comptabilité générale',
      'Comptabilité analytique',
      'Déclarations fiscales (DGI)',
      'SYSCOHADA révisé',
      'Sage Comptabilité',
      'Rapprochements bancaires',
      'Excel avancé',
      'Clôture mensuelle',
    ],
  },
  {
    match: /développ|dev|informatic|logiciel|web|data|système|réseau/i,
    skills: [
      'JavaScript / TypeScript',
      'React',
      'Node.js',
      'API REST',
      'Git & GitHub',
      'SQL / PostgreSQL',
      'Tests automatisés',
      'Méthode agile',
    ],
  },
  {
    match: /commerc|vente|business|account/i,
    skills: [
      'Prospection terrain',
      'Négociation commerciale',
      'Gestion de portefeuille clients',
      'Suivi des objectifs',
      'CRM',
      'Reporting hebdomadaire',
      'Fidélisation',
      'Argumentaire de vente',
    ],
  },
  {
    match: /marketing|communicat|digital|community/i,
    skills: [
      'Stratégie de contenu',
      'Réseaux sociaux',
      'Publicité en ligne (Meta, Google)',
      'Analyse d’audience',
      'Rédaction web',
      'Canva / Suite Adobe',
      'Emailing',
      'Suivi des indicateurs',
    ],
  },
  {
    match: /assistant|secrét|administrat|office/i,
    skills: [
      'Gestion d’agenda',
      'Accueil et standard téléphonique',
      'Rédaction de comptes rendus',
      'Classement et archivage',
      'Organisation de déplacements',
      'Pack Office',
      'Suivi des fournitures',
      'Discrétion professionnelle',
    ],
  },
  {
    match: /technic|maintenanc|électr|mécani|industri/i,
    skills: [
      'Maintenance préventive',
      'Diagnostic de panne',
      'Lecture de schémas',
      'Sécurité au travail',
      'Habilitation électrique',
      'GMAO',
      'Rapport d’intervention',
      'Travail en équipe',
    ],
  },
  {
    match: /infirm|santé|médic|soin/i,
    skills: [
      'Soins infirmiers',
      'Prise de constantes',
      'Dossier de soins',
      'Hygiène et asepsie',
      'Urgences',
      'Éducation thérapeutique',
      'Travail en équipe pluridisciplinaire',
      'Gestion du stock de pharmacie',
    ],
  },
  {
    match: /logistiq|transport|approvision|supply|achat/i,
    skills: [
      'Gestion des stocks',
      'Planification des tournées',
      'Suivi fournisseurs',
      'Dédouanement',
      'Inventaires',
      'Négociation achats',
      'Excel avancé',
      'Sécurité entrepôt',
    ],
  },
  {
    match: /ressources humaines|rh|recrut|paie|formation/i,
    skills: [
      'Recrutement et sourcing',
      'Gestion administrative du personnel',
      'Paie',
      'Droit du travail ivoirien',
      'Plan de formation',
      'Entretiens annuels',
      'SIRH',
      'Climat social',
    ],
  },
  {
    match: /enseign|professeur|éducat|formateur/i,
    skills: [
      'Préparation de séquences',
      'Animation de groupe',
      'Évaluation des acquis',
      'Suivi individualisé',
      'Supports pédagogiques',
      'Gestion de classe',
      'Outils numériques',
      'Relation avec les familles',
    ],
  },
]

const GENERIC_SKILLS = [
  'Organisation et respect des délais',
  'Travail en équipe',
  'Communication écrite et orale',
  'Sens du service',
  'Pack Office',
  'Résolution de problèmes',
  'Rigueur',
  'Autonomie',
]

function suggestSkills(brief: AssistantBrief) {
  const haystack = [brief.title, ...brief.experiences.map((e) => e.role)].join(' ')
  const family = SKILL_LIBRARY.find((entry) => entry.match.test(haystack))
  const pool = [...(family?.skills ?? []), ...GENERIC_SKILLS]
  const already = new Set(brief.skills.map((s) => s.toLowerCase().trim()))
  return pool.filter((skill) => !already.has(skill.toLowerCase())).slice(0, 8)
}

function localAccroche(brief: AssistantBrief) {
  const headline = brief.title || brief.experiences[0]?.role || 'Professionnel'
  const companies = brief.experiences
    .slice(0, 2)
    .map((item) => item.company)
    .filter(Boolean)
  const diploma = brief.educations[0]

  const first =
    brief.years >= 1
      ? `${headline} avec ${brief.years} an${brief.years > 1 ? 's' : ''} d’expérience${
          brief.city ? `, à ${brief.city}` : ''
        }.`
      : `${headline} en début de parcours${
          diploma?.degree ? `, diplômé${diploma.school ? ` de ${diploma.school}` : ''} en ${diploma.degree.toLowerCase()}` : ''
        }${brief.city ? `, à ${brief.city}` : ''}.`

  const second = companies.length
    ? `J’ai construit mon expérience chez ${listFr(companies)}, où j’ai appris à tenir mes engagements et à rendre compte de mes résultats.`
    : 'Je sais organiser mon travail, tenir mes délais et rendre compte de mes résultats.'

  const third = brief.skills.length
    ? `Mes points forts : ${listFr(brief.skills.slice(0, 4))}.`
    : ''

  const fourth = `Je recherche aujourd’hui un poste de ${(brief.targetRole || headline).toLowerCase()} dans une équipe où je pourrai m’investir durablement.`

  return [first, second, third, fourth].filter(Boolean).join(' ')
}

function localBullets(brief: AssistantBrief) {
  const item = brief.experiences[brief.experienceIndex] ?? brief.experiences[0]
  if (!item) return []

  const existing = sentences(item.description)
  if (existing.length) {
    return existing.slice(0, 6).map((line) => `${capitalize(line)}.`)
  }

  const role = (item.role || brief.title || 'le poste').toLowerCase()
  const company = item.company || 'l’entreprise'
  return [
    `Assurer ${role} au sein de ${company} — préciser le périmètre : nombre de dossiers, de clients ou de machines suivis.`,
    `Obtenir un résultat mesurable — indiquer un chiffre : pourcentage de progression, montant en FCFA, délai gagné.`,
    `Coordonner le travail avec les services concernés — citer les équipes, partenaires ou fournisseurs.`,
    `Mettre en place une amélioration concrète — nommer l’outil, la procédure ou le tableau de bord créé.`,
  ]
}

function localLetter(brief: AssistantBrief) {
  const role = brief.targetRole || brief.title || 'le poste proposé'
  const company = brief.company || 'votre entreprise'
  const recent = brief.experiences[0]
  const proofLines = recent ? sentences(recent.description).slice(0, 2) : []

  const subject = `Candidature au poste de ${role}`

  const hook = `${
    brief.offer ? `Votre annonce pour le poste de ${role}` : `Le poste de ${role} au sein de ${company}`
  } a retenu toute mon attention : il correspond précisément au travail que je mène${
    brief.years >= 1 ? ` depuis ${brief.years} an${brief.years > 1 ? 's' : ''}` : ''
  }${brief.city ? ` à ${brief.city}` : ''}.`

  const proof = recent
    ? `${recent.company ? `Chez ${recent.company}` : 'Dans mon poste actuel'}, en tant que ${
        (recent.role || brief.title).toLowerCase()
      }, ${
        proofLines.length
          ? `j’ai notamment mené les missions suivantes : ${proofLines
              .map((line) => line[0].toLowerCase() + line.slice(1))
              .join(' ; ')}.`
          : 'j’ai tenu mes objectifs et rendu compte régulièrement de mes résultats.'
      }${
        brief.skills.length
          ? ` Je maîtrise notamment ${listFr(brief.skills.slice(0, 3))}.`
          : ''
      }`
    : `Ma formation${brief.educations[0]?.degree ? ` en ${brief.educations[0].degree.toLowerCase()}` : ''} m’a préparé à ce poste${
        brief.skills.length ? `, en particulier ${listFr(brief.skills.slice(0, 3))}` : ''
      }.`

  const projection = `Rejoindre ${company} me permettrait de mettre cette expérience au service de vos équipes : dès les premiers mois, je m’attacherais à maîtriser vos procédures, puis à proposer les améliorations qui feront gagner du temps à tout le service.`

  return { subject, hook, proof, projection }
}

const LOCAL_NOTE =
  'Texte proposé par le générateur intégré du site : relisez-le et ajoutez vos chiffres avant de l’utiliser.'

/**
 * Appelle l'assistant côté serveur. En cas d'indisponibilité (hors ligne,
 * route absente, erreur réseau), on retombe sur le générateur local afin que
 * le bouton ne reste jamais sans réponse.
 */
export async function requestAssistant(brief: AssistantBrief): Promise<AssistantResult> {
  // Export statique : aucune route à appeler, le générateur local répond.
  if (SANS_SERVEUR) return localAssistant(brief)

  try {
    const response = await fetch('/api/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(brief),
    })
    if (!response.ok) throw new Error(`assistant:${response.status}`)

    const json: unknown = await response.json()
    const parsed = assistantOutputSchema.safeParse(json)
    if (!parsed.success) throw new Error('assistant:format')

    const source = (json as { source?: string }).source === 'ia' ? 'ia' : 'local'
    return { ...parsed.data, source }
  } catch {
    return localAssistant(brief)
  }
}

/** Génération sans réseau, utilisée en secours de l'appel au modèle. */
export function localAssistant(brief: AssistantBrief): AssistantResult {
  const output: AssistantOutput = { ...EMPTY_OUTPUT, lettre: { ...EMPTY_OUTPUT.lettre } }

  if (brief.task === 'cv') {
    output.accroche = localAccroche(brief)
    output.competences = suggestSkills(brief)
    output.experiences = brief.experiences.map((_, index) => ({
      index,
      bullets: localBullets({ ...brief, experienceIndex: index }),
    }))
    output.conseils = [
      'Relisez chaque expérience : c’est là que se joue la crédibilité du CV.',
      'Une ligne sur deux devrait contenir un chiffre.',
    ]
  }

  if (brief.task === 'accroche') {
    output.accroche = localAccroche(brief)
    output.conseils = [
      'Une accroche efficace tient en 3 ou 4 lignes.',
      'Citez un chiffre dès la première phrase si vous en avez un.',
    ]
  }

  if (brief.task === 'experience') {
    output.bullets = localBullets(brief)
    output.conseils = [
      'Commencez chaque ligne par un verbe d’action.',
      'Une ligne sur deux devrait contenir un chiffre.',
    ]
  }

  if (brief.task === 'competences') {
    output.competences = suggestSkills(brief)
    output.conseils = ['Gardez entre 6 et 10 compétences, les plus proches du poste visé.']
  }

  if (brief.task === 'lettre') {
    output.lettre = localLetter(brief)
    output.conseils = [
      'Une lettre tient sur une page : trois paragraphes suffisent.',
      'Nommez l’entreprise et le poste dès la première phrase.',
    ]
  }

  return { ...output, source: 'local', conseils: [...output.conseils, LOCAL_NOTE] }
}
