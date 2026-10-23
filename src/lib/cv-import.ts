'use client'

import { cvDepuisLien } from '@/lib/cv-embarque'
import { texteDeLaPage, type FragmentTexte } from '@/lib/pdf-layout'
import type { CvData } from '@/lib/types'
import type { LetterData } from '@/lib/letter'

/**
 * Lecture d'un fichier déposé par l'utilisateur.
 *
 * Cinq entrées possibles : une sauvegarde IDJÔ CV (`.json`), un PDF, une
 * image (photo ou capture d'un CV), un document Word (`.docx`) ou du texte
 * brut. Les lecteurs lourds — pdf.js et le décompresseur zip — sont chargés à
 * la demande : ils ne pèsent rien tant que personne n'importe de fichier.
 *
 * Un PDF exporté depuis IDJÔ CV porte ses propres données (`cv-embarque.ts`) :
 * il est restauré à l'identique, sans analyse. Un PDF scanné ou une image
 * reviennent sous forme de pages dessinées, que l'appelant fait lire par l'IA
 * ou par la reconnaissance de texte du navigateur (`ocr.ts`).
 */

export type ImportedFile =
  | { kind: 'cv'; data: CvData; origine: 'json' | 'pdf' }
  | { kind: 'lettre'; data: LetterData }
  | { kind: 'texte'; text: string }
  | { kind: 'images'; pages: HTMLCanvasElement[]; origine: 'image' | 'scan' }

const EXTENSIONS_IMAGE = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp']
/** Au-delà, un « CV » est plutôt un dossier : on lit les premières pages. */
const PAGES_SCANNEES_MAX = 3
/** Côté le plus long d'une page dessinée : assez pour lire un texte de 8 pt. */
const COTE_MAX = 2400
/** Recommandation d'Anthropic : au-delà, l'image est réduite côté serveur. */
const COTE_IA = 1568

export class ImportError extends Error {}

const EXT = (name: string) => name.toLowerCase().split('.').pop() ?? ''

/**
 * Adresse du « worker » de pdf.js.
 *
 * Sur le site, il est servi depuis `public/`, en `.js` et non en `.mjs` :
 * Hostinger sert les `.mjs` en `text/plain`, et le navigateur refuse alors de
 * lancer le worker — l'import de tout PDF échouait. Dans la page autonome, il n'y a
 * pas de serveur : son code est embarqué dans le paquet et transformé en URL
 * de blob au premier usage. Sans cela, l'import de PDF ne marcherait que sur
 * le site déployé.
 */
let adresseWorker: string | null = null

function sourceWorker() {
  if (adresseWorker) return adresseWorker

  const embarque = (globalThis as { __IDJO_PDF_WORKER__?: string }).__IDJO_PDF_WORKER__
  adresseWorker = embarque
    ? URL.createObjectURL(new Blob([embarque], { type: 'text/javascript' }))
    : '/pdf.worker.min.js'

  return adresseWorker
}

/**
 * Version « legacy » de pdf.js : la version courante s'appuie sur des
 * fonctions JavaScript toutes récentes (`Map.getOrInsertComputed`…) que bien
 * des téléphones Android en circulation n'ont pas encore. Celle-ci les
 * complète elle-même.
 */
type DocumentPdf = Awaited<
  ReturnType<typeof import('pdfjs-dist/legacy/build/pdf.mjs').getDocument>['promise']
>

async function ouvrirPdf(file: File) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  pdfjs.GlobalWorkerOptions.workerSrc = sourceWorker()

  const buffer = await file.arrayBuffer()
  return pdfjs.getDocument({
    data: new Uint8Array(buffer),
    // Le rendu des polices ne nous intéresse pas : seul le texte compte, et
    // un scan se dessine sans elles.
    disableFontFace: true,
  }).promise
}

/** Données embarquées par IDJÔ CV : un lien invisible sur la première page. */
async function cvEmbarque(document: DocumentPdf) {
  const page = await document.getPage(1)
  const annotations = (await page.getAnnotations()) as { url?: string }[]
  for (const annotation of annotations) {
    const cv = annotation.url ? cvDepuisLien(annotation.url) : null
    if (cv) return cv
  }
  return null
}

