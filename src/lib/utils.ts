import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

export function initials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

/** « 2020 » + « 2024 » → « 2020 - 2024 », gère le poste en cours. */
export function periodLabel(start: string, end: string, current?: boolean) {
  const to = current ? 'Aujourd’hui' : end
  if (!start && !to) return ''
  if (!start) return to
  if (!to) return start
  return `${start} - ${to}`
}

export function fullName(firstName: string, lastName: string) {
  return [firstName, lastName].filter(Boolean).join(' ')
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

/** Prix en FCFA : 500 F CFA */
export function formatFcfa(amount: number) {
  return `${new Intl.NumberFormat('fr-FR').format(amount).replace(/\s/g, ' ')} F CFA`
}

export function slugify(input: string) {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Découpe un texte multi-lignes en puces exploitables par les modèles. */
export function toBullets(text: string) {
  return text
    .split('\n')
    .map((line) => line.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean)
}
