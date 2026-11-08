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
    theme_color: '#04122B',
    lang: 'fr',
    categories: ['business', 'productivity'],
    // Le « ô » du logo, blanc sur bleu nuit. Les PNG servent aux écrans
    // d'accueil qui ne lisent pas le SVG ; la version « maskable » garde le
    // signe dans la zone que les lanceurs Android ne rognent jamais.
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
