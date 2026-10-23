'use client'

/**
 * Reconnaissance de texte dans le navigateur, pour un CV en photo ou un PDF
 * scanné, quand l'analyse par IA n'est pas disponible ou que l'utilisateur la
 * refuse.
 *
 * Tout se passe sur l'appareil : l'image ne quitte pas le navigateur. Le
 * moteur (tesseract.js, environ 4 Mo) et le modèle du français (1,2 Mo) sont
 * servis par le site depuis `public/ocr/` et chargés au premier usage
 * seulement ; le navigateur les garde ensuite en cache.
 */

/** Une image plus étroite se lit mal ; plus large, elle ralentit sans gain. */
const LARGEUR_IDEALE = 2000

function agrandirSiPetit(source: HTMLCanvasElement) {
  if (source.width >= LARGEUR_IDEALE * 0.7) return source
  const echelle = Math.min(3, LARGEUR_IDEALE / source.width)
  const toile = document.createElement('canvas')
  toile.width = Math.round(source.width * echelle)
  toile.height = Math.round(source.height * echelle)
  const ctx = toile.getContext('2d')
  if (!ctx) return source
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(source, 0, 0, toile.width, toile.height)
  return toile
}

/**
 * Texte de chaque page, dans l'ordre. `progression` reçoit une valeur entre
 * 0 et 1, chargement du moteur compris.
 */
export async function reconnaitreTexte(
  pages: HTMLCanvasElement[],
  progression?: (part: number) => void,
) {
  const { createWorker, OEM } = await import('tesseract.js')
  const origine = window.location.origin
  let pageCourante = 0

  const worker = await createWorker('fra', OEM.LSTM_ONLY, {
    workerPath: `${origine}/ocr/worker.min.js`,
    corePath: `${origine}/ocr`,
    langPath: `${origine}/ocr`,
    gzip: false,
    workerBlobURL: false,
    logger: (message) => {
      if (message.status === 'recognizing text') {
        progression?.((pageCourante + message.progress) / pages.length)
      }
    },
  })

  try {
    const textes: string[] = []
    for (const page of pages) {
      const { data } = await worker.recognize(agrandirSiPetit(page))
      textes.push(data.text)
      pageCourante += 1
    }
    return textes.join('\n')
  } finally {
    await worker.terminate()
  }
}
