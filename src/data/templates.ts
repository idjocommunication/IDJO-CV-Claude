import type { TemplateMeta } from '@/lib/types'

/**
 * Les huit modèles de la bibliothèque IDJÔ CV.
 * Chaque modèle reprend une mise en page éprouvée, habillée par la palette et
 * la typographie choisies dans l'éditeur.
 */
export const TEMPLATES: TemplateMeta[] = [
  {
    id: 'abidjan',
    name: 'Abidjan',
    slug: 'abidjan',
    tagline: 'Le complet',
    description:
      "Une page dense et parfaitement structurée : bandeau d'accroche, résumé, barre de contact puis trois colonnes (expériences, formations, références). Idéal quand votre parcours est riche et que chaque ligne compte.",
    bestFor: ['Profils expérimentés', 'Candidatures spontanées', 'Secteur privé'],
    sections: [
      'profile',
      'experiences',
      'educations',
      'references',
      'awards',
      'skills',
      'languages',
    ],
    atsScore: 92,
    defaultTheme: 'nuit',
    stage: { bg: '#0E2A52', panel: '#153A6E' },
  },
  {
    id: 'plateau',
    name: 'Plateau',
    slug: 'plateau',
    tagline: "L'épuré",
    description:
      "Beaucoup de blanc, une hiérarchie typographique franche et des niveaux de compétences en pastilles. Le modèle qui respire, pensé pour les métiers créatifs et le digital.",
    bestFor: ['Designers', 'Métiers du digital', 'Jeunes diplômés'],
    sections: ['profile', 'educations', 'experiences', 'skills'],
    atsScore: 96,
    defaultTheme: 'nuit',
    stage: { bg: '#1B62D6', panel: '#2C7CEC' },
  },
  {
    id: 'lagune',
    name: 'Lagune',
    slug: 'lagune',
    tagline: 'Le corporate',
    description:
      "Une colonne latérale pleine qui met en avant votre photo, votre pitch et vos expertises, face à un contenu principal aéré. La référence pour la banque, l'audit et l'administration.",
    bestFor: ['Banque & finance', 'Audit & conseil', 'Administration'],
    sections: ['profile', 'skills', 'awards', 'experiences', 'educations'],
    atsScore: 90,
    defaultTheme: 'lagon',
    stage: { bg: '#04122B', panel: '#0E2A52' },
  },
  {
    id: 'cocody',
    name: 'Cocody',
    slug: 'cocody',
    tagline: 'Le polyvalent',
    description:
      "Une carte latérale arrondie regroupant contact, références, compétences et centres d'intérêt, et une colonne principale consacrée au parcours. Le meilleur compromis entre densité et élégance.",
    bestFor: ['Cadres intermédiaires', 'Commerce & marketing', 'Stages et alternances'],
    sections: [
      'profile',
      'experiences',
      'educations',
      'references',
      'skills',
      'hobbies',
    ],
    atsScore: 88,
    defaultTheme: 'azur',
    stage: { bg: '#2C7CEC', panel: '#5C9CF3' },
  },
  {
    id: 'marcory',
    name: 'Marcory',
    slug: 'marcory',
    tagline: 'Le symétrique',
    description:
      "Bandeaux arrondis en haut et en bas, photo encadrée face au bloc de contact, puis deux colonnes symétriques — formation à gauche, expérience à droite — séparées par une timeline centrale. Compétences et références ferment la page sur un aplat clair.",
    bestFor: ['Profils commerciaux', 'Communication', 'Candidatures classiques'],
    sections: [
      'profile',
      'educations',
      'experiences',
      'skills',
      'references',
    ],
    atsScore: 89,
    defaultTheme: 'azur',
    stage: { bg: '#1B5FA8', panel: '#3E86D2' },
  },
  {
    id: 'treichville',
    name: 'Treichville',
    slug: 'treichville',
    tagline: 'Le contrasté',
    description:
      "Une colonne sombre pleine hauteur — profil, formation, coordonnées — posée sur un aplat de couleur arrondi, face à une colonne blanche où le nom est surligné. Les compétences se lisent en segments : le modèle le plus affirmé de la bibliothèque.",
    bestFor: ['Direction & management', 'Métiers créatifs', 'Profils seniors'],
    sections: [
      'profile',
      'educations',
      'experiences',
      'skills',
      'languages',
      'hobbies',
    ],
    atsScore: 86,
    defaultTheme: 'safran',
    stage: { bg: '#1C1C1C', panel: '#96601A' },
  },
  {
    id: 'bassam',
    name: 'Bassam',
    slug: 'bassam',
    tagline: 'Le structuré',
    description:
      "Un bandeau de couleur porte la photo et le nom, un bloc sombre regroupe le résumé et les coordonnées, puis deux colonnes à timeline déroulent références, formation, expérience et compétences. Lisible d'un coup d'œil, même sur un parcours chargé.",
    bestFor: ['Cadres', 'Ingénierie & BTP', 'ONG et institutions'],
    sections: [
      'profile',
      'references',
      'educations',
      'experiences',
      'skills',
    ],
    atsScore: 91,
    defaultTheme: 'turquoise',
    stage: { bg: '#0E3A48', panel: '#0E6B85' },
  },
  {
    id: 'yamoussoukro',
    name: 'Yamoussoukro',
    slug: 'yamoussoukro',
    tagline: "L'institutionnel",
    description:
      "Une feuille encadrée d'un liseré sombre, une photo ronde, un panneau de contact en quatre cases et des cartes coiffées d'un titre en gélule. Le modèle le plus formel, taillé pour les concours et les dossiers administratifs.",
    bestFor: ['Fonction publique', 'Concours & bourses', 'Santé et éducation'],
    sections: [
      'profile',
      'educations',
      'references',
      'experiences',
      'skills',
      'languages',
      'hobbies',
    ],
    atsScore: 87,
    defaultTheme: 'acier',
    stage: { bg: '#1E2A32', panel: '#2F5E7E' },
  },
]

export const TEMPLATE_BY_ID = Object.fromEntries(
  TEMPLATES.map((t) => [t.id, t]),
) as Record<TemplateMeta['id'], TemplateMeta>

export function getTemplate(slug: string) {
  return TEMPLATES.find((t) => t.slug === slug)
}