/** Texte d'un PDF, page après page, dans l'ordre de lecture. */
async function textePdf(document: DocumentPdf) {
  const pages: string[] = []

  for (let numero = 1; numero <= document.numPages; numero += 1) {
    const page = await document.getPage(numero)
    const contenu = await page.getTextContent()
    const largeur = page.getViewport({ scale: 1 }).width

    const fragments: FragmentTexte[] = []
    for (const item of contenu.items) {
      if (!('str' in item)) continue
      fragments.push({
        str: item.str,
        x: item.transform[4],
        y: item.transform[5],
        width: item.width,
        height: item.height || Math.abs(item.transform[3]) || 10,
      })
    }

    const texte = texteDeLaPage(fragments, largeur)
    if (texte) pages.push(texte)
    page.cleanup()
  }

  return pages.join('\n')
}

/** Pages d'un PDF scanné, dessinées pour être lues comme des images. */
async function dessinerPdf(document: DocumentPdf) {
  const pages: HTMLCanvasElement[] = []
  const total = Math.min(document.numPages, PAGES_SCANNEES_MAX)

  for (let numero = 1; numero <= total; numero += 1) {
    const page = await document.getPage(numero)
    const base = page.getViewport({ scale: 1 })
    const echelle = Math.min(3, COTE_MAX / Math.max(base.width, base.height))
    const viewport = page.getViewport({ scale: echelle })

    const toile = window.document.createElement('canvas')
    toile.width = Math.round(viewport.width)
    toile.height = Math.round(viewport.height)
    await page.render({ canvas: toile, viewport }).promise
    pages.push(toile)
    page.cleanup()
  }

  return pages
}

/** Dessine une image sur une toile, réduite si elle dépasse `COTE_MAX`. */
async function dessinerImage(file: File) {
  let image: ImageBitmap
  try {
    image = await createImageBitmap(file)
  } catch {
    throw new ImportError(
      'Cette image ne peut pas être ouverte par votre navigateur. Enregistrez-la en JPEG ou en PNG (une capture d’écran convient), puis réessayez.',
    )
  }

  const echelle = Math.min(1, COTE_MAX / Math.max(image.width, image.height))
  const toile = document.createElement('canvas')
  toile.width = Math.round(image.width * echelle)
  toile.height = Math.round(image.height * echelle)
  const ctx = toile.getContext('2d')
  if (!ctx) throw new ImportError('Votre navigateur ne permet pas de lire cette image.')
  // Fond blanc : une image transparente deviendrait noire en JPEG.
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, toile.width, toile.height)
  ctx.drawImage(image, 0, 0, toile.width, toile.height)
  image.close()
  return toile
}

/**
 * Pages prêtes à être envoyées à l'IA : JPEG en base64, sans le préfixe
 * `data:`, réduites à la taille que le modèle lit sans perte.
 */
export function pagesPourIa(pages: HTMLCanvasElement[]) {
  return pages.map((page) => {
    const echelle = Math.min(1, COTE_IA / Math.max(page.width, page.height))
    const toile = document.createElement('canvas')
    toile.width = Math.round(page.width * echelle)
    toile.height = Math.round(page.height * echelle)
    const ctx = toile.getContext('2d')
    ctx?.drawImage(page, 0, 0, toile.width, toile.height)
    return toile.toDataURL('image/jpeg', 0.85).replace(/^data:image\/jpeg;base64,/, '')
  })
}

