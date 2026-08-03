export type TemplateId =
  | 'abidjan'
  | 'plateau'
  | 'lagune'
  | 'cocody'
  | 'marcory'
  | 'treichville'
  | 'bassam'
  | 'yamoussoukro'

export type SectionId =
  | 'profile'
  | 'experiences'
  | 'educations'
  | 'skills'
  | 'languages'
  | 'awards'
  | 'references'
  | 'hobbies'

export interface Profile {
  firstName: string
  lastName: string
  title: string
  /** Data URL ou URL distante. Optionnel : les modèles gèrent l'absence de photo. */
  photo?: string
  about: string
  phone: string
  email: string
  website: string
  address: string
  city: string
}

export interface Experience {
  id: string
  role: string
  company: string
  location: string
  start: string
  end: string
  current: boolean
  description: string
}

export interface Education {
  id: string
  degree: string
  school: string
  location: string
  start: string
  end: string
  description: string
}

export interface Skill {
  id: string
  name: string
  /** 0 → 100 */
  level: number
}

export interface Language {
  id: string
  name: string
  level: number
}

export interface Award {
  id: string
  title: string
  organization: string
  period: string
  description: string
}

export interface Reference {
  id: string
  name: string
  role: string
  company: string
  contact: string
}

export interface CvSettings {
  template: TemplateId
  /** Identifiant de palette (voir `src/lib/theme.ts`) ou « perso ». */
  theme: string
  /** Teinte personnalisée, utilisée quand `theme` vaut « perso ». */
  accent: string
  /** Dose de couleur appliquée à la feuille (voir `INTENSITIES`). */
  intensity:
    | 'filet'
    | 'sobre'
    | 'doux'
    | 'colore'
    | 'soutenu'
    | 'intense'
    | 'profond'
  /** Famille typographique du document (voir `FONT_CHOICES` dans `src/lib/theme.ts`). */
  fontFamily:
    | 'sans'
    | 'serif'
    | 'condense'
    | 'grotesk'
    | 'geometrique'
    | 'humaniste'
    | 'technique'
    | 'editorial'
    | 'elegant'
  /** Échelle typographique du document (0.9 → 1.15). */
  fontScale: number
  showPhoto: boolean
}

export interface CvData {
  profile: Profile
  experiences: Experience[]
  educations: Education[]
  skills: Skill[]
  languages: Language[]
  awards: Award[]
  references: Reference[]
  hobbies: string[]
  settings: CvSettings
}

export interface TemplateMeta {
  id: TemplateId
  name: string
  slug: string
  tagline: string
  description: string
  bestFor: string[]
  sections: SectionId[]
  atsScore: number
  /** Palette proposée par défaut pour ce modèle. */
  defaultTheme: string
  /** Couleurs de scène utilisées par le carrousel du hero. */
  stage: { bg: string; panel: string }
}
