import { readableOn, shade, tint } from '@/lib/color'
import type { CvSettings } from '@/lib/types'

/**
 * Palettes des documents CV. Le site reste blanc / noir / gris ; seule la
 * feuille se colore. Chaque teinte est profonde et désaturée juste ce qu'il
 * faut pour rester lisible à l'écran comme à l'impression, texte blanc inclus.
 */

export interface ThemeDefinition {
  id: string
  name: string
  /** Teinte principale, utilisée pour les aplats pleins et les titres. */
  accent: string
  /** Famille, pour regrouper les pastilles dans l'interface. */
  family: 'neutre' | 'froid' | 'chaud' | 'nature'
}

export const THEMES: ThemeDefinition[] = [
  { id: 'encre', name: 'Encre', accent: '#131313', family: 'neutre' },
  { id: 'graphite', name: 'Graphite', accent: '#2B2B2B', family: 'neutre' },
  { id: 'ardoise', name: 'Ardoise', accent: '#3E4A57', family: 'neutre' },
  { id: 'taupe', name: 'Taupe', accent: '#57504A', family: 'neutre' },
  { id: 'nuit', name: 'Bleu nuit', accent: '#17284D', family: 'froid' },
  { id: 'cobalt', name: 'Cobalt', accent: '#1544A0', family: 'froid' },
  { id: 'azur', name: 'Azur', accent: '#1B5FA8', family: 'froid' },
  { id: 'acier', name: 'Acier', accent: '#2F5E7E', family: 'froid' },
  { id: 'indigo', name: 'Indigo', accent: '#3B3E92', family: 'froid' },
  { id: 'turquoise', name: 'Turquoise', accent: '#0E6B85', family: 'froid' },
  { id: 'lagon', name: 'Lagon', accent: '#0F6F73', family: 'froid' },
  { id: 'foret', name: 'Forêt', accent: '#1F5136', family: 'nature' },
  { id: 'emeraude', name: 'Émeraude', accent: '#0E6B4E', family: 'nature' },
  { id: 'sauge', name: 'Sauge', accent: '#4A6350', family: 'nature' },
  { id: 'kaki', name: 'Kaki', accent: '#41503B', family: 'nature' },
  { id: 'olive', name: 'Olive', accent: '#4C5A26', family: 'nature' },
  { id: 'safran', name: 'Safran', accent: '#96601A', family: 'chaud' },
  { id: 'bronze', name: 'Bronze', accent: '#8A5A22', family: 'chaud' },
  { id: 'cuivre', name: 'Cuivre', accent: '#A0501E', family: 'chaud' },
  { id: 'brique', name: 'Terre cuite', accent: '#9C3B26', family: 'chaud' },
  { id: 'cacao', name: 'Cacao', accent: '#5B3A2B', family: 'chaud' },
  { id: 'grenat', name: 'Grenat', accent: '#A32552', family: 'chaud' },
  { id: 'bordeaux', name: 'Bordeaux', accent: '#7A2233', family: 'chaud' },
  { id: 'prune', name: 'Prune', accent: '#5A2A4C', family: 'chaud' },
]

export const THEME_BY_ID = Object.fromEntries(THEMES.map((t) => [t.id, t])) as Record<
  string,
  ThemeDefinition
>

export const DEFAULT_THEME = 'nuit'

/** Intensité : dose de couleur appliquée à la feuille. */
export type Intensity = CvSettings['intensity']

export interface IntensityDefinition {
  id: Intensity
  label: string
  hint: string
  /**
   * Niveau de remplissage :
   * 0 — aucun aplat coloré, la couleur ne touche que titres et filets ;
   * 1 — aplats clairs teintés ; 2 — aplats teintés francs ; 3 — aplats pleins.
   */
  fill: 0 | 1 | 2 | 3
  /** Clarté des deux aplats clairs (`panel`, `panelSoft`). */
  light: [number, number]
  /** Saturation de ces aplats. */
  chroma: number
  /** Gris de repli quand la dose ne colore pas les aplats. */
  neutral: [string, string]
  /** Les aplats pleins prennent la version foncée de la teinte. */
  deepFlats?: boolean
  /** Bandeaux teintés au lieu d'être pleins — le texte y passe en foncé. */
  softBand?: boolean
}

