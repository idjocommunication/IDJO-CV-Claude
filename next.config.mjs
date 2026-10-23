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

/**
 * Politique de contenu : tout vient du domaine lui-même. Les scripts en ligne
 * sont ceux que Next injecte pour l'hydratation ; data: et blob: servent aux
 * images du CV, aux polices et au PDF. 'wasm-unsafe-eval' autorise le seul
 * WebAssembly — le moteur de reconnaissance de texte servi depuis /ocr/, qui
 * lit les CV en photo — sans rouvrir eval() au JavaScript. La redirection
 * vers la page de paiement CinetPay est une navigation : elle n'est pas
 * concernée.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' blob: data:",
  "worker-src 'self' blob:",
  "frame-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  'upgrade-insecure-requests',
].join('; ')

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
                { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
                { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
                // Mêmes règles que deploiement/hostinger/.htaccess : à garder alignées.
                { key: 'Content-Security-Policy', value: CSP },
                ...(process.env.NODE_ENV === 'production'
                  ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000' }]
                  : []),
              ],
            },
            {
              // Une réponse de paiement gardée en cache ferait croire à un
              // client qui vient de payer que son paiement n'est pas arrivé.
              source: '/api/:path*',
              headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0' }],
            },
          ]
        },
      }),
}

export default nextConfig
