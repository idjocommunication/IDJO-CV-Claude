'use client'

/**
 * Impression et téléchargement des documents.
 *
 * Les deux éditeurs affichent en permanence une copie `.print-only` du CV
 * **et** de la lettre : l'attribut `data-print` posé sur `<body>` décide de ce
 * qui part à l'impression. On peut donc télécharger l'un, l'autre ou les deux
 * depuis n'importe laquelle des deux pages.
 *
 * Tout ne fonctionne pas partout : dans un aperçu intégré (iframe de démo,
 * webview), `window.print()` est souvent inopérant. On ouvre alors le document
 * dans un onglet dédié, et si les fenêtres sont bloquées on propose un fichier
 * à télécharger. Aucun bouton ne doit rester sans effet.
 */

export type PrintTarget = 'cv' | 'lettre' | 'tout'

export const PRINT_LABELS: Record<PrintTarget, string> = {
  cv: 'Mon CV',
  lettre: 'Ma lettre de motivation',
  tout: 'CV + lettre',
}

/** Résultat d'une demande d'impression, pour que l'interface puisse réagir. */
export type PrintOutcome = 'imprime' | 'nouvel-onglet' | 'bloque'

/**
 * Une page peut contenir plusieurs copies imprimables (la démo affiche les
 * deux éditeurs à la suite) : on ne retient que la première de chaque type.
 */
function sheetsFor(target: PrintTarget) {
  const first = (selector: string) => document.querySelector<HTMLElement>(selector)
  const nodes =
    target === 'tout'
      ? [first('.print-doc-cv'), first('.print-doc-lettre')]
      : [first(target === 'cv' ? '.print-doc-cv' : '.print-doc-lettre')]
  return nodes.filter((node): node is HTMLElement => Boolean(node))
}

/** Vrai quand la page est affichée dans un cadre (aperçu, démo, webview). */
export function isEmbedded() {
  try {
    return window.self !== window.top
  } catch {
    // Accès refusé au parent : on est bien dans un cadre étranger.
    return true
  }
}

/**
 * Nom de fichier sûr : sans accent ni caractère spécial.
 *
 * Chrome ignore purement et simplement l'attribut `download` dès qu'il
 * contient un caractère non ASCII — le fichier arrive alors nommé « download »,
 * sans extension, donc impossible à rouvrir ni à réimporter.
 */
export function safeFilename(name: string) {
  const sansAccent = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  return (
    sansAccent
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'idjo-cv'
  )
}

/**
 * Télécharge un contenu. L'ancre doit être dans le document et l'URL blob ne
 * doit être libérée qu'après le démarrage du téléchargement, sans quoi le
 * navigateur enregistre un fichier vide.
 */
export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = safeFilename(filename)
  link.rel = 'noopener'
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()

  window.setTimeout(() => {
    link.remove()
    URL.revokeObjectURL(url)
  }, 4000)
}

