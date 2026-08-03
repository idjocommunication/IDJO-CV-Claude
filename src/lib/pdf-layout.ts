/**
 * Reconstitution de l'ordre de lecture d'une page PDF.
 *
 * Un PDF ne contient pas de paragraphes : seulement des fragments de texte
 * posés à des coordonnées. Les lire dans l'ordre où ils arrivent fonctionne
 * pour une page en une colonne, mais mélange tout dès qu'il y en a deux ou
 * trois — et c'est la mise en page de la quasi-totalité des CV. Le nom du
 * candidat se retrouve alors collé à une référence, une date à un diplôme.
 *
 * On procède donc en trois temps : regrouper les fragments en lignes d'après
 * leur hauteur, repérer les gouttières verticales qui séparent les colonnes,
 * puis restituer l'en-tête pleine largeur, puis chaque colonne de haut en bas.
 *
 * Module sans dépendance : il se teste seul, à partir de simples coordonnées.
 */

export interface FragmentTexte {
  str: string
  /** Abscisse du coin bas-gauche, en points PDF. */
  x: number
  /** Ordonnée, croissante vers le haut. */
  y: number
  width: number
  height: number
}

interface Ligne {
  y: number
  fragments: FragmentTexte[]
  gauche: number
  droite: number
}

/** Deux fragments appartiennent à la même ligne si leurs bases se touchent. */
const TOLERANCE_LIGNE = 3

/**
 * Largeur minimale d'une gouttière, proportionnelle à la page : sur un CV
 * dense en trois colonnes, les blancs de séparation descendent à une dizaine
 * de points seulement.
 */
const gouttiereMinimale = (largeurPage: number) => Math.max(5, largeurPage * 0.008)

/** Une ligne plus large que cette part de la page traverse les colonnes. */
const PART_PLEINE_LARGEUR = 0.45

/** Une vraie colonne porte au moins ce nombre de lignes qui lui appartiennent. */
const LIGNES_MINIMALES_PAR_COLONNE = 3

/** Au-delà, on n'a plus affaire à des colonnes mais à un tableau. */
const COLONNES_MAX = 3

function medianeHauteur(fragments: FragmentTexte[]) {
  const hauteurs = fragments.map((f) => f.height).filter((h) => h > 0).sort((a, b) => a - b)
  return hauteurs.length ? hauteurs[Math.floor(hauteurs.length / 2)] : 10
}

function grouperEnLignes(fragments: FragmentTexte[], tolerance: number): Ligne[] {
  const lignes: Ligne[] = []

  for (const fragment of [...fragments].sort((a, b) => b.y - a.y)) {
    const existante = lignes.find((ligne) => Math.abs(ligne.y - fragment.y) <= tolerance)
    if (existante) {
      existante.fragments.push(fragment)
      existante.gauche = Math.min(existante.gauche, fragment.x)
      existante.droite = Math.max(existante.droite, fragment.x + fragment.width)
    } else {
      lignes.push({
        y: fragment.y,
        fragments: [fragment],
        gauche: fragment.x,
        droite: fragment.x + fragment.width,
      })
    }
  }

  return lignes
}

/**
 * Colonnes déduites des bords d'alignement.
 *
 * Chercher des bandes vides ne suffit pas : sur un CV dense, deux colonnes
 * peuvent n'être séparées que de quelques points, et un seul paragraphe qui
 * déborde referme la gouttière. En revanche, une mise en page en colonnes
 * aligne toujours ses textes sur un petit nombre d'abscisses de départ. On
 * cherche donc les abscisses où commencent beaucoup de lignes.
 */
function trouverColonnesParAlignement(lignes: Ligne[], largeurPage: number) {
  const seau = 4
  const compte = new Map<number, number>()

  // Les lignes qui traversent la page sont écartées : elles mêlent le texte de
  // plusieurs colonnes et leur bord gauche ne dit rien de la mise en page.
  for (const ligne of lignes) {
    if (ligne.droite - ligne.gauche > largeurPage * PART_PLEINE_LARGEUR) continue
    const cle = Math.round(ligne.gauche / seau)
    compte.set(cle, (compte.get(cle) ?? 0) + 1)
  }

  const pics = [...compte.entries()]
    .filter(([, n]) => n >= LIGNES_MINIMALES_PAR_COLONNE)
    .map(([cle, n]) => ({ x: cle * seau, n }))
    .sort((a, b) => b.n - a.n)

  // On retient les départs les plus fréquents, suffisamment éloignés les uns
  // des autres pour être de vraies colonnes et non des retraits de paragraphe.
  const ecartMinimal = largeurPage * 0.12
  const retenus: number[] = []
  for (const pic of pics) {
    if (retenus.every((x) => Math.abs(x - pic.x) >= ecartMinimal)) retenus.push(pic.x)
    if (retenus.length === COLONNES_MAX) break
  }

  return retenus.sort((a, b) => a - b)
}

