# Démo autonome

Compile le site en **une seule page HTML autonome** (React, styles et polices
inclus), utilisable pour partager un aperçu jouable sans déployer quoi que ce
soit. Seule la navigation multi-pages est remplacée : les liens `next/link`
défilent vers l'éditeur.

```bash
npm run build   # génère les polices dans .next/static/media
npm run demo    # esbuild + Tailwind + assemblage → demo-build/idjo-cv-demo.html
```

Les options de compilation vivent dans `scripts/build-demo.mjs` et non dans une
commande recopiée à la main : c'est une divergence entre deux invocations qui a
déjà produit une page blanche.

**Piège à connaître.** Le code partagé avec le site lit
`process.env.NEXT_PUBLIC_…`. Next remplace ces expressions à la compilation ;
esbuild les laisse telles quelles. Sans objet `process` dans le navigateur, le
paquet entier lève une `ReferenceError` au chargement et la page reste blanche.
D'où le `--banner:js` qui définit `globalThis.process` avant tout le reste.


`esbuild` n'est pas une dépendance du projet : `npm i --no-save esbuild`.
