'use client'

import { texteDeLaPage, type FragmentTexte } from '@/lib/pdf-layout'
import type { CvData } from '@/lib/types'
import type { LetterData } from '@/lib/letter'

/**
 * Lecture d'un fichier déposé par l'utilisateur.
 *
 * Quatre entrées possibles : une sauvegarde IDJÔ CV (`.json`), un PDF, un
 * document Word (`.docx`) ou du texte brut. Les deux lecteurs lourds — pdf.js
 * et le décompresseur zip — sont chargés à la demande : ils ne pèsent rien
 * tant que personne n'importe de fichier.
 */

export type ImportedFile =
  | { kind: 'cv'; data: CvData }
  | { kind: 'lettre'; data: LetterData }
  | { kind: 'texte'; text: string }

export class ImportError extends Error {}

const EXT = (name: string) => name.toLowerCase().split('.').pop() ?? ''

/**
 * Adresse du « worker » de pdf.js.
 *
 * Sur le site, il est servi depuis `public/`. Dans la page autonome, il n'y a
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
    : '/pdf.worker.min.mjs'

  return adresseWorker
}

/** Texte d'un PDF, page après page, dans l'ordre de lecture. */
async function readPdf(file: File) {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = sourceWorker()

  const buffer = await file.arrayBuffer()
  const document = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    // Le rendu ne nous intéresse pas : seul le texte compte.
    disableFontFace: true,
  }).promise
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

  await document.cleanup()
  return pages.join('\n')
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
    if (parsed.profile && parsed.settings) return { kind: 'cv', data: parsed as CvData }
    if (typeof parsed.closing === 'string' || typeof parsed.hook === 'string') {
      return { kind: 'lettre', data: parsed as LetterData }
    }
    throw new ImportError('Ce fichier .json n’est pas une sauvegarde IDJÔ CV.')
  }

  if (extension === 'pdf' || file.type === 'application/pdf') {
    let text = ''
    try {
      text = await readPdf(file)
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

    if (text.trim().length < 40) {
      throw new ImportError(
        'Ce PDF ne contient pas de texte sélectionnable : c’est une image, probablement un CV scanné ou photographié. Recopiez son texte ci-dessous, ou repartez d’un fichier Word.',
      )
    }
    return { kind: 'texte', text }
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

  throw new ImportError('Format non reconnu. Formats acceptés : PDF, Word (.docx), texte, .json.')
}
