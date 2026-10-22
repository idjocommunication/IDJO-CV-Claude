import { appendFile, mkdir, readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

/**
 * Registre des téléchargements déjà délivrés.
 *
 * Un paiement, un code d'accès ou un envoi par e-mail ne sert qu'une fois. Le
 * site n'ayant pas de base de données obligatoire, le registre est un simple
 * fichier texte, une ligne par droit délivré (`nature<TAB>clé<TAB>instant`),
 * rangé hors du dossier de l'application pour survivre aux redéploiements.
 *
 * Les ajouts en fin de fichier restent sûrs quand plusieurs processus Node
 * servent le site en même temps. Si le fichier est inaccessible, le droit est
 * accordé et l'incident journalisé : un client qui a payé ne doit jamais être
 * bloqué par une panne du registre.
 */

const FICHIER =
  process.env.PAIEMENT_REGISTRE?.trim() || join(homedir(), '.idjo-cv', 'registre-telechargements.txt')

export type Nature = 'paiement' | 'code' | 'envoi'

/**
 * Délai pendant lequel un même droit peut être redemandé : réponse perdue sur
 * un réseau mobile, page rechargée juste après le paiement.
 */
const TOLERANCE_MS = 10 * 60 * 1000

/** Instant de la première délivrance de `cle`, ou `null` si elle n'a jamais servi. */
async function premiereDelivrance(nature: Nature, cle: string) {
  let contenu = ''
  try {
    contenu = await readFile(FICHIER, 'utf8')
  } catch (erreur) {
    if ((erreur as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw erreur
  }
  for (const ligne of contenu.split('\n')) {
    const [n, c, instant] = ligne.split('\t')
    if (n === nature && c === cle) return Number(instant) || 0
  }
  return null
}

async function inscrire(nature: Nature, cle: string) {
  await mkdir(dirname(FICHIER), { recursive: true })
  await appendFile(FICHIER, `${nature}\t${cle}\t${Date.now()}\n`, 'utf8')
}

/** Les clés viennent de l'extérieur : rien qui puisse casser une ligne. */
function cleSure(cle: string) {
  return cle.replace(/[\t\r\n]/g, ' ').slice(0, 200)
}

/**
 * Délivre le droit `cle` s'il n'a jamais servi, ou s'il a servi il y a moins
 * de dix minutes. Renvoie `false` quand il est déjà consommé.
 */
export async function delivrer(nature: Nature, cle: string) {
  const sure = cleSure(cle)
  try {
    const premiere = await premiereDelivrance(nature, sure)
    if (premiere === null) {
      await inscrire(nature, sure)
      return true
    }
    return Date.now() - premiere < TOLERANCE_MS
  } catch (erreur) {
    console.error('[registre] inaccessible, droit accordé sans contrôle :', erreur)
    return true
  }
}

/** Le droit `cle` a-t-il déjà servi ? (lecture seule) */
export async function dejaDelivre(nature: Nature, cle: string) {
  try {
    return (await premiereDelivrance(nature, cleSure(cle))) !== null
  } catch (erreur) {
    console.error('[registre] inaccessible :', erreur)
    return false
  }
}

/** Note qu'un droit a servi, sans contrôle préalable. */
export async function noterDelivrance(nature: Nature, cle: string) {
  try {
    await inscrire(nature, cleSure(cle))
  } catch (erreur) {
    console.error('[registre] inscription impossible :', erreur)
  }
}
