'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { EMPTY_CV, SAMPLE_CV } from '@/data/sample-cv'
import type {
  Award,
  CvData,
  CvSettings,
  Education,
  Experience,
  Language,
  Profile,
  Reference,
  Skill,
} from '@/lib/types'
import { uid } from '@/lib/utils'

type ListKey = 'experiences' | 'educations' | 'skills' | 'languages' | 'awards' | 'references'

type ItemOf<K extends ListKey> = CvData[K][number]

interface CvStore {
  data: CvData
  lastSavedAt: number | null

  setProfile: (patch: Partial<Profile>) => void
  setSettings: (patch: Partial<CvSettings>) => void
  setHobbies: (hobbies: string[]) => void

  addItem: <K extends ListKey>(key: K) => void
  updateItem: <K extends ListKey>(key: K, id: string, patch: Partial<ItemOf<K>>) => void
  removeItem: (key: ListKey, id: string) => void
  moveItem: (key: ListKey, id: string, direction: -1 | 1) => void

  loadSample: () => void
  reset: () => void
  replace: (data: CvData) => void
}

const BLANKS: { [K in ListKey]: () => CvData[K][number] } = {
  experiences: (): Experience => ({
    id: uid('exp'),
    role: '',
    company: '',
    location: '',
    start: '',
    end: '',
    current: false,
    description: '',
  }),
  educations: (): Education => ({
    id: uid('edu'),
    degree: '',
    school: '',
    location: '',
    start: '',
    end: '',
    description: '',
  }),
  skills: (): Skill => ({ id: uid('sk'), name: '', level: 70 }),
  languages: (): Language => ({ id: uid('lg'), name: '', level: 70 }),
  awards: (): Award => ({
    id: uid('aw'),
    title: '',
    organization: '',
    period: '',
    description: '',
  }),
  references: (): Reference => ({
    id: uid('rf'),
    name: '',
    role: '',
    company: '',
    contact: '',
  }),
}

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T

export const useCvStore = create<CvStore>()(
  persist(
    (set) => ({
      data: clone(EMPTY_CV),
      lastSavedAt: null,

      setProfile: (patch) =>
        set((state) => ({
          data: { ...state.data, profile: { ...state.data.profile, ...patch } },
          lastSavedAt: Date.now(),
        })),

      setSettings: (patch) =>
        set((state) => ({
          data: { ...state.data, settings: { ...state.data.settings, ...patch } },
          lastSavedAt: Date.now(),
        })),

      setHobbies: (hobbies) =>
        set((state) => ({ data: { ...state.data, hobbies }, lastSavedAt: Date.now() })),

      addItem: (key) =>
        set((state) => ({
          data: {
            ...state.data,
            [key]: [...state.data[key], BLANKS[key]()],
          } as CvData,
          lastSavedAt: Date.now(),
        })),

      updateItem: (key, id, patch) =>
        set((state) => ({
          data: {
            ...state.data,
            [key]: (state.data[key] as { id: string }[]).map((item) =>
              item.id === id ? { ...item, ...patch } : item,
            ),
          } as CvData,
          lastSavedAt: Date.now(),
        })),

      removeItem: (key, id) =>
        set((state) => ({
          data: {
            ...state.data,
            [key]: (state.data[key] as { id: string }[]).filter((item) => item.id !== id),
          } as CvData,
          lastSavedAt: Date.now(),
        })),

      moveItem: (key, id, direction) =>
        set((state) => {
          const list = [...(state.data[key] as { id: string }[])]
          const index = list.findIndex((item) => item.id === id)
          const target = index + direction
          if (index < 0 || target < 0 || target >= list.length) return state
          ;[list[index], list[target]] = [list[target], list[index]]
          return {
            data: { ...state.data, [key]: list } as CvData,
            lastSavedAt: Date.now(),
          }
        }),

      loadSample: () =>
        set((state) => ({
          data: {
            ...clone(SAMPLE_CV),
            settings: { ...clone(SAMPLE_CV).settings, ...state.data.settings },
          },
          lastSavedAt: Date.now(),
        })),

      reset: () =>
        set((state) => ({
          data: { ...clone(EMPTY_CV), settings: state.data.settings },
          lastSavedAt: Date.now(),
        })),

      replace: (data) => set({ data, lastSavedAt: Date.now() }),
    }),
    {
      name: 'idjo-cv:document',
      version: 2,
      // Les CV enregistrés avant l'arrivée des couleurs reçoivent les
      // nouveaux réglages de design sans perdre leur contenu.
      migrate: (persisted, version) => {
        const state = persisted as { data?: CvData } | undefined
        if (!state?.data) return state as never
        if (version < 2) {
          state.data.settings = {
            ...state.data.settings,
            theme: 'encre',
            intensity: 'sobre',
            fontFamily: 'sans',
          }
        }
        return state as never
      },
      partialize: (state) => ({ data: state.data, lastSavedAt: state.lastSavedAt }),
    },
  ),
)
