import fs from 'node:fs'
import path from 'node:path'

/**
 * Assemble la démo autonome : styles, polices et bundle dans un seul fichier.
 * Les polices sont retrouvées dans la feuille de styles produite par
 * `next build` puis inlinées en data URI — le CSP des pages publiées interdit
 * toute requête externe.
 */

const CSS_DIR = '.next/static/css'
const MEDIA_DIR = '.next/static/media'

function nextCss() {
  return fs
    .readdirSync(CSS_DIR)
    .filter((file) => file.endsWith('.css'))
    .map((file) => fs.readFileSync(path.join(CSS_DIR, file), 'utf8'))
    .join('\n')
}

/** Retrouve le woff2 du sous-ensemble latin d'une famille. */
function fontFile(css, family) {
  const rules = [...css.matchAll(/@font-face\{([^}]*)\}/g)].map((match) => match[1])
  const rule = rules.find(
    (declaration) =>
      declaration.includes(`font-family:${family}`) &&
      declaration.includes('unicode-range:u+00??'),
  )
  const found = rule?.match(/url\(\/_next\/static\/media\/([^)]+\.woff2)\)/)
  if (!found) throw new Error(`Police introuvable dans le build : ${family}`)
  return path.join(MEDIA_DIR, found[1])
}

const css = nextCss()
const b64 = (file) => fs.readFileSync(file).toString('base64')

const FACES = [
  { name: 'Inter', weight: '100 900' },
  { name: 'Anton', weight: '400' },
  { name: 'Lora', weight: '400 700' },
  { name: 'Archivo Narrow', weight: '400 700' },
]

const fonts =
  FACES.map(
    (face) =>
      `@font-face{font-family:'${face.name}';font-style:normal;font-weight:${face.weight};font-display:swap;src:url(data:font/woff2;base64,${b64(fontFile(css, face.name))}) format('woff2');}`,
  ).join('\n') +
  // Seules les quatre familles ci-dessus sont embarquées : la démonstration
  // resterait trop lourde avec les dix polices de l'éditeur. Les autres choix
  // typographiques retombent sur des équivalents système.
  `\n:root{--font-inter:'Inter';--font-anton:'Anton';--font-lora:'Lora';--font-archivo:'Archivo Narrow';` +
  `--font-montserrat:'Inter';--font-poppins:'Inter';--font-work-sans:'Inter';--font-plex:'Inter';` +
  `--font-source-serif:'Lora';--font-playfair:'Lora';}\n`

const local = `
/* Ajustements propres à la page de démonstration */
html,body{background:#ffffff;}
#idjo-root{font-family:'Inter',ui-sans-serif,system-ui,sans-serif;color:#0A0A0A;background:#ffffff;}
#demo-editeur{scroll-margin-top:76px;}
/* L'éditeur, plein écran sur le site, est encadré ici */
.demo-editor .screen-only{height:min(88vh,880px);}
.demo-editor .sticky{position:sticky;}
`

const styles = fonts + fs.readFileSync('demo-build/styles.css', 'utf8') + local
const js = fs.readFileSync('demo-build/bundle.js', 'utf8')

const html = `<title>IDJÔ CV — démo interactive</title>
<style>${styles}</style>
<div id="idjo-root"></div>
<noscript><p style="font-family:sans-serif;padding:2rem">Activez JavaScript pour utiliser la démo d’IDJÔ CV.</p></noscript>
<script>${js}</script>
`

fs.writeFileSync('demo-build/idjo-cv-demo.html', html)
console.log('taille', (html.length / 1024).toFixed(0), 'Ko')
