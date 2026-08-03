import type { MetadataRoute } from 'next'

/**
 * Fichier de métadonnées : son contenu ne dépend d'aucune requête. La
 * mention ci-dessous le rend explicite, sans quoi l'export statique
 * (hébergement mutualisé) refuse de le construire.
 */
export const dynamic = 'force-static'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'IDJÔ CV — Créateur de CV professionnel',
    short_name: 'IDJÔ CV',
    description:
      "Créez un CV professionnel en 10 minutes, pensé pour la Côte d'Ivoire et l'Afrique francophone.",
    start_url: '/',
    display: 'standalone',
    background_color: '#FFFFFF',
    theme_color: '#0A0A0A',
    lang: 'fr',
    categories: ['business', 'productivity'],
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
  }
}
