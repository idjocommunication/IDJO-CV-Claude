import { Suspense } from 'react'
import type { Metadata } from 'next'
import { EditorShell } from '@/components/editor/EditorShell'
import { buildMetadata } from '@/lib/seo'

export const metadata: Metadata = {
  ...buildMetadata({
    title: 'Éditeur de CV en ligne',
    description:
      'Remplissez votre CV, visualisez le rendu A4 en direct et téléchargez votre PDF. Huit modèles professionnels, gratuit pour commencer.',
    path: '/editeur',
  }),
  robots: { index: false, follow: true },
}

export default function EditorPage() {
  return (
    <Suspense fallback={<EditorFallback />}>
      <EditorShell />
    </Suspense>
  )
}

function EditorFallback() {
  return (
    <div className="flex h-[100dvh] items-center justify-center bg-cloud">
      <p className="text-sm text-ink-muted">Chargement de l’éditeur…</p>
    </div>
  )
}