/** Enregistre un objet en fichier `.json` (sauvegarde ou transfert d'appareil). */
export function downloadJson(filename: string, data: unknown) {
  downloadBlob(filename, new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
}

/**
 * Document autonome contenant la ou les feuilles demandées, avec les styles de
 * la page courante — polices comprises. Sert à la fois pour l'onglet
 * d'impression et pour le fichier de secours.
 */
export function buildPrintableHtml(target: PrintTarget, title: string) {
  const sheets = sheetsFor(target)
    .map((node) => node.outerHTML)
    .join('')

  const styles = Array.from(
    document.querySelectorAll<HTMLElement>('style, link[rel="stylesheet"]'),
  )
    .map((node) => node.outerHTML)
    .join('')

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
${styles}
<style>
  /* Les polices du site ne suivent pas dans un fichier autonome : on redéfinit
     les variables pour éviter un rendu en serif par défaut. */
  :root {
    --font-inter: 'Inter', 'Segoe UI', Roboto, Arial, sans-serif;
    --font-lora: 'Lora', Georgia, 'Times New Roman', serif;
    --font-archivo: 'Archivo Narrow', 'Arial Narrow', Arial, sans-serif;
    --font-montserrat: 'Montserrat', 'Helvetica Neue', Arial, sans-serif;
    --font-poppins: 'Poppins', 'Century Gothic', Arial, sans-serif;
    --font-work-sans: 'Work Sans', 'Segoe UI', Arial, sans-serif;
    --font-plex: 'IBM Plex Sans', 'Segoe UI', Arial, sans-serif;
    --font-source-serif: 'Source Serif 4', Cambria, Georgia, serif;
    --font-playfair: 'Playfair Display', 'Times New Roman', Georgia, serif;
  }
  html, body { margin: 0; padding: 0; background: #E8EEF7; }
  .print-only { display: block !important; }
  .cv-sheet { margin: 0 auto; background: #fff; }
  @media screen { .cv-sheet { box-shadow: 0 12px 40px -16px rgba(4,18,43,.45); margin-block: 16px; } }
  @page { size: A4; margin: 0; }
  @media print {
    html, body { background: #fff; }
    .cv-sheet { box-shadow: none; margin: 0; width: 210mm; min-height: 297mm; }
    .cv-block { break-inside: avoid; page-break-inside: avoid; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  }
</style>
</head>
<body>${sheets}</body>
</html>`
}

/**
 * Même document, mais réellement autonome : les feuilles de style liées sont
 * incorporées et leurs URL relatives (polices, images) rendues absolues.
 *
 * C'est la version envoyée au serveur pour l'expédition par e-mail : le moteur
 * qui l'imprime n'a pas accès au contexte de la page, et sans cette étape le
 * PDF sortirait sans mise en forme.
 */
export async function buildStandaloneHtml(target: PrintTarget, title: string) {
  const base = window.location.origin
  const html = buildPrintableHtml(target, title)

  const liens = Array.from(
    new Set(
      Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')).map(
        (node) => node.href,
      ),
    ),
  )

  const styles = await Promise.all(
    liens.map(async (href) => {
      try {
        const reponse = await fetch(href, { credentials: 'same-origin' })
        if (!reponse.ok) return ''
        const css = await reponse.text()
        // `url(../media/xxx.woff2)` est relatif à la feuille, pas au document.
        return css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (tout, guillemet, cible: string) => {
          if (/^(data:|https?:|#)/i.test(cible)) return tout
          try {
            return `url(${guillemet}${new URL(cible, href).href}${guillemet})`
          } catch {
            return tout
          }
        })
      } catch {
        return ''
      }
    }),
  )

  const incorpore = styles.filter(Boolean).join('\n')

  return html
    .replace('<meta charset="utf-8">', `<meta charset="utf-8">\n<base href="${base}/">`)
    .replace(/<link\b[^>]*rel=["']?stylesheet["']?[^>]*>/gi, '')
    .replace('</head>', `<style>\n${incorpore}\n</style>\n</head>`)
}

/** Ouvre le document dans un onglet dédié et y lance l'impression. */
function openInTab(target: PrintTarget, title: string) {
  const tab = window.open('', '_blank')
  if (!tab) return false

  tab.document.open()
  tab.document.write(buildPrintableHtml(target, title))
  tab.document.close()

  // Laisse les polices s'appliquer avant d'ouvrir la boîte d'impression.
  tab.setTimeout(() => {
    try {
      tab.focus()
      tab.print()
    } catch {
      /* L'utilisateur imprimera depuis le menu du navigateur. */
    }
  }, 700)

  return true
}

/**
 * Lance l'impression de `target`. Renvoie ce qui s'est réellement passé pour
 * que l'appelant puisse guider l'utilisateur en cas de blocage.
 */
export function printDocument(target: PrintTarget): PrintOutcome {
  if (typeof document === 'undefined') return 'bloque'
  const title = `IDJÔ CV — ${PRINT_LABELS[target]}`

  const body = document.body
  const previous = body.dataset.print ?? 'cv'
  body.dataset.print = target

  let restored = false
  const restore = () => {
    if (restored) return
    restored = true
    body.dataset.print = previous
    window.removeEventListener('afterprint', restore)
  }

  // On tente toujours l'impression directe, y compris depuis un cadre : dans
  // la plupart des navigateurs elle imprime bien le document de ce cadre. Ce
  // n'est qu'en cas de refus qu'on cherche une autre voie.
  try {
    window.addEventListener('afterprint', restore)
    window.print()
    window.setTimeout(restore, 800)
    return 'imprime'
  } catch {
    restore()
  }

  if (openInTab(target, title)) return 'nouvel-onglet'
  return 'bloque'
}

/**
 * Copie du texte dans le presse-papiers.
 *
 * Dans un aperçu intégré, `navigator.clipboard` est refusé mais la vieille
 * commande d'édition passe encore : c'est le seul moyen d'en faire sortir
 * quelque chose quand les téléchargements sont interdits.
 */
export function copyToClipboard(text: string) {
  const zone = document.createElement('textarea')
  zone.value = text
  zone.setAttribute('readonly', '')
  zone.style.position = 'fixed'
  zone.style.top = '-1000px'
  document.body.appendChild(zone)
  zone.select()
  zone.setSelectionRange(0, text.length)

  let copie = false
  try {
    copie = document.execCommand('copy')
  } catch {
    copie = false
  }
  zone.remove()

  if (!copie) void navigator.clipboard?.writeText(text).catch(() => undefined)
  return copie
}

/** Dernier recours : le document part en fichier HTML, imprimable hors ligne. */
export function downloadPrintableHtml(target: PrintTarget, filename: string) {
  const html = buildPrintableHtml(target, `IDJÔ CV — ${PRINT_LABELS[target]}`)
  downloadBlob(filename, new Blob([html], { type: 'text/html;charset=utf-8' }))
}
