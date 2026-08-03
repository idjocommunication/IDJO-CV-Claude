import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Construit la version statique du site, destinée à un hébergement mutualisé
 * Hostinger (Apache, sans Node).
 *
 * Next refuse d'exporter des routes `/api` : elles répondent à des POST et
 * lisent des secrets, ce qu'un dossier de fichiers ne sait pas faire. Elles
 * sont donc écartées le temps du build, puis remises en place — y compris si
 * le build échoue, sinon le dépôt resterait amputé.
 *
 * Le site n'y perd pas ses fonctions essentielles : sans serveur, l'éditeur,
 * les modèles, l'aperçu, le PDF et les sauvegardes `.json` fonctionnent dans
 * le navigateur. L'assistant bascule sur son générateur local et le
 * formulaire de contact propose l'e-mail et WhatsApp.
 */

const API = 'src/app/api'
const REMISE = '.api-hors-export'
const SORTIE = 'out'
const HTACCESS = 'deploiement/hostinger/.htaccess'

const executer = (commande, args, env) =>
  execFileSync(commande, args, { stdio: 'inherit', shell: false, env: { ...process.env, ...env } })

function ecarterRoutes() {
  if (!fs.existsSync(API)) return false
  if (fs.existsSync(REMISE)) {
    throw new Error(
      `${REMISE} existe déjà : un build précédent s'est interrompu. Remettez ce dossier à la place de ${API} avant de recommencer.`,
    )
  }
  fs.renameSync(API, REMISE)
  return true
}

function remettreRoutes(ecartees) {
  if (!ecartees) return
  if (fs.existsSync(API)) fs.rmSync(API, { recursive: true, force: true })
  fs.renameSync(REMISE, API)
}

let ecartees = false
try {
  fs.rmSync(SORTIE, { recursive: true, force: true })
  ecartees = ecarterRoutes()

  executer('node', ['scripts/copy-pdf-worker.mjs'])
  executer('npx', ['next', 'build'], {
    EXPORT_STATIQUE: '1',
    // Lu par `src/lib/deploiement.ts`, et donc figé dans le JavaScript livré.
    NEXT_PUBLIC_SANS_SERVEUR: '1',
    // Sans serveur, aucune transaction ne peut être vérifiée : le
    // téléchargement reste libre, comme le veut la règle du projet.
    NEXT_PUBLIC_PAIEMENT_ACTIF: '0',
  })
} finally {
  remettreRoutes(ecartees)
}

// Apache pose les en-têtes de sécurité que le serveur Next posait lui-même,
// et sert les URL propres. Le fichier voyage avec le site.
fs.copyFileSync(HTACCESS, path.join(SORTIE, '.htaccess'))

// Repère utile côté hébergeur : savoir quelle version est en ligne.
fs.writeFileSync(
  path.join(SORTIE, 'version.txt'),
  `IDJÔ CV — export statique\nconstruit le ${new Date().toISOString()}\n`,
)

const compter = (dossier) =>
  fs
    .readdirSync(dossier, { withFileTypes: true })
    .reduce((total, e) => total + (e.isDirectory() ? compter(path.join(dossier, e.name)) : 1), 0)

console.log(`\nExport statique prêt : ${SORTIE}/ (${compter(SORTIE)} fichiers)`)
console.log("Déposez le contenu de ce dossier dans public_html sur Hostinger.")
