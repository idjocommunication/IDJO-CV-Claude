'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_THEME, THEME_BY_ID, type FontChoice, type ThemeInput } from '@/lib/theme'

/**
 * Lettre de motivation — document distinct du CV, mais habillé par les mêmes
 * palettes : le candidat envoie deux pages assorties.
 */
export interface LetterData {
  senderName: string
  senderTitle: string
  senderPhone: string
  senderEmail: string
  senderCity: string

  companyName: string
  recipientName: string
  companyAddress: string

  subject: string
  reference: string
  city: string
  date: string

  greeting: string
  hook: string
  proof: string
  projection: string
  closing: string

  /** Identifiant de palette partagé avec le CV (voir `src/lib/theme.ts`). */
  theme: string
  /** Teinte personnalisée, utilisée quand `theme` vaut « perso ». */
  accent: string
  fontFamily: FontChoice
  fontScale: number
}

/** Réglages de palette de la lettre, au format attendu par `resolveTheme`. */
export function letterTheme(data: LetterData): ThemeInput {
  return {
    theme: data.theme,
    accent: data.accent,
    intensity: 'colore',
    fontFamily: data.fontFamily,
  }
}

export const EMPTY_LETTER: LetterData = {
  senderName: '',
  senderTitle: '',
  senderPhone: '',
  senderEmail: '',
  senderCity: '',
  companyName: '',
  recipientName: '',
  companyAddress: '',
  subject: '',
  reference: '',
  city: 'Abidjan',
  date: '',
  greeting: 'Madame, Monsieur,',
  hook: '',
  proof: '',
  projection: '',
  closing:
    'Je me tiens à votre disposition pour un entretien et vous prie d’agréer, Madame, Monsieur, l’expression de mes salutations distinguées.',
  theme: DEFAULT_THEME,
  accent: THEME_BY_ID[DEFAULT_THEME].accent,
  fontFamily: 'sans',
  fontScale: 1,
}

export const SAMPLE_LETTER: LetterData = {
  senderName: 'Aïcha Konaté',
  senderTitle: 'Responsable Marketing Digital',
  senderPhone: '+225 07 07 12 34 56',
  senderEmail: 'aicha.konate@email.ci',
  senderCity: 'Cocody, Abidjan',
  companyName: 'Groupe Sifca',
  recipientName: 'À l’attention du service Ressources Humaines',
  companyAddress: 'Plateau, Abidjan',
  subject: 'Candidature au poste de Responsable Marketing Digital',
  reference: 'Offre publiée sur Emploi.ci le 12 janvier',
  city: 'Abidjan',
  date: '',
  greeting: 'Madame, Monsieur,',
  hook: "Votre annonce pour le poste de Responsable Marketing Digital a retenu toute mon attention : elle décrit précisément le travail que je mène depuis huit ans à Abidjan, entre acquisition digitale et campagnes de grande audience.",
  proof:
    "Chez Ivoire Telecom, je pilote un budget annuel de 120 millions de FCFA et une équipe de six personnes ; nous avons fait progresser de 42 % les inscriptions à l’offre mobile en dix-huit mois. Auparavant, chez Baobab, j’ai géré douze comptes clients et organisé plus de vingt activations terrain à Abidjan et Bouaké.",
  projection:
    "Rejoindre votre équipe me permettrait de mettre cette expérience au service de vos marques, en structurant dès les premiers mois le suivi de performance et la montée en puissance de vos canaux digitaux.",
  closing:
    'Je me tiens à votre disposition pour un entretien et vous prie d’agréer, Madame, Monsieur, l’expression de mes salutations distinguées.',
  theme: DEFAULT_THEME,
  accent: THEME_BY_ID[DEFAULT_THEME].accent,
  fontFamily: 'sans',
  fontScale: 1,
}

interface LetterStore {
  data: LetterData
  set: (patch: Partial<LetterData>) => void
  /** Remplace toute la lettre — utilisé par l'import de sauvegarde. */
  replace: (data: LetterData) => void
  loadSample: () => void
  reset: () => void
}

export const useLetterStore = create<LetterStore>()(
  persist(
    (set) => ({
      data: { ...EMPTY_LETTER },
      set: (patch) => set((state) => ({ data: { ...state.data, ...patch } })),
      // Les champs absents du fichier importé reprennent les valeurs par défaut.
      replace: (data) => set({ data: { ...EMPTY_LETTER, ...data } }),
      loadSample: () => set({ data: { ...SAMPLE_LETTER } }),
      reset: () => set({ data: { ...EMPTY_LETTER } }),
    }),
    {
      name: 'idjo-cv:lettre',
      version: 2,
      // Les lettres écrites avant l'arrivée des palettes reçoivent la charte
      // par défaut sans perdre leur texte.
      migrate: (persisted, version) => {
        const state = persisted as { data?: LetterData } | undefined
        if (!state?.data) return state as never
        if (version < 2) {
          state.data = {
            ...state.data,
            theme: DEFAULT_THEME,
            accent: THEME_BY_ID[DEFAULT_THEME].accent,
            fontFamily: 'sans',
          }
        }
        return state as never
      },
    },
  ),
)

/** « 15 janvier 2026 » */
export function formatFrenchDate(date = new Date()) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}
