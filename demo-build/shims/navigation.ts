/** Remplace next/navigation dans la démo autonome. */
export function useSearchParams() {
  return new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search)
}

export function usePathname() {
  return '/demo'
}

export function notFound(): never {
  throw new Error('notFound')
}
