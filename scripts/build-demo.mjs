import { execFileSync } from 'node:child_process'
import { copyFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

/**
 * Compile la démo autonome.
 *
 * Les options d'esbuild vivent ici plutôt que dans une commande recopiée à la
 * main : c'est une divergence entre deux invocations qui a déjà produit une
 * page blanche.
 *
 * `banner` est indispensable : le code partagé avec le site lit
 * `process.env.NEXT_PUBLIC_…`, que Next remplace à la compilation mais
 * qu'esbuild laisse tel quel. Sans objet `process`, le paquet entier lève une
 * ReferenceError au chargement et plus rien ne s'affiche.
 */
const run = (commande, args) =>
  execFileSync(commande, args, { stdio: 'inherit', shell: false })

// Le worker de pdf.js est embarqué comme texte : la page autonome n'a pas de
// serveur pour le fournir, elle le transforme en blob au premier import de PDF.
const require = createRequire(import.meta.url)
copyFileSync(
  join(dirname(require.resolve('pdfjs-dist/package.json')), 'build', 'pdf.worker.min.mjs'),
  'demo-build/pdf-worker.txt',
)

run('npx', [
  'esbuild',
  'demo-build/entry.tsx',
  '--bundle',
  '--minify',
  '--format=iife',
  '--target=es2019',
  '--jsx=automatic',
  '--define:process.env.NODE_ENV="production"',
  '--banner:js=globalThis.process=globalThis.process||{env:{}};',
  '--alias:next/link=./demo-build/shims/link.tsx',
  '--alias:next/navigation=./demo-build/shims/navigation.ts',
  '--loader:.txt=text',
  '--outfile=demo-build/bundle.js',
])

run('npx', [
  'tailwindcss',
  '-c',
  'demo-build/tailwind.demo.ts',
  '-i',
  'src/app/globals.css',
  '-o',
  'demo-build/styles.css',
  '--minify',
])

run('node', ['demo-build/assemble.mjs'])
