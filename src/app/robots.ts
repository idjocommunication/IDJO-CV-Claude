import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/seo'

/**
 * Fichier de métadonnées : son contenu ne dépend d'aucune requête. La
 * mention ci-dessous le rend explicite, sans quoi l'export statique
 * (hébergement mutualisé) refuse de le construire.
 */
export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/editeur', '/lettre-de-motivation'],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  }
}
