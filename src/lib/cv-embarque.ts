import { deflateSync, inflateSync, strFromU8, strToU8 } from 'fflate'
import { EMPTY_CV } from '@/data/sample-cv'
import { SITE } from '@/lib/seo'
import type { CvData } from '@/lib/types'

/**
 * Données du CV glissées dans le PDF exporté.
 *
 * Un PDF ne garde que du texte posé à des coordonnées : le relire oblige à
 * deviner les rubriques, et une mise en page en colonnes brouille tout. Pour
 * les CV fabriqués ici, on évite de deviner : la copie d'impression porte un
 * lien invisible dont l'adresse contient le document complet, compressé. Les
 * navigateurs conservent les liens dans le PDF ; à l'import, il suffit de le
 * relire pour retrouver chaque rubrique, le modèle et les couleurs.
 *
 * La photo n'est pas embarquée : elle pèserait plus que tout le reste réuni,
 * et l'adresse d'un lien doit rester courte.
 */

const MARQUEUR = '#idjo-cv='
const VERSION = 'v1.'
/** Au-delà, ce n'est plus un CV : on refuse plutôt que de saturer l'éditeur. */
const TAILLE_MAX = 400_000

function versBase64Url(octets: Uint8Array) {
  let binaire = ''
  for (let i = 0; i < octets.length; i += 0x8000) {
    binaire += String.fromCharCode(...octets.subarray(i, i + 0x8000))
  }
  return btoa(binaire).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function depuisBase64Url(texte: string) {
  const base64 = texte.replace(/-/g, '+').replace(/_/g, '/')
  const binaire = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4))
  const octets = new Uint8Array(binaire.length)
  for (let i = 0; i < binaire.length; i += 1) octets[i] = binaire.charCodeAt(i)
  return octets
}

/** Adresse du lien caché : elle ouvre l'éditeur si quelqu'un clique dessus. */
export function lienDonneesCv(data: CvData) {
  const json = JSON.stringify({ ...data, profile: { ...data.profile, photo: undefined } })
  const charge = versBase64Url(deflateSync(strToU8(json), { level: 9 }))
  return `${SITE.url.replace(/\/+$/, '')}/editeur${MARQUEUR}${VERSION}${charge}`
}

/** Relit un lien trouvé dans un PDF ; `null` s'il ne vient pas d'IDJÔ CV. */
export function cvDepuisLien(url: string): CvData | null {
  const position = url.indexOf(MARQUEUR + VERSION)
  if (position < 0) return null

  try {
    const charge = url.slice(position + MARQUEUR.length + VERSION.length)
    const octets = inflateSync(depuisBase64Url(decodeURIComponent(charge)))
    if (octets.length > TAILLE_MAX) return null

    const lu = JSON.parse(strFromU8(octets)) as Partial<CvData>
    if (!lu.profile || !lu.settings) return null

    // Un champ ajouté depuis l'export reçoit sa valeur par défaut.
    const base = JSON.parse(JSON.stringify(EMPTY_CV)) as CvData
    return {
      ...base,
      ...lu,
      profile: { ...base.profile, ...lu.profile, photo: '' },
      settings: { ...base.settings, ...lu.settings },
    } as CvData
  } catch {
    return null
  }
}