/**
 * Bandes verticales sans aucun texte, assez larges pour séparer des colonnes.
 *
 * Le calcul se fait **ligne par ligne**, en écartant celles qui traversent la
 * page : nom en tête, bandeau de contact, filet de séparation. Une seule de ces
 * lignes suffirait sinon à boucher toutes les gouttières — et la page entière
 * serait relue comme une colonne unique, ce qui remet le texte dans le désordre.
 */
function trouverGouttieres(lignes: Ligne[], largeurPage: number) {
  // Un point par case : arrondir plus grossièrement grignote les gouttières
  // étroites des mises en page à trois colonnes, qui disparaissent alors.
  const pas = 1
  const cases = Math.max(1, Math.ceil(largeurPage / pas))
  const occupe = new Uint8Array(cases)

  const etroites = lignes.filter(
    (ligne) => ligne.droite - ligne.gauche <= largeurPage * PART_PLEINE_LARGEUR,
  )

  for (const ligne of etroites) {
    for (const fragment of ligne.fragments) {
      const debut = Math.max(0, Math.floor(fragment.x / pas))
      const fin = Math.min(cases - 1, Math.ceil((fragment.x + fragment.width) / pas))
      for (let i = debut; i <= fin; i += 1) occupe[i] = 1
    }
  }

  const candidates: { centre: number; largeur: number }[] = []
  let depart: number | null = null
  const minimum = gouttiereMinimale(largeurPage)

  for (let i = 0; i < cases; i += 1) {
    if (!occupe[i]) {
      if (depart === null) depart = i
      continue
    }
    if (depart !== null) {
      const largeur = (i - depart) * pas
      // Les marges gauche et droite ne sont pas des gouttières.
      if (largeur >= minimum && depart > 0) {
        candidates.push({ centre: ((depart + i) / 2) * pas, largeur })
      }
      depart = null
    }
  }

  // On ne garde que les séparations les plus franches : au-delà de trois
  // colonnes, on découperait des tableaux ou des listes alignées.
  const retenues = candidates
    .sort((a, b) => b.largeur - a.largeur)
    .slice(0, COLONNES_MAX - 1)
    .map((c) => c.centre)
    .sort((a, b) => a - b)

  return retenues
}

/**
 * Une séparation n'est retenue que si elle a vraiment du texte des deux côtés.
 * Sans ce contrôle, la marge droite d'une page en une seule colonne passerait
 * pour une frontière et couperait le CV en deux.
 */
function validerGouttieres(candidates: number[], lignes: Ligne[], largeurPage: number) {
  const etroites = lignes.filter(
    (ligne) => ligne.droite - ligne.gauche <= largeurPage * PART_PLEINE_LARGEUR,
  )

  const soutenues = candidates
    .map((centre) => ({
      centre,
      soutien: Math.min(
        etroites.filter((l) => l.droite <= centre).length,
        etroites.filter((l) => l.gauche >= centre).length,
      ),
    }))
    .filter((c) => c.soutien >= LIGNES_MINIMALES_PAR_COLONNE)

  return soutenues
    .sort((a, b) => b.soutien - a.soutien)
    .slice(0, COLONNES_MAX - 1)
    .map((c) => c.centre)
    .sort((a, b) => a - b)
}

/** Rassemble les frontières proches en une seule. */
function fusionner(valeurs: number[], ecartMinimal: number) {
  const triees = [...valeurs].sort((a, b) => a - b)
  const fusionnees: number[] = []
  for (const valeur of triees) {
    const derniere = fusionnees[fusionnees.length - 1]
    if (derniere !== undefined && valeur - derniere < ecartMinimal) continue
    fusionnees.push(valeur)
  }
  return fusionnees
}

function mediane(valeurs: number[]) {
  if (!valeurs.length) return 0
  const tries = [...valeurs].sort((a, b) => a - b)
  return tries[Math.floor(tries.length / 2)]
}

/**
 * Assemble les fragments d'une ligne en texte.
 *
 * Deux pièges classiques des CV. D'abord les titres à lettres espacées
 * (`letter-spacing`) : le PDF livre alors une lettre par fragment, et coller
 * une espace entre chacune donnerait « R E S P O N S A B L E ». On mesure donc
 * les écarts de la ligne pour distinguer l'espacement des lettres d'une vraie
 * séparation de mots. Ensuite les apostrophes typographiques, souvent posées
 * comme un fragment isolé : elles sont recollées au mot.
 */
function texteDeLigne(ligne: Ligne) {
  const tries = [...ligne.fragments].sort((a, b) => a.x - b.x)
  if (!tries.length) return ''

  const ecarts: number[] = []
  for (let i = 1; i < tries.length; i += 1) {
    ecarts.push(tries[i].x - (tries[i - 1].x + tries[i - 1].width))
  }

  // Ligne composée surtout de caractères isolés : c'est du texte lettré.
  const lettree =
    tries.length >= 5 && mediane(tries.map((f) => f.str.trim().length)) <= 1

  const hauteur = mediane(tries.map((f) => f.height)) || 10
  const seuil = lettree
    ? Math.max(mediane(ecarts.filter((e) => e > 0)) * 2.2, hauteur * 0.45)
    // Un seuil trop haut souderait les mots d'un grand titre — « Je suisAïcha ».
    // Mieux vaut une espace de trop dans un mot rare qu'un nom illisible.
    : Math.max(1, hauteur * 0.2)

  let texte = ''
  let finPrecedente: number | null = null

  for (const fragment of tries) {
    const morceau = fragment.str
    if (!morceau) continue

    if (finPrecedente !== null) {
      const ecart = fragment.x - finPrecedente
      if (ecart > seuil && !texte.endsWith(' ') && !morceau.startsWith(' ')) texte += ' '
    }

    texte += morceau
    finPrecedente = fragment.x + fragment.width
  }

  return nettoyer(texte)
}

