import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { gunzipSync } from 'node:zlib'

/**
 * Prépare les lecteurs d'import, chargés à la demande :
 *
 * - pdf.js, recopié dans `src/lib/vendor/` pour être compilé par Next et
 *   fonctionner sur les iPhone antérieurs à iOS 16.4 (son worker passe par
 *   `src/lib/pdf-worker.ts`) ;
 * - le moteur de reconnaissance de texte (tesseract.js) et le modèle du
 *   français, copiés dans `public/ocr/`, pour lire un CV en photo ou scanné.
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
// La bibliothèque est recopiée dans `src/` : Next compile alors ce fichier
// comme le code du site et en redescend la syntaxe (blocs `static { … }`,
// méthodes privées) au niveau des navigateurs visés — ce qu'il ne fait pas
// pour la copie de `node_modules`, même listée dans `transpilePackages`.
// `next.config.mjs` y redirige les imports de `pdfjs-dist/legacy/build/pdf.mjs`.
if (
  copier(
    join(racine('pdfjs-dist'), 'legacy', 'build', 'pdf.mjs'),
    join(process.cwd(), 'src', 'lib', 'vendor', 'pdfjs-legacy.mjs'),
    'pdf.js',
  )
) {
  console.log('[pdf] bibliothèque copiée dans src/lib/vendor/')
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
