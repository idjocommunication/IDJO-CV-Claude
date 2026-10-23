/**
 * Compléments pour les navigateurs d'iPhone, chargés avant pdf.js — dans la
 * page (`cv-import.ts`) comme dans son worker (`pdf-worker.ts`).
 *
 * pdf.js lit le texte d'une page avec `for await (… of readableStream)`. Cette
 * itération des `ReadableStream` manque encore à Safari : sur iPhone, l'import
 * de tout PDF échouait avec « undefined is not a function (near '…t of e…') ».
 * pdf.js appelle aussi directement quelques fonctions arrivées avec iOS 15.4.
 * Chaque complément n'est posé que si le navigateur ne l'a pas déjà.
 */

type Lecteur = ReadableStreamDefaultReader<unknown>

function definir(cible: object, nom: PropertyKey, valeur: unknown) {
  if (nom in cible) return
  Object.defineProperty(cible, nom, { value: valeur, writable: true, configurable: true })
}

const flux = globalThis.ReadableStream?.prototype as
  | (ReadableStream<unknown> & Record<PropertyKey, unknown>)
  | undefined

if (flux && !(Symbol.asyncIterator in flux)) {
  // Même comportement que l'itérateur standard : lecture morceau par
  // morceau, et annulation du flux si la boucle s'interrompt avant la fin.
  const values = function (this: ReadableStream<unknown>, options?: { preventCancel?: boolean }) {
    const lecteur: Lecteur = this.getReader()
    return {
      async next() {
        try {
          const resultat = await lecteur.read()
          if (resultat.done) lecteur.releaseLock()
          return resultat
        } catch (erreur) {
          lecteur.releaseLock()
          throw erreur
        }
      },
      async return(valeur?: unknown) {
        if (!options?.preventCancel) {
          const annulation = lecteur.cancel(valeur)
          lecteur.releaseLock()
          await annulation
        } else {
          lecteur.releaseLock()
        }
        return { done: true, value: valeur }
      },
      [Symbol.asyncIterator]() {
        return this
      },
    }
  }
  definir(flux, 'values', values)
  definir(flux, Symbol.asyncIterator, values)
}

definir(Object, 'hasOwn', (objet: object, cle: PropertyKey) =>
  Object.prototype.hasOwnProperty.call(objet, cle),
)

definir(Array.prototype, 'at', function (this: unknown[], index: number) {
  const n = Math.trunc(index) || 0
  return this[n < 0 ? this.length + n : n]
})

definir(Array.prototype, 'findLast', function (
  this: unknown[],
  test: (valeur: unknown, index: number, tableau: unknown[]) => boolean,
) {
  for (let i = this.length - 1; i >= 0; i -= 1) if (test(this[i], i, this)) return this[i]
  return undefined
})

definir(Array.prototype, 'findLastIndex', function (
  this: unknown[],
  test: (valeur: unknown, index: number, tableau: unknown[]) => boolean,
) {
  for (let i = this.length - 1; i >= 0; i -= 1) if (test(this[i], i, this)) return i
  return -1
})

export {}
