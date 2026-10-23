import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { gunzipSync } from 'node:zlib'

/**
 * Copie dans `public/` les fichiers que les lecteurs d'import chargent à la
 * demande, uniquement quand l'utilisateur importe un document :
 *
 * - le « worker » de pdf.js, version « legacy » comme la bibliothèque (voir
 *   `cv-import.ts`), pour lire les PDF ;
 * - le moteur de reconnaissance de texte (tesseract.js) et le modèle du
 *   français, pour lire un CV en photo ou un PDF scanné.
 *
 * Leur version doit rester identique à celle des bibliothèques installées :
 * d'où la copie automatique plutôt que des fichiers figés dans le dépôt. Ils
 * sont servis par le site lui-même — la politique de sécurité interdit tout
 * script venu d'un autre domaine, CDN compris.
 */
const require = createRequire(import.meta.url)
const racine = (paquet) => dirname(require.resolve(`${paquet}/package.json`))
const publicDir = join(process.cwd(), 'public')

function copier(source, destination, libelle) {
  if (!existsSync(source)) {
    console.warn(`[import] ${libelle} introuvable : ${source}`)
    return false
  }
  mkdirSync(dirname(destination), { recursive: true })
  copyFileSync(source, destination)
  return true
}

/* -- pdf.js ---------------------------------------------------------------- */
if (
  copier(
    join(racine('pdfjs-dist'), 'legacy', 'build', 'pdf.worker.min.mjs'),
    // Publié en `.js` : certains hébergeurs servent les `.mjs` en text/plain,
    // que le navigateur refuse d'exécuter comme module.
    join(publicDir, 'pdf.worker.min.js'),
    'worker pdf.js',
  )
) {
  console.log('[pdf] worker copié dans public/')
}

/* -- Reconnaissance de texte ----------------------------------------------- */
const ocrDir = join(publicDir, 'ocr')
let ocrComplet = copier(
  join(racine('tesseract.js'), 'dist', 'worker.min.js'),
  join(ocrDir, 'worker.min.js'),
  'worker tesseract.js',
)

// Seuls les moteurs « LSTM » servent (mode OEM.LSTM_ONLY) ; le worker choisit
// lui-même la variante adaptée au processeur du visiteur.
for (const variante of ['lstm', 'simd-lstm', 'relaxedsimd-lstm']) {
  const fichier = `tesseract-core-${variante}.wasm.js`
  ocrComplet = copier(join(racine('tesseract.js-core'), fichier), join(ocrDir, fichier), fichier) && ocrComplet
}

// Le modèle est livré décompressé : certains hébergements servent les « .gz »
// avec un en-tête de compression, le navigateur le décompresse alors en
// silence et la bibliothèque échoue en le décompressant une seconde fois.
const modele = join(racine('@tesseract.js-data/fra'), '4.0.0_best_int', 'fra.traineddata.gz')
if (existsSync(modele)) {
  mkdirSync(ocrDir, { recursive: true })
  writeFileSync(join(ocrDir, 'fra.traineddata'), gunzipSync(readFileSync(modele)))
} else {
  console.warn('[import] modèle français de reconnaissance de texte introuvable.')
  ocrComplet = false
}

console.log(
  ocrComplet
    ? '[ocr] moteur et modèle français copiés dans public/ocr/'
    : '[ocr] incomplet : la lecture des images sera indisponible.',
)