/** Recolle ce que le découpage en fragments a pu disjoindre. */
function nettoyer(texte: string) {
  return texte
    .replace(/\s+/g, ' ')
    // « Aujourd ʼ hui » → « Aujourd’hui », « l ' échelle » → « l'échelle »
    .replace(/(\p{L})\s*[’'ʼ‘`]\s*(\p{L})/gu, '$1’$2')
    // « INP - HB » → « INP-HB », mais « 2019 - 2021 » garde ses espaces
    .replace(/(\p{L})\s-\s(\p{L})/gu, '$1-$2')
    .replace(/\s+([,;:.!?%])/g, '$1')
    .trim()
}

/**
 * Texte d'une page, dans l'ordre où un humain la lit : ce qui traverse la page
 * d'abord, puis chaque colonne de haut en bas.
 */
export function texteDeLaPage(fragments: FragmentTexte[], largeurPage: number): string {
  const utiles = fragments.filter((f) => f.str && f.str.trim().length > 0)
  if (!utiles.length) return ''

  const tolerance = Math.max(TOLERANCE_LIGNE, medianeHauteur(utiles) * 0.4)
  const lignes = grouperEnLignes(utiles, tolerance)

  // Deux lectures de la page, complémentaires : les blancs verticaux, francs
  // mais refermés par le moindre paragraphe qui déborde, et les bords
  // d'alignement, qui résistent aux colonnes serrées. On réunit les deux, puis
  // on ne garde que les frontières réellement soutenues par du texte.
  const parBlancs = trouverGouttieres(lignes, largeurPage)
  const departs = trouverColonnesParAlignement(lignes, largeurPage)
  const parAlignement = departs.slice(1).map((depart) => depart - 2)

  const gouttieres = validerGouttieres(
    fusionner([...parBlancs, ...parAlignement], largeurPage * 0.05),
    lignes,
    largeurPage,
  )

  if (!gouttieres.length) {
    return lignes
      .map(texteDeLigne)
      .filter(Boolean)
      .join('\n')
  }

  const bornes = [0, ...gouttieres, largeurPage]

  const colonneDuFragment = (fragment: FragmentTexte) => {
    const milieu = fragment.x + fragment.width / 2
    for (let i = 0; i < bornes.length - 1; i += 1) {
      if (milieu >= bornes[i] && milieu < bornes[i + 1]) return i
    }
    return bornes.length - 2
  }

  /**
   * Les rubriques d'un CV en colonnes sont souvent alignées à la même hauteur :
   * « EXPÉRIENCE », « FORMATION » et « RÉFÉRENCES » forment alors une seule
   * ligne large. La rattacher à une pseudo-colonne « pleine largeur »
   * détacherait chaque titre de son contenu. On la redécoupe donc en autant de
   * morceaux qu'elle touche de colonnes — sauf si un fragment enjambe lui-même
   * une gouttière, signe d'un vrai bandeau traversant.
   */
  const groupes = new Map<number, Ligne[]>()
  const ajouter = (colonne: number, ligne: Ligne) => {
    const liste = groupes.get(colonne) ?? []
    liste.push(ligne)
    groupes.set(colonne, liste)
  }

  for (const ligne of lignes) {
    const enjambe = ligne.fragments.some((fragment) =>
      gouttieres.some((g) => fragment.x < g - 1 && fragment.x + fragment.width > g + 1),
    )

    if (enjambe) {
      ajouter(-1, ligne)
      continue
    }

    const parColonne = new Map<number, FragmentTexte[]>()
    for (const fragment of ligne.fragments) {
      const colonne = colonneDuFragment(fragment)
      parColonne.set(colonne, [...(parColonne.get(colonne) ?? []), fragment])
    }

    for (const [colonne, fragments] of parColonne) {
      ajouter(colonne, {
        y: ligne.y,
        fragments,
        gauche: Math.min(...fragments.map((f) => f.x)),
        droite: Math.max(...fragments.map((f) => f.x + f.width)),
      })
    }
  }

  const morceaux: string[] = []
  for (const colonne of [...groupes.keys()].sort((a, b) => a - b)) {
    const contenu = (groupes.get(colonne) ?? [])
      .sort((a, b) => b.y - a.y)
      .map(texteDeLigne)
      .filter(Boolean)
    if (contenu.length) morceaux.push(contenu.join('\n'))
  }

  return morceaux.join('\n\n')
}