/** Texte d'un .docx : le document est un zip contenant du XML. */
async function readDocx(file: File) {
  const { unzipSync, strFromU8 } = await import('fflate')
  const buffer = new Uint8Array(await file.arrayBuffer())
  const archive = unzipSync(buffer, { filter: (f) => f.name === 'word/document.xml' })
  const xml = archive['word/document.xml']
  if (!xml) throw new ImportError('Ce fichier Word ne contient pas de texte lisible.')

  return strFromU8(xml)
    .replace(/<w:p[ >]/g, '\n<w:p ')
    .replace(/<w:br\s*\/>/g, '\n')
    .replace(/<w:tab\s*\/>/g, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, '’')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Lit le fichier et renvoie soit une sauvegarde, soit du texte à analyser. */
export async function readImportedFile(file: File): Promise<ImportedFile> {
  const extension = EXT(file.name)

  if (file.size > 12_000_000) {
    throw new ImportError('Fichier trop lourd : 12 Mo au maximum.')
  }

  if (extension === 'json' || file.type === 'application/json') {
    const parsed = JSON.parse(await file.text()) as Partial<CvData> & Partial<LetterData>
    if (parsed.profile && parsed.settings) return { kind: 'cv', data: parsed as CvData, origine: 'json' }
    if (typeof parsed.closing === 'string' || typeof parsed.hook === 'string') {
      return { kind: 'lettre', data: parsed as LetterData }
    }
    throw new ImportError('Ce fichier .json n’est pas une sauvegarde IDJÔ CV.')
  }

  if (extension === 'pdf' || file.type === 'application/pdf') {
    let document: DocumentPdf
    let text = ''
    try {
      document = await ouvrirPdf(file)
      const cv = await cvEmbarque(document).catch(() => null)
      if (cv) {
        await document.cleanup()
        return { kind: 'cv', data: cv, origine: 'pdf' }
      }
      text = await textePdf(document)
    } catch (error) {
      const nom = (error as { name?: string })?.name ?? ''
      if (nom === 'PasswordException') {
        throw new ImportError(
          'Ce PDF est protégé par un mot de passe. Ouvrez-le, enregistrez-en une copie sans protection, puis réessayez.',
        )
      }
      if (nom === 'InvalidPDFException') {
        throw new ImportError('Ce fichier PDF est endommagé et ne peut pas être ouvert.')
      }
      throw new ImportError(
        'La lecture de ce PDF a échoué. Copiez le texte de votre CV et collez-le ci-dessous.',
      )
    }

    if (text.trim().length >= 40) {
      await document.cleanup()
      return { kind: 'texte', text }
    }

    // Pas de texte sélectionnable : c'est un scan ou une photo enregistrée en
    // PDF. On dessine les pages pour les lire comme des images.
    try {
      return { kind: 'images', pages: await dessinerPdf(document), origine: 'scan' }
    } catch (error) {
      console.warn('[import] PDF scanné impossible à dessiner', error)
      throw new ImportError(
        'Ce PDF ne contient que des images et n’a pas pu être dessiné. Faites une capture d’écran de votre CV et importez-la, ou collez son texte ci-dessous.',
      )
    } finally {
      await document.cleanup()
    }
  }

  const heic = ['heic', 'heif'].includes(extension) || /heic|heif/.test(file.type)
  if (heic || EXTENSIONS_IMAGE.includes(extension) || file.type.startsWith('image/')) {
    if (heic) {
      throw new ImportError(
        'Les photos HEIC de l’iPhone ne sont pas lisibles ici. Faites une capture d’écran de la photo, ou réglez l’appareil photo sur « Le plus compatible », puis réessayez.',
      )
    }
    return { kind: 'images', pages: [await dessinerImage(file)], origine: 'image' }
  }

  if (extension === 'docx') {
    return { kind: 'texte', text: await readDocx(file) }
  }

  if (extension === 'doc') {
    throw new ImportError(
      'Les anciens fichiers .doc ne sont pas lisibles. Enregistrez votre CV en .docx ou en PDF, ou collez son texte ci-dessous.',
    )
  }

  if (['txt', 'md', 'csv', 'rtf'].includes(extension) || file.type.startsWith('text/')) {
    return { kind: 'texte', text: await file.text() }
  }

  throw new ImportError(
    'Format non reconnu. Formats acceptés : PDF, image (JPEG, PNG), Word (.docx), texte, .json.',
  )
}
