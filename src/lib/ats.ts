import type { CvData } from '@/lib/types'
import { toBullets } from '@/lib/utils'

/**
 * Analyse locale du CV — aucun appel réseau, aucun envoi de données.
 * Reproduit les vérifications qu'appliquent les logiciels de tri (ATS) et les
 * règles de rédaction attendues par les recruteurs de la sous-région.
 */

export type CheckStatus = 'ok' | 'warn' | 'error'

export interface AtsCheck {
  id: string
  label: string
  status: CheckStatus
  detail: string
  /** Poids dans la note finale. */
  weight: number
  section: 'contact' | 'contenu' | 'redaction' | 'lisibilite'
}

export interface AtsReport {
  score: number
  checks: AtsCheck[]
  passed: number
  total: number
}

const ACTION_VERBS = [
  'piloté','géré','développé','créé','mis','conçu','animé','organisé','négocié',
  'suivi','encadré','formé','analysé','optimisé','déployé','lancé','coordonné',
  'assuré','réalisé','augmenté','réduit','accompagné','supervisé','planifié',
  'rédigé','vendu','recruté','contrôlé','installé','maintenu','livré','traité',
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function countDigitsResults(text: string) {
  // Un résultat chiffré : « 42 % », « 120 M FCFA », « 12 comptes », « 3 ans »
  return (text.match(/\d+[\s]?(%|m\b|k\b|fcfa|xof|ans?|mois|clients?|comptes?|personnes?|projets?)/gi) ?? [])
    .length
}

export function analyseCv(data: CvData): AtsReport {
  const { profile } = data
  const allDescriptions = [
    ...data.experiences.map((e) => e.description),
    ...data.educations.map((e) => e.description),
  ].join('\n')

  const checks: AtsCheck[] = []
  const push = (check: AtsCheck) => checks.push(check)

  /* --- Coordonnées ------------------------------------------------------ */
  const hasName = Boolean(profile.firstName.trim() && profile.lastName.trim())
  push({
    id: 'identite',
    label: 'Nom et prénom',
    status: hasName ? 'ok' : 'error',
    detail: hasName
      ? 'Le recruteur identifie immédiatement le candidat.'
      : 'Renseignez votre prénom et votre nom : c’est le premier champ lu par les logiciels de tri.',
    weight: 10,
    section: 'contact',
  })

  const validEmail = EMAIL_RE.test(profile.email.trim())
  push({
    id: 'email',
    label: 'Adresse email',
    status: validEmail ? 'ok' : profile.email.trim() ? 'warn' : 'error',
    detail: validEmail
      ? 'Format valide.'
      : profile.email.trim()
        ? 'Ce format d’email semble incorrect : vérifiez-le, une erreur ici vous rend injoignable.'
        : 'Ajoutez une adresse email professionnelle, de préférence prenom.nom@…',
    weight: 10,
    section: 'contact',
  })

  const hasPhone = profile.phone.replace(/\D/g, '').length >= 8
  push({
    id: 'telephone',
    label: 'Téléphone joignable',
    status: hasPhone ? 'ok' : 'error',
    detail: hasPhone
      ? 'Numéro renseigné — vérifiez qu’il est actif sur WhatsApp.'
      : 'Ajoutez un numéro de téléphone : la plupart des recruteurs de la place appellent ou écrivent sur WhatsApp.',
    weight: 8,
    section: 'contact',
  })

  const hasCity = Boolean(profile.city.trim() || profile.address.trim())
  push({
    id: 'localisation',
    label: 'Ville de résidence',
    status: hasCity ? 'ok' : 'warn',
    detail: hasCity
      ? 'La localisation est indiquée.'
      : 'Indiquez au moins votre ville : beaucoup d’offres filtrent sur le lieu de résidence.',
    weight: 5,
    section: 'contact',
  })

  /* --- Contenu ---------------------------------------------------------- */
  const hasTitle = profile.title.trim().length >= 3
  push({
    id: 'titre',
    label: 'Titre du poste visé',
    status: hasTitle ? 'ok' : 'error',
    detail: hasTitle
      ? 'Le titre oriente la lecture dès la première ligne.'
      : 'Ajoutez le titre du poste visé, repris mot pour mot de l’annonce quand vous répondez à une offre.',
    weight: 10,
    section: 'contenu',
  })

  const aboutLength = profile.about.trim().length
  push({
    id: 'accroche',
    label: 'Accroche de profil',
    status: aboutLength >= 180 ? 'ok' : aboutLength > 0 ? 'warn' : 'error',
    detail:
      aboutLength >= 180
        ? aboutLength > 700
          ? 'Un peu longue : visez 3 à 5 lignes pour rester percutant.'
          : 'Longueur idéale : 3 à 5 lignes.'
        : aboutLength > 0
          ? 'Accroche trop courte : décrivez votre métier, vos années d’expérience et votre valeur ajoutée.'
          : 'Ajoutez une accroche de 3 à 5 lignes : c’est le premier paragraphe lu par le recruteur.',
    weight: 10,
    section: 'contenu',
  })

  const expCount = data.experiences.length
  push({
    id: 'experiences',
    label: 'Expériences professionnelles',
    status: expCount >= 2 ? 'ok' : expCount === 1 ? 'warn' : 'error',
    detail:
      expCount >= 2
        ? `${expCount} expériences renseignées.`
        : expCount === 1
          ? 'Une seule expérience : ajoutez stages, missions courtes, bénévolat ou projets encadrés.'
          : 'Aucune expérience : même sans emploi salarié, valorisez stages, projets d’études et bénévolat.',
    weight: 12,
    section: 'contenu',
  })

  const datedExp = data.experiences.filter((e) => e.start.trim()).length
  push({
    id: 'dates',
    label: 'Dates renseignées',
    status: expCount === 0 ? 'warn' : datedExp === expCount ? 'ok' : 'error',
    detail:
      expCount === 0
        ? 'À vérifier une fois vos expériences ajoutées.'
        : datedExp === expCount
          ? 'Toutes les périodes sont datées.'
          : 'Certaines expériences n’ont pas de date de début : les ATS rejettent les parcours non datés.',
    weight: 8,
    section: 'contenu',
  })

  const eduCount = data.educations.length
  push({
    id: 'formation',
    label: 'Formation',
    status: eduCount >= 1 ? 'ok' : 'error',
    detail:
      eduCount >= 1
        ? `${eduCount} formation${eduCount > 1 ? 's' : ''} renseignée${eduCount > 1 ? 's' : ''}.`
        : 'Ajoutez au moins votre diplôme le plus élevé, avec l’établissement et l’année.',
    weight: 8,
    section: 'contenu',
  })

  const skillCount = data.skills.filter((s) => s.name.trim()).length
  push({
    id: 'competences',
    label: 'Compétences',
    status: skillCount >= 5 ? 'ok' : skillCount >= 2 ? 'warn' : 'error',
    detail:
      skillCount >= 5
        ? skillCount > 12
          ? 'Beaucoup de compétences : gardez les 10 plus pertinentes pour le poste.'
          : `${skillCount} compétences — bon équilibre.`
        : 'Listez 5 à 10 compétences, en reprenant les mots-clés exacts de l’offre.',
    weight: 8,
    section: 'contenu',
  })

  const langCount = data.languages.filter((l) => l.name.trim()).length
  push({
    id: 'langues',
    label: 'Langues',
    status: langCount >= 1 ? 'ok' : 'warn',
    detail:
      langCount >= 1
        ? `${langCount} langue${langCount > 1 ? 's' : ''} renseignée${langCount > 1 ? 's' : ''}.`
        : 'Ajoutez vos langues, y compris les langues nationales : c’est un atout réel sur le terrain.',
    weight: 5,
    section: 'contenu',
  })

  /* --- Rédaction -------------------------------------------------------- */
  const describedExp = data.experiences.filter((e) => toBullets(e.description).length >= 2).length
  push({
    id: 'missions',
    label: 'Missions détaillées',
    status:
      expCount === 0 ? 'warn' : describedExp === expCount ? 'ok' : describedExp > 0 ? 'warn' : 'error',
    detail:
      expCount === 0
        ? 'À vérifier une fois vos expériences ajoutées.'
        : describedExp === expCount
          ? 'Chaque poste est décrit par au moins deux lignes.'
          : 'Décrivez chaque poste par 2 à 4 lignes : une mission par ligne, pas un bloc de texte.',
    weight: 10,
    section: 'redaction',
  })

  const figures = countDigitsResults(allDescriptions)
  push({
    id: 'chiffres',
    label: 'Résultats chiffrés',
    status: figures >= 3 ? 'ok' : figures >= 1 ? 'warn' : 'error',
    detail:
      figures >= 3
        ? `${figures} résultats chiffrés détectés.`
        : 'Chiffrez vos résultats : budget géré, nombre de clients, pourcentage de progression, taille d’équipe.',
    weight: 10,
    section: 'redaction',
  })

  const lines = toBullets(allDescriptions)
  const startsWithVerb = lines.filter((line) =>
    ACTION_VERBS.some((verb) => line.toLowerCase().startsWith(verb)),
  ).length
  push({
    id: 'verbes',
    label: 'Verbes d’action',
    status: lines.length === 0 ? 'warn' : startsWithVerb >= lines.length / 2 ? 'ok' : 'warn',
    detail:
      lines.length === 0
        ? 'À vérifier une fois vos missions décrites.'
        : startsWithVerb >= lines.length / 2
          ? 'Vos missions commencent par des verbes d’action.'
          : 'Commencez vos lignes par un verbe d’action : piloté, développé, négocié, encadré…',
    weight: 7,
    section: 'redaction',
  })

  /* --- Lisibilité ------------------------------------------------------- */
  const totalChars =
    profile.about.length +
    allDescriptions.length +
    data.experiences.reduce((n, e) => n + e.role.length + e.company.length, 0)
  const density: CheckStatus = totalChars > 4200 ? 'warn' : totalChars < 600 ? 'warn' : 'ok'
  push({
    id: 'densite',
    label: 'Tient sur une page',
    status: density,
    detail:
      totalChars > 4200
        ? 'Contenu dense : réduisez le texte ou passez la taille de police sur « S » pour rester sur une page.'
        : totalChars < 600
          ? 'Le CV est encore très aéré : enrichissez vos descriptions.'
          : 'Le volume de texte tient confortablement sur une page A4.',
    weight: 6,
    section: 'lisibilite',
  })

  const emailLooksPersonal =
    validEmail &&
    (profile.email.toLowerCase().includes(profile.firstName.toLowerCase().slice(0, 3)) ||
      profile.email.toLowerCase().includes(profile.lastName.toLowerCase().slice(0, 3)))
  push({
    id: 'email-pro',
    label: 'Email professionnel',
    status: !validEmail ? 'warn' : emailLooksPersonal ? 'ok' : 'warn',
    detail: !validEmail
      ? 'À vérifier une fois l’email renseigné.'
      : emailLooksPersonal
        ? 'Votre adresse reprend votre identité : parfait.'
        : 'Privilégiez une adresse construite sur votre nom (prenom.nom@…) plutôt qu’un pseudonyme.',
    weight: 4,
    section: 'lisibilite',
  })

  const totalWeight = checks.reduce((n, c) => n + c.weight, 0)
  const earned = checks.reduce(
    (n, c) => n + c.weight * (c.status === 'ok' ? 1 : c.status === 'warn' ? 0.5 : 0),
    0,
  )

  return {
    score: Math.round((earned / totalWeight) * 100),
    checks,
    passed: checks.filter((c) => c.status === 'ok').length,
    total: checks.length,
  }
}

export function scoreLabel(score: number) {
  if (score >= 85) return 'Prêt à envoyer'
  if (score >= 65) return 'Presque prêt'
  if (score >= 40) return 'À compléter'
  return 'À construire'
}
