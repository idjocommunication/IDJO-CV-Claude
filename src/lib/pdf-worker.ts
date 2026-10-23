/**
 * Point d'entrée du « worker » de pdf.js, chargé par `cv-import.ts` avec
 * `new Worker(new URL('./pdf-worker.ts', import.meta.url))`.
 *
 * Le worker est compilé par Next.js comme le reste du site, au lieu d'être
 * copié tel quel depuis `node_modules` : même la version « legacy » de pdf.js
 * contient des blocs `static { … }`, que Safari ne comprend que depuis
 * iOS 16.4. Sur un iPhone moins à jour, le worker copié ne démarrait pas et
 * tout import de PDF échouait. Compilé (voir `transpilePackages` dans
 * `next.config.mjs`), il redescend au niveau des navigateurs visés par Next.
 *
 * Charger ce module dans un worker suffit : la classe `WorkerMessageHandler`
 * se branche d'elle-même sur les messages de la page.
 */
import { WorkerMessageHandler } from 'pdfjs-dist/legacy/build/pdf.worker.mjs'

// Référence explicite : l'import ne doit pas être écarté comme inutilisé.
;(globalThis as { pdfjsWorker?: unknown }).pdfjsWorker = { WorkerMessageHandler }