/**
 * Sept doses, de la plus discrète à la plus soutenue. Les identifiants
 * `sobre`, `colore` et `intense` sont ceux d'origine : les CV déjà enregistrés
 * gardent leur habillage.
 */
export const INTENSITIES: IntensityDefinition[] = [
  {
    id: 'filet',
    label: 'Filet',
    hint: 'Traits colorés, fonds blancs',
    fill: 0,
    light: [99, 97],
    chroma: 14,
    neutral: ['#FBFBFB', '#F6F6F6'],
  },
  {
    id: 'sobre',
    label: 'Sobre',
    hint: 'Titres et filets, fonds gris',
    fill: 0,
    light: [97, 94],
    chroma: 24,
    neutral: ['#F2F2F2', '#EBEBEB'],
  },
  {
    id: 'doux',
    label: 'Doux',
    hint: 'Bandeaux pastel, texte foncé',
    fill: 1,
    light: [97, 94],
    chroma: 26,
    neutral: ['#F4F4F4', '#EDEDED'],
    softBand: true,
  },
  {
    id: 'colore',
    label: 'Coloré',
    hint: 'Bandeaux et blocs teintés',
    fill: 1,
    light: [96, 91],
    chroma: 30,
    neutral: ['#F2F2F2', '#EDEDED'],
  },
  {
    id: 'soutenu',
    label: 'Soutenu',
    hint: 'Aplats teintés plus francs',
    fill: 2,
    light: [92, 86],
    chroma: 38,
    neutral: ['#EDEDED', '#E4E4E4'],
  },
  {
    id: 'intense',
    label: 'Intense',
    hint: 'Aplats pleins de couleur',
    fill: 3,
    light: [96, 90],
    chroma: 30,
    neutral: ['#F2F2F2', '#EDEDED'],
  },
  {
    id: 'profond',
    label: 'Profond',
    hint: 'Aplats pleins assombris',
    fill: 3,
    light: [93, 87],
    chroma: 26,
    neutral: ['#EFEFEF', '#E8E8E8'],
    deepFlats: true,
  },
]

export const INTENSITY_BY_ID = Object.fromEntries(
  INTENSITIES.map((i) => [i.id, i]),
) as Record<Intensity, IntensityDefinition>

export const DEFAULT_INTENSITY: Intensity = 'colore'

export type FontChoice = CvSettings['fontFamily']

export const FONT_CHOICES: { id: FontChoice; label: string; hint: string; css: string }[] = [
  { id: 'sans', label: 'Moderne', hint: 'Inter', css: 'var(--font-inter), sans-serif' },
  { id: 'serif', label: 'Classique', hint: 'Lora', css: 'var(--font-lora), Georgia, serif' },
  {
    id: 'condense',
    label: 'Compact',
    hint: 'Archivo Narrow',
    css: 'var(--font-archivo), "Arial Narrow", sans-serif',
  },
  {
    id: 'grotesk',
    label: 'Affirmé',
    hint: 'Montserrat',
    css: 'var(--font-montserrat), "Helvetica Neue", sans-serif',
  },
  {
    id: 'geometrique',
    label: 'Rond',
    hint: 'Poppins',
    css: 'var(--font-poppins), "Century Gothic", sans-serif',
  },
  {
    id: 'humaniste',
    label: 'Doux',
    hint: 'Work Sans',
    css: 'var(--font-work-sans), "Segoe UI", sans-serif',
  },
  {
    id: 'technique',
    label: 'Technique',
    hint: 'IBM Plex Sans',
    css: 'var(--font-plex), "Segoe UI", sans-serif',
  },
  {
    id: 'editorial',
    label: 'Éditorial',
    hint: 'Source Serif 4',
    css: 'var(--font-source-serif), Cambria, serif',
  },
  {
    id: 'elegant',
    label: 'Élégant',
    hint: 'Playfair Display',
    css: 'var(--font-playfair), "Times New Roman", serif',
  },
]

