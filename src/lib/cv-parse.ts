import { EMPTY_CV } from '@/data/sample-cv'
import type { CvData } from '@/lib/types'
import { uid } from '@/lib/utils'

/**
 * Lecture d'un CV existant fourni en texte brut.
 *
 * L'objectif n'est pas de deviner parfaitement : c'est de remplir tout ce qui
 * est identifiable avec certitude et de laisser l'utilisateur corriger le
 * reste. Le texte d'origine reste affiché à côté du résultat, pour qu'aucune
 * information ne soit perdue en chemin.
 *
 * Ce module ne dépend d'aucune API du navigateur : il sert aussi de secours
 * côté serveur quand l'assistant n'est pas configuré.
 */

export interface ParsedCv {
  data: CvData
  /** Ce qui a été reconnu, listé pour l'écran de confirmation. */
  found: string[]
}

const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]{2,}/
/**
 * Un numéro, pas une période. « 2018 - 2021 » comporte assez de chiffres pour
 * tromper une expression trop large : on exige un indicatif international ou
 * un zéro initial, forme de tous les numéros ivoiriens.
 */
const TELEPHONE = /(\+\d[\d\s.()-]{7,}|\b0\d[\d\s.()-]{7,})/
const SITE = /((https?:\/\/)?(www\.)?(linkedin\.com|github\.com)\/[\w./-]+|[\w-]+\.(ci|com|net|org|fr)\b)/i
const ANNEE = /(19|20)\d{2}/g
/** Même motif sans l'option globale : `test()` sur une expression globale
 *  garde une position entre deux appels et répond faux une fois sur deux. */
const ANNEE_TEST = /(19|20)\d{2}/
/** Mots qui trahissent une période plutôt qu'un intitulé de poste. */
const MOTS_PERIODE = /\b(aujourd|actuel|présent|present|en cours|depuis)/i

const VILLES = [
  'Abidjan',
  'Cocody',
  'Yopougon',
  'Plateau',
  'Treichville',
  'Marcory',
  'Adjamé',
  'Abobo',
  'Koumassi',
  'Port-Bouët',
  'Bingerville',
  'Grand-Bassam',
  'Bouaké',
  'Yamoussoukro',
  'San-Pédro',
  'Korhogo',
  'Daloa',
  'Man',
  'Gagnoa',
  'Divo',
  'Abengourou',
  'Dakar',
  'Ouagadougou',
  'Bamako',
  'Lomé',
  'Cotonou',
  'Douala',
  'Conakry',
]

type SectionId =
  | 'profil'
  | 'experience'
  | 'formation'
  | 'competences'
  | 'langues'
  | 'interets'
  | 'distinctions'
  | 'references'

const TITRES: { id: SectionId; motifs: RegExp }[] = [
  { id: 'profil', motifs: /^(profil|à propos|a propos|resume|résumé|objectif|presentation|présentation|accroche)\b/i },
  { id: 'experience', motifs: /^(experiences?|expériences?|parcours|emplois?|carriere|carrière|activites? professionnelles?|stages?)\b/i },
  { id: 'formation', motifs: /^(formations?|etudes?|études?|diplomes?|diplômes?|scolarite|scolarité|cursus|education)\b/i },
  { id: 'competences', motifs: /^(competences?|compétences?|savoir-faire|expertises?|aptitudes?|skills)\b/i },
  { id: 'langues', motifs: /^(langues?|languages?)\b/i },
  { id: 'interets', motifs: /^(centres? d.int[ée]r|loisirs|hobbies|int[ée]r[êe]ts|activites? extra)/i },
  { id: 'distinctions', motifs: /^(distinctions?|certifications?|prix|recompenses?|récompenses?|realisations?|réalisations?)\b/i },
  { id: 'references', motifs: /^(r[ée]f[ée]rences?|recommandations?)\b/i },
]

/** Mots de gabarit qui ressemblent à un nom propre sans en être un. */
const MOTS_PAS_UN_NOM =
  /^(contact|contacts|contacter|me|moi|mon|ma|mes|t[ée]l[ée]phone|t[ée]l|e-?mail|courriel|adresse|site|web|profil|cv|curriculum|vitae|coordonn[ée]es|informations?|personnelles?|propos|portfolio|linkedin|universit[ée]|lyc[ée]e|[ée]cole|institut|coll[èe]ge|groupe|agence|soci[ée]t[ée]|sarl|rue|avenue|boulevard|quartier|master|licence|baccalaur[ée]at|bts|dut)$/i

