/**
 * Deux cibles de déploiement, une seule base de code.
 *
 * - `EXPORT_STATIQUE=1` : Next produit un dossier `out/` de fichiers HTML,
 *   CSS et JS, à déposer tel quel sur un hébergement mutualisé Hostinger
 *   (Apache, pas de Node). Les routes `/api` ne sont alors pas construites :
 *   `scripts/build-statique.mjs` les écarte le temps du build et le site
 *   bascule sur ses replis navigateur (voir `src/lib/deploiement.ts`).
 * - Par défaut : build serveur classique, pour un VPS. `SORTIE=standalone`
 *   ajoute `.next/standalone`, qui embarque le serveur et ses dépendances —
 *   c'est ce que déploie `deploiement/hostinger/deployer-vps.sh`.
 *
 * Les en-têtes de sécurité ne survivent pas à l'export statique : Apache les
 * pose alors lui-même, via `deploiement/hostinger/.htaccess`.
 */

const exportStatique = process.env.EXPORT_STATIQUE === '1'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    // Sans serveur Next, l'optimisation d'images à la volée n'existe plus.
    unoptimized: exportStatique,
  },
  ...(exportStatique
    ? {
        output: 'export',
        // Chaque page devient « dossier/index.html » : Apache sert alors les
        // URL propres sans règle de réécriture.
        trailingSlash: true,
      }
    : {
        ...(process.env.SORTIE === 'standalone' ? { output: 'standalone' } : {}),
        async headers() {
          return [
            {
              source: '/:path*',
              headers: [
                { key: 'X-Content-Type-Options', value: 'nosniff' },
                { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
                { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
              ],
            },
          ]
        },
      }),
}

export default nextConfig
