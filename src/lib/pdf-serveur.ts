import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

/**
 * Fabrication du PDF côté serveur.
 *
 * Le document envoyé par e-mail doit être identique à celui que l'utilisateur
 * voit à l'écran : on ne le redessine pas, on imprime la page HTML autonome
 * construite par le navigateur (`buildStandaloneHtml`). Deux moteurs sont
 * possibles, dans cet ordre :
 *
 * 1. un service HTTP de conversion (`PDF_API_URL`) — la voie recommandée en
 *    hébergement sans serveur, où l'on ne peut pas lancer de navigateur ;
 * 2. un Chromium local (`CHROMIUM_PATH` ou l'un des chemins usuels), appelé en
 *    ligne de commande avec `--print-to-pdf`. Aucune dépendance npm.
 *
 * Si aucun des deux n'est disponible, la conversion échoue franchement : le
 * site continue de fonctionner, l'envoi par e-mail se dit simplement inactif.
 */

export class PdfIndisponible extends Error {}

const CHEMINS_CHROMIUM = [
  process.env.CHROMIUM_PATH,
  '/opt/pw-browsers/chromium',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/snap/bin/chromium',
]

function chromium() {
  return CHEMINS_CHROMIUM.find((chemin) => chemin && existsSync(chemin)) ?? null
}

/** Le site sait-il fabriquer un PDF ? */
export function pdfConfigure() {
  return Boolean(process.env.PDF_API_URL) || Boolean(chromium())
}

/**
 * Le HTML vient du navigateur de l'utilisateur : on le nettoie avant de le
 * confier à un moteur de rendu. Les scripts sont de toute façon désactivés
 * dans Chromium, mais un service tiers n'offre pas forcément la même garantie.
 */
function nettoyer(html: string) {
  return html
    .replace(/<script\b[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<(iframe|object|embed)\b[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '')
}

/* ------------------------------------------------------------------ */
/* Service HTTP de conversion                                          */
/* ------------------------------------------------------------------ */

/**
 * Deux dialectes couvrent l'essentiel du marché : Browserless (et ses clones
 * auto-hébergés) et PDFShift. `PDF_API_FORMAT` tranche.
 */
async function parService(html: string) {
  const url = process.env.PDF_API_URL
  if (!url) return null

  const cle = process.env.PDF_API_KEY ?? ''
  const format = (process.env.PDF_API_FORMAT ?? 'browserless').toLowerCase()
  const entetes: Record<string, string> = { 'Content-Type': 'application/json' }
  let cible = url
  let corps: string

  if (format === 'pdfshift') {
    entetes.Authorization = `Basic ${Buffer.from(`api:${cle}`).toString('base64')}`
    corps = JSON.stringify({ source: html, format: 'A4', margin: '0', use_print: true })
  } else {
    if (cle) {
      // Browserless accepte le jeton en paramètre ; les clones préfèrent l'en-tête.
      cible = url.includes('token=') ? url : `${url}${url.includes('?') ? '&' : '?'}token=${encodeURIComponent(cle)}`
      entetes.Authorization = `Bearer ${cle}`
    }
    corps = JSON.stringify({
      html,
      options: {
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
      },
    })
  }

  const reponse = await fetch(cible, { method: 'POST', headers: entetes, body: corps })
  if (!reponse.ok) {
    throw new PdfIndisponible(
      `Le service de conversion a refusé le document (${reponse.status} ${await reponse
        .text()
        .then((t) => t.slice(0, 200))
        .catch(() => '')})`,
    )
  }

  return new Uint8Array(await reponse.arrayBuffer())
}

/* ------------------------------------------------------------------ */
/* Chromium local                                                      */
/* ------------------------------------------------------------------ */

function lancer(binaire: string, arguments_: string[], delai: number) {
  return new Promise<string>((resoudre, rejeter) => {
    const processus = execFile(
      binaire,
      arguments_,
      { timeout: delai, maxBuffer: 4_000_000 },
      (erreur, _sortie, journal) => {
        // Chrome sort parfois en code non nul après avoir écrit le PDF ; c'est
        // l'existence du fichier qui tranche, pas le code de sortie.
        if (erreur && (erreur as { killed?: boolean }).killed) {
          rejeter(new PdfIndisponible('La conversion en PDF a dépassé le temps imparti.'))
          return
        }
        resoudre(journal ?? '')
      },
    )
    processus.on('error', () => rejeter(new PdfIndisponible('Chromium n’a pas pu être lancé.')))
  })
}

async function parChromium(html: string) {
  const binaire = chromium()
  if (!binaire) return null

  const dossier = await mkdtemp(join(tmpdir(), 'idjo-pdf-'))
  const entree = join(dossier, 'document.html')
  const sortie = join(dossier, 'document.pdf')

  try {
    await writeFile(entree, html, 'utf8')
    const journal = await lancer(
      binaire,
      [
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        '--disable-dev-shm-usage',
        // Le document est du contenu utilisateur : aucun script n'y est exécuté.
        // (`--blink-settings=scriptEnabled=false` empêcherait l'impression
        // elle-même : c'est bien `--disable-javascript` qu'il faut ici.)
        '--disable-javascript',
        '--hide-scrollbars',
        '--no-pdf-header-footer',
        '--print-to-pdf-no-header',
        // Laisse le temps aux polices d'arriver sans attendre une éternité.
        '--virtual-time-budget=8000',
        `--print-to-pdf=${sortie}`,
        `file://${entree}`,
      ],
      45_000,
    )

    if (!existsSync(sortie)) {
      const detail = journal
        .split('\n')
        .filter((ligne) => ligne.includes('ERROR') && !ligne.includes('dbus'))
        .slice(-3)
        .join(' | ')
      throw new PdfIndisponible(`Chromium n’a produit aucun PDF. ${detail}`.trim())
    }
    return new Uint8Array(await readFile(sortie))
  } finally {
    await rm(dossier, { recursive: true, force: true }).catch(() => undefined)
  }
}

/* ------------------------------------------------------------------ */

/** Convertit une page HTML autonome en PDF A4. */
export async function htmlEnPdf(html: string): Promise<Uint8Array> {
  const propre = nettoyer(html)

  const parLeService = await parService(propre)
  if (parLeService?.length) return parLeService

  const parLeNavigateur = await parChromium(propre)
  if (parLeNavigateur?.length) return parLeNavigateur

  throw new PdfIndisponible(
    'Aucun moteur de conversion PDF n’est configuré (PDF_API_URL ou CHROMIUM_PATH).',
  )
}