const MOTS_TITRE_POSTE =
  /(responsable|charg[ée]|assistant|directeur|directrice|manager|technicien|ing[ée]nieur|d[ée]veloppeur|comptable|commercial|consultant|analyste|infirmier|enseignant|professeur|agent|secr[ée]taire|chef|superviseur|coordinateur|gestionnaire|conseiller|auditeur|juriste|logisticien|architecte|designer|stagiaire)/i

function lignes(texte: string) {
  return texte
    .replace(/\r/g, '')
    .split('\n')
    .map((ligne) => ligne.replace(/[•▪·]/g, '·').trim())
    .filter((ligne) => ligne.length > 0)
}

/**
 * Un titre de rubrique est court et ne raconte rien : « FORMATION », pas
 * « Formation de 4 apprentis par an ». Sans ce garde-fou, une ligne de mission
 * commençant par le bon mot ferait basculer toute la suite du CV dans la
 * mauvaise rubrique.
 */
function estUnTitre(ligne: string, motifs: RegExp) {
  if (!motifs.test(ligne)) return false
  if (ligne.length > 40) return false
  if (/\d/.test(ligne)) return false
  if (/[.;:!?]$/.test(ligne.trim())) return false

  const reste = ligne.replace(motifs, '').trim()
  const motsEnPlus = reste ? reste.split(/\s+/).length : 0
  return motsEnPlus <= 2 && reste.length <= 24
}

/** Découpe le texte en sections d'après les titres reconnus. */
function decouper(lines: string[]) {
  const sections: Record<string, string[]> = { entete: [] }
  let courante = 'entete'

  for (const ligne of lines) {
    // « EXPÉRIENCE : » est un titre comme un autre : le deux-points final,
    // fréquent sur les modèles Word, ne doit pas le faire passer pour du texte.
    const nu = ligne.replace(/^[^\p{L}]+/u, '').replace(/\s*:\s*$/, '').trim()
    const titre = TITRES.find((t) => estUnTitre(nu, t.motifs))
    if (titre) {
      courante = titre.id
      sections[courante] = sections[courante] ?? []
      continue
    }
    sections[courante] = sections[courante] ?? []
    sections[courante].push(ligne)
  }

  return sections
}

/** « 2019 - 2022 », « 2021 – Aujourd'hui », « depuis 2020 » */
function periode(ligne: string) {
  const annees = ligne.match(ANNEE)
  if (!annees?.length) return null
  const encours = /aujourd|actuel|présent|present|en cours|depuis/i.test(ligne)
  return {
    start: annees[0],
    end: encours ? '' : (annees[1] ?? ''),
    current: encours || annees.length === 1,
  }
}

