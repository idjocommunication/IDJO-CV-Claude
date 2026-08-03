import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

/**
 * Copie le « worker » de pdf.js dans `public/`. Il est chargé à la demande,
 * uniquement quand l'utilisateur importe un PDF, et sa version doit rester
 * identique à celle de la bibliothèque installée : d'où la copie automatique
 * plutôt qu'un fichier figé dans le dépôt.
 */
const require = createRequire(import.meta.url)
const source = join(dirname(require.resolve('pdfjs-dist/package.json')), 'build', 'pdf.worker.min.mjs')
const destination = join(process.cwd(), 'public', 'pdf.worker.min.mjs')

if (!existsSync(source)) {
  console.warn('[pdf] worker introuvable : import de PDF indisponible.')
  process.exit(0)
}

mkdirSync(dirname(destination), { recursive: true })
copyFileSync(source, destination)
console.log('[pdf] worker copié dans public/')
