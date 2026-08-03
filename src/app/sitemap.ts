import type { MetadataRoute } from 'next'
import { ARTICLES } from '@/data/articles'
import { EXAMPLES } from '@/data/examples'
import { TEMPLATES } from '@/data/templates'
import { SITE } from '@/lib/seo'

/**
 * Fichier de métadonnées : son contenu ne dépend d'aucune requête. La
 * mention ci-dessous le rend explicite, sans quoi l'export statique
 * (hébergement mutualisé) refuse de le construire.
 */
export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticRoutes = [
    { path: '/', priority: 1, changeFrequency: 'weekly' as const },
    { path: '/modeles', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/tarifs', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/exemples', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/conseils', priority: 0.7, changeFrequency: 'weekly' as const },
    { path: '/contact', priority: 0.5, changeFrequency: 'yearly' as const },
    { path: '/legal/mentions-legales', priority: 0.2, changeFrequency: 'yearly' as const },
    { path: '/legal/confidentialite', priority: 0.2, changeFrequency: 'yearly' as const },
    { path: '/legal/cgu', priority: 0.2, changeFrequency: 'yearly' as const },
  ]

  return [
    ...staticRoutes.map((route) => ({
      url: `${SITE.url}${route.path}`,
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...TEMPLATES.map((template) => ({
      url: `${SITE.url}/modeles/${template.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...EXAMPLES.map((example) => ({
      url: `${SITE.url}/exemples/${example.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...ARTICLES.map((article) => ({
      url: `${SITE.url}/conseils/${article.slug}`,
      lastModified: new Date(article.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ]
}