/** Palette résolue, consommée par les modèles de CV et la lettre. */
export interface ResolvedTheme {
  accent: string
  /** Version foncée — titres sur fond clair, aplats pleins. */
  deep: string
  /** Aplat très clair teinté — bandeaux et puces. */
  soft: string
  /** Aplat clair un cran plus soutenu — encadrés. */
  softer: string
  /** Texte lisible posé sur `accent`. */
  onAccent: string
  /** Filets et séparateurs. */
  hairline: string
  /** Fond des blocs neutres (bandeaux en mode sobre). */
  surface: string
  intensity: Intensity
  fontFamily: string
  /** Vrai si les grands aplats doivent être remplis de couleur. */
  filled: boolean

  /* Jetons pilotés par la dose : les modèles s'y branchent plutôt que de
     comparer l'identifiant, ce qui les fait suivre les sept doses sans
     condition supplémentaire. */

  /** Niveau de remplissage de la dose (0 → 3). */
  fill: 0 | 1 | 2 | 3
  /** Vrai à partir des aplats pleins — bandeaux entièrement colorés. */
  bold: boolean
  /** Couleur des aplats pleins (teinte, ou sa version foncée). */
  flat: string
  /** Texte lisible sur `flat`. */
  onFlat: string
  /** Fond des grands blocs clairs — gris quand la dose ne colore pas. */
  panel: string
  /** Variante un cran plus soutenue de `panel` — encadrés, bandeaux internes. */
  panelSoft: string
  /** Bandeaux et pastilles pleines — gris quand la dose ne colore pas. */
  band: string
  /** Texte lisible sur `band`. */
  onBand: string
}

/** Réglages minimaux nécessaires pour résoudre une palette (CV ou lettre). */
export type ThemeInput = Pick<CvSettings, 'theme' | 'accent' | 'intensity' | 'fontFamily'>

export function resolveTheme(settings: ThemeInput): ResolvedTheme {
  const base = THEME_BY_ID[settings.theme]?.accent ?? settings.accent ?? THEME_BY_ID[DEFAULT_THEME].accent
  const accent = settings.accent && settings.theme === 'perso' ? settings.accent : base
  const dose = INTENSITY_BY_ID[settings.intensity] ?? INTENSITY_BY_ID[DEFAULT_INTENSITY]
  const font = FONT_CHOICES.find((f) => f.id === settings.fontFamily) ?? FONT_CHOICES[0]

  const deep = shade(accent, 22)
  const soft = tint(accent, dose.light[0], dose.chroma)
  const softer = tint(accent, dose.light[1], dose.chroma)
  const colore = dose.fill > 0

  // Les aplats pleins prennent la teinte, ou sa version foncée pour « Profond ».
  const flat = dose.deepFlats ? deep : accent
  // Bandeaux et pastilles : gris franc sans couleur, teinte pastel pour la
  // dose « Doux », aplat plein ensuite. `readableOn` choisit l'encre.
  const band = !colore ? '#D9D9D9' : dose.softBand ? tint(accent, 80, 34) : flat

  return {
    accent,
    deep,
    soft,
    softer,
    onAccent: readableOn(accent),
    hairline: tint(accent, dose.fill >= 2 ? 76 : 82, dose.fill >= 2 ? 24 : 18),
    surface: colore ? soft : dose.neutral[0],
    intensity: dose.id,
    fontFamily: font.css,
    filled: colore,

    fill: dose.fill,
    bold: dose.fill >= 3,
    flat,
    onFlat: readableOn(flat),
    panel: colore ? soft : dose.neutral[0],
    panelSoft: colore ? softer : dose.neutral[1],
    band,
    onBand: readableOn(band),
  }
}
