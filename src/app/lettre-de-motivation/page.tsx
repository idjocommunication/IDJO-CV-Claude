import type { Metadata } from 'next'
import { LetterEditor } from '@/components/letter/LetterEditor'
import { buildMetadata } from '@/lib/seo'

export const metadata: Metadata = {
  ...buildMetadata({
    title: 'Lettre de motivation',
    description:
      'Rédigez une lettre de motivation en trois paragraphes guidés, assortie à votre CV, et téléchargez-la en PDF.',
    path: '/lettre-de-motivation',
  }),
  robots: { index: false, follow: true },
}

export default function LetterPage() {
  return <LetterEditor />
}