/** Mots de date à retirer d'un intitulé : « 2019 – Aujourd'hui   Technicien ». */
const MOTS_DATE =
  /\b(aujourd.?hui|actuel(le)?(ment)?|présent|present|en cours|depuis|à ce jour|a ce jour|janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\b/gi

/** Sépare « Poste — Entreprise » sur les séparateurs habituels. */
function couper(ligne: string) {
  const propre = ligne
    .replace(ANNEE, '')
    .replace(MOTS_DATE, '')
    .replace(/^[\s–—|,:-]+/, '')
    .replace(/[–—|/,:-]{1,2}\s*$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
  const parts = propre
    .split(/\s+[–—|]\s+|\s+[-]\s+|\s+chez\s+|\s+@\s+|,\s+/i)
    .map((p) => p.replace(/^[·\s-]+|[·\s-]+$/g, '').trim())
    .filter(Boolean)
  return { first: parts[0] ?? '', second: parts[1] ?? '' }
}

function entreesDatees(lines: string[]) {
  const entrees: { tete: string; periode: ReturnType<typeof periode>; corps: string[] }[] = []

  for (const ligne of lines) {
    const p = periode(ligne)
    const commence = Boolean(p) && ligne.replace(ANNEE, '').trim().length > 2
    if (commence || (p && entrees.length === 0)) {
      entrees.push({ tete: ligne, periode: p, corps: [] })
    } else if (entrees.length) {
      entrees[entrees.length - 1].corps.push(ligne)
    } else {
      entrees.push({ tete: ligne, periode: null, corps: [] })
    }
  }

  return entrees
}

function listeCourte(lines: string[]) {
  return lines
    .flatMap((ligne) => ligne.split(/[,;·]|\s{2,}/))
    .map((item) => item.replace(/^[-•·\s]+|[-•·\s]+$/g, '').trim())
    .filter((item) => item.length > 1 && item.length < 60)
}

export function parseCvText(texte: string): ParsedCv {
  const data: CvData = JSON.parse(JSON.stringify(EMPTY_CV)) as CvData
  const found: string[] = []
  const lines = lignes(texte)
  const sections = decouper(lines)
  const entete = sections.entete ?? []
  // Les références citent d'autres personnes, avec leurs propres nom, numéro
  // et e-mail : elles sont écartées de la recherche des coordonnées.
  const dansReferences = new Set(sections.references ?? [])
  const lignesCandidat = lines.filter((ligne) => !dansReferences.has(ligne))
  const brut = lignesCandidat.join('\n')

  /* -- Coordonnées ------------------------------------------------------ */
  const email = brut.match(EMAIL)?.[0]
  if (email) {
    data.profile.email = email
    found.push('Email')
  }

  // L'e-mail est retiré avant la recherche : un bandeau de contact les met
  // souvent sur la même ligne (« +225 07 07 12 34 56  aicha@email.ci »).
  const sansEmail = (ligne: string) => ligne.replace(new RegExp(EMAIL.source, 'g'), ' ')
  const telLigne = lignesCandidat
    .map(sansEmail)
    .find((l) => TELEPHONE.test(l) && !/^\s*(19|20)\d{2}\s*[-–—]/.test(l))
  const tel = telLigne?.match(TELEPHONE)?.[0]?.trim()
  if (tel && tel.replace(/\D/g, '').length >= 8) {
    data.profile.phone = tel
    found.push('Téléphone')
  }

  // On cherche le site sur un texte débarrassé des e-mails, sinon « email.ci »
  // serait pris pour une adresse web.
  const sansEmails = brut.replace(new RegExp(EMAIL.source, 'g'), ' ')
  const site = sansEmails.match(SITE)?.[0]
  if (site && !site.includes('@')) {
    data.profile.website = site
    found.push('Site / LinkedIn')
  }

  const ville = VILLES.find((v) => new RegExp(`\\b${v}\\b`, 'i').test(brut))
  if (ville) {
    data.profile.city = ville === 'Abidjan' ? 'Abidjan, Côte d’Ivoire' : `${ville}, Côte d’Ivoire`
    found.push('Ville')
  }

  /* -- Identité --------------------------------------------------------- */
  /**
   * Un nom tient en deux à quatre mots, chacun commençant par une majuscule,
   * et ne se termine pas par un point. Sans ces garde-fous, une phrase de
   * l'accroche ou un titre de rubrique finirait dans le champ « Nom ».
   */
  /** Retire les décorations de gabarit : « Bonjour. Je suis Aïcha Konaté ». */
  const nettoyerNom = (ligne: string) =>
    ligne
      .replace(/^\s*(bonjour|hello|salut|curriculum vitae|cv)\b[\s.,:;!-]*/i, '')
      .replace(/^\s*(je\s*suis|moi\s*c.est|i\s*am)\s*/i, '')
      .trim()

  const ressembleAUnNom = (brute: string) => {
    const ligne = nettoyerNom(brute)
    if (EMAIL.test(ligne) || TELEPHONE.test(ligne)) return false
    if (TITRES.some((titre) => estUnTitre(ligne, titre.motifs))) return false
    if (ligne.length > 40 || /[.:,;]$/.test(ligne.trim())) return false
    if (!/^[\p{Lu}\p{L}'’ .-]+$/u.test(ligne)) return false

    const mots = ligne.trim().split(/\s+/)
    if (mots.length < 2 || mots.length > 4) return false
    // Une lettre isolée est un reste de reconnaissance de texte, pas un nom.
    if (mots.some((mot) => mot.length < 2)) return false
    if (mots.some((mot) => MOTS_PAS_UN_NOM.test(mot))) return false
    // « Responsable Marketing Digital » a la forme d'un nom propre.
    if (MOTS_TITRE_POSTE.test(ligne)) return false
    return mots.every((mot) => /^[\p{Lu}]/u.test(mot))
  }

  /**
   * Nom en lettres espacées : le PDF livre « A Ï C H A » ou « KO N AT É ». On
   * recolle les lettres ; les limites entre mots sont perdues, ce qui suffit
   * pour un prénom ou un nom seul.
   */
  const recoller = (ligne: string) => {
    const morceaux = ligne.split(/\s+/)
    return morceaux.length >= 3 && morceaux.every((m) => m.length <= 2) ? morceaux.join('') : ligne
  }

  /** Un seul mot qui pourrait être un prénom ou un nom : « AÏCHA », « Konaté ». */
  const motDeNom = (ligne: string) =>
    /^[\p{Lu}][\p{L}'’-]{1,24}$/u.test(ligne) &&
    !MOTS_PAS_UN_NOM.test(ligne) &&
    !TITRES.some((titre) => estUnTitre(ligne, titre.motifs))

  /**
   * Monogramme de gabarit collé au nom : « AK » suivi de « KONATÉ » quand le
   * prénom « AÏCHA » est à la ligne au-dessus. Les initiales ne sont retirées
   * que si elles correspondent bien aux mots du nom.
   */
  const sansMonogramme = (ligne: string, voisine: string) => {
    const m = ligne.match(/^(\p{Lu}{2,3})\s+(\S.*)$/u)
    if (!m) return ligne
    const initiales = `${voisine} ${m[2]}`
      .split(/\s+/)
      .map((mot) => mot[0] ?? '')
      .join('')
      .toUpperCase()
    return initiales.startsWith(m[1]) ? m[2] : ligne
  }

  /**
   * Nom en une ligne (« Aïcha Konaté ») ou réparti sur deux, prénom puis nom,
   * comme le font beaucoup de modèles à gros titre. On garde le premier trouvé
   * en lisant la page de haut en bas.
   */
  const trouverNom = (liste: string[]) => {
    for (let i = 0; i < liste.length; i += 1) {
      const ligne = recoller(nettoyerNom(liste[i]))
      const suivante = liste[i + 1] ? sansMonogramme(recoller(nettoyerNom(liste[i + 1])), ligne) : ''
      if (motDeNom(ligne) && motDeNom(suivante)) return { brut: liste[i], nom: `${ligne} ${suivante}` }
      if (ressembleAUnNom(liste[i])) return { brut: liste[i], nom: ligne }
    }
    return null
  }

  // Certains gabarits placent le nom dans une colonne latérale, hors en-tête,
  // parfois relue après une autre colonne : à défaut, on le cherche dans le
  // haut du texte, en sautant les listes de mots isolés (« Excel », « Word »)
  // qui formeraient sinon un faux prénom et nom.
  const listes = new Set([
    ...(sections.competences ?? []),
    ...(sections.langues ?? []),
    ...(sections.interets ?? []),
  ])
  const trouve =
    trouverNom(entete) ?? trouverNom(lignesCandidat.filter((l) => !listes.has(l)).slice(0, 30))
  const candidatBrut = trouve?.brut
  const candidatNom = trouve?.nom
  if (candidatNom) {
    const mots = candidatNom.split(/\s+/)
    data.profile.firstName = mots[0]
    data.profile.lastName = mots.slice(1).join(' ')
    found.push('Nom et prénom')
  }

  // Le titre se cherche d'abord dans l'en-tête, juste sous le nom, et jamais
  // dans une ligne qui ressemble à une référence (« Directeur — Entreprise »)
  // ou à une expérience datée.
  const titrePlausible = (ligne: string) =>
    ligne !== candidatNom &&
    MOTS_TITRE_POSTE.test(ligne) &&
    ligne.length < 70 &&
    !ANNEE_TEST.test(ligne) &&
    !MOTS_PERIODE.test(ligne) &&
    !EMAIL.test(ligne) &&
    !/[—|]|\bchez\b/i.test(ligne)

  // Le titre se cherche dans l'en-tête seulement. Ailleurs, on tomberait sur
  // l'intitulé d'une référence ou d'une ancienne fonction : mieux vaut un
  // champ vide, que l'utilisateur remplit, qu'un champ faux qu'il ne relit pas.
  const indexNom = candidatBrut ? entete.indexOf(candidatBrut) : -1
  const titre =
    (indexNom >= 0 ? entete.slice(indexNom + 1, indexNom + 4).find(titrePlausible) : undefined) ??
    entete.find(titrePlausible)
  if (titre) {
    data.profile.title = titre.replace(/^[-•·\s]+/, '').trim()
    found.push('Titre du poste')
  }

  /* -- Accroche --------------------------------------------------------- */
  const profil = (sections.profil ?? []).join(' ').trim()
  if (profil.length > 40) {
    data.profile.about = profil
    found.push('Accroche')
  }

  /* -- Expériences ------------------------------------------------------ */
  for (const entree of entreesDatees(sections.experience ?? [])) {
    const { first, second } = couper(entree.tete)
    if (!first && !second) continue

    // Beaucoup de CV placent l'employeur sur la ligne suivante :
    // « Responsable Marketing » puis « Ivoire Telecom / Abidjan ».
    let employeur = second
    let corps = entree.corps
    if (!employeur && corps.length && corps[0].length < 60 && /[/|·—-]|\b(sarl|sa|sas|group|agence|cabinet)\b/i.test(corps[0])) {
      employeur = couper(corps[0]).first
      corps = corps.slice(1)
    }

    data.experiences.push({
      id: uid('exp'),
      role: first,
      company: employeur,
      location: '',
      start: entree.periode?.start ?? '',
      end: entree.periode?.end ?? '',
      current: entree.periode?.current ?? false,
      description: corps.join('\n'),
    })
  }
  if (data.experiences.length) found.push(`${data.experiences.length} expérience(s)`)

  /* -- Formations ------------------------------------------------------- */
  for (const entree of entreesDatees(sections.formation ?? [])) {
    const { first, second } = couper(entree.tete)
    if (!first && !second) continue
    data.educations.push({
      id: uid('edu'),
      degree: first,
      school: second || entree.corps[0] || '',
      location: '',
      start: entree.periode?.start ?? '',
      end: entree.periode?.end ?? '',
      description: entree.corps.slice(second ? 0 : 1).join(' '),
    })
  }
  if (data.educations.length) found.push(`${data.educations.length} formation(s)`)

  /* -- Compétences, langues, loisirs ------------------------------------ */
  for (const nom of listeCourte(sections.competences ?? []).slice(0, 14)) {
    data.skills.push({ id: uid('sk'), name: nom, level: 70 })
  }
  if (data.skills.length) found.push(`${data.skills.length} compétence(s)`)

  for (const ligne of listeCourte(sections.langues ?? []).slice(0, 8)) {
    const [nom] = ligne.split(/\s*[:(]\s*/)
    const niveau = /maternelle|courant|bilingue/i.test(ligne)
      ? 100
      : /avanc|profession/i.test(ligne)
        ? 85
        : /interm/i.test(ligne)
          ? 60
          : /debut|débit|notion|basique/i.test(ligne)
            ? 35
            : 70
    if (nom) data.languages.push({ id: uid('lg'), name: nom.trim(), level: niveau })
  }
  if (data.languages.length) found.push(`${data.languages.length} langue(s)`)

  const loisirs = listeCourte(sections.interets ?? []).slice(0, 8)
  if (loisirs.length) {
    data.hobbies = loisirs
    found.push(`${loisirs.length} centre(s) d’intérêt`)
  }

  /* -- Distinctions ----------------------------------------------------- */
  for (const entree of entreesDatees(sections.distinctions ?? []).slice(0, 6)) {
    const { first, second } = couper(entree.tete)
    if (!first) continue
    data.awards.push({
      id: uid('aw'),
      title: first,
      organization: second,
      period: entree.periode?.start ?? '',
      description: entree.corps.join(' '),
    })
  }
  if (data.awards.length) found.push(`${data.awards.length} distinction(s)`)

  return { data, found }
}
