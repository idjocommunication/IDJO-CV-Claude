/**
 * Cible de déploiement, vue du navigateur.
 *
 * Sur un hébergement mutualisé, le site est un export statique : il n'y a
 * aucune route `/api` derrière. Le code sait déjà se rabattre sur ses replis
 * quand un appel échoue — l'indicateur ci-dessous évite en plus l'aller-retour
 * inutile et permet à l'interface d'annoncer honnêtement ce qui est
 * disponible, plutôt que de laisser croire à une panne.
 *
 * Il est posé par `scripts/build-statique.mjs` et vaut toujours faux dans un
 * build serveur.
 */
export const SANS_SERVEUR = process.env.NEXT_PUBLIC_SANS_SERVEUR === '1'
