import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Télécharge une fois pour toutes les polices du site dans `src/app/polices/`.
 *
 * Elles étaient chargées par `next/font/google`, qui les récupère chez Google
 * à chaque construction. Sur les serveurs de construction Hostinger, Google
 * Fonts répond par intermittence avec des adresses que Next.js ne sait pas
 * lire, et la construction échoue (« An error occurred in next/font »). Les
 * fichiers sont donc versionnés dans le dépôt et servis par `next/font/local`.
 *
 * À relancer seulement pour ajouter une famille ou une graisse :
 *   node scripts/telecharger-polices.mjs
 *
 * Polices sous licence SIL Open Font License : la redistribution est permise.
 * Seul le sous-ensemble « latin » est gardé, comme auparavant : il couvre le
 * français (accents, Œ, guillemets, apostrophe typographique).
 */

const FAMILLES = [
  { famille: 'Inter', fichier: 'inter', graisses: '400..800' },
  { famille: 'Lora', fichier: 'lora', graisses: '400..700' },
  { famille: 'Archivo Narrow', fichier: 'archivo-narrow', graisses: '400..700' },
  { famille: 'Anton', fichier: 'anton', graisses: '400' },
  { famille: 'Montserrat', fichier: 'montserrat', graisses: '400..800' },
  { famille: 'Poppins', fichier: 'poppins', graisses: '400;500;600;700;800' },
  { famille: 'Work Sans', fichier: 'work-sans', graisses: '400..800' },
  { famille: 'IBM Plex Sans', fichier: 'ibm-plex-sans', graisses: '400..700' },
  { famille: 'Source Serif 4', fichier: 'source-serif-4', graisses: '400..700' },
  { famille: 'Playfair Display', fichier: 'playfair-display', graisses: '400..800' },
]

// Un navigateur récent : Google ne sert le woff2 qu'à ceux qui le lisent.
const NAVIGATEUR =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'

const dossier = join(process.cwd(), 'src', 'app', 'polices')
mkdirSync(dossier, { recursive: true })

for (const { famille, fichier, graisses } of FAMILLES) {
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(famille)}:wght@${graisses}&display=swap`
  const css = await (await fetch(url, { headers: { 'User-Agent': NAVIGATEUR } })).text()

  const blocs = css.split('/* latin */').slice(1)
  if (!blocs.length) throw new Error(`${famille} : aucun bloc « latin » dans la réponse de Google`)

  for (const bloc of blocs) {
    const graisse = bloc.match(/font-weight:\s*([\d ]+);/)?.[1]?.trim()
    const source = bloc.match(/url\((https:[^)]+\.woff2)\)/)?.[1]
    if (!graisse || !source) throw new Error(`${famille} : bloc illisible`)

    const nom = `${fichier}-${graisse.replace(' ', '-')}.woff2`
    const octets = new Uint8Array(await (await fetch(source)).arrayBuffer())
    writeFileSync(join(dossier, nom), octets)
    console.log(`${nom}  ${(octets.length / 1024).toFixed(0)} Ko`)
  }
}
