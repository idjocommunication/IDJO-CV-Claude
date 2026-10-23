# IDJÔ CV — consignes de travail

## Publication automatique du code

**Après chaque modification terminée et vérifiée, committer et pousser sans
attendre qu'on le demande.** L'utilisateur veut retrouver tout nouveau code
directement sur le dépôt.

```bash
npm run typecheck && npm run lint && npm run build   # avant tout commit
git add -A
git commit -m "<message clair en français>"
git push -u origin <branche de développement de la session>
```

- Une modification livrée sans build vert n'est pas committée.
- Messages de commit en français, à l'impératif, décrivant l'effet
  fonctionnel plutôt que la liste des fichiers.
- Ne jamais pousser sur `main` sans demande explicite : le travail va sur la
  branche de développement indiquée pour la session.
- Si le push échoue en `403`, c'est que l'app GitHub est en lecture seule sur
  ce dépôt : le signaler immédiatement à l'utilisateur plutôt que de
  réessayer en boucle, et lui envoyer un `git bundle` de sauvegarde car le
  conteneur de session est éphémère.

## Le projet

Plateforme SaaS de création de CV pour la Côte d'Ivoire et l'Afrique
francophone. Next.js 15 (App Router), React 19, TypeScript strict,
Tailwind CSS 3.4, Zustand, Zod, Prisma/PostgreSQL optionnel.

- **Charte du site : bleu nuit et bleu roi**, définie dans `tailwind.config.ts`
  (`navy` 500→900, `azur` 50→700, gris bleutés `cloud`). Sections alternées
  sombre / clair, cartes de verre (`.glass`) sur les fonds bleu nuit, halo
  radial `bg-navy-glow` et dégradé `bg-azur-btn` pour les boutons primaires.
- **L'éditeur reste clair** : fond blanc et bleutés, la couleur y sert
  uniquement aux actions.
- **Les documents CV sont en couleur** : palettes de `src/lib/theme.ts`,
  dose de couleur (`intensity`) et typographie choisies par l'utilisateur.
  Toute nouvelle teinte doit rester lisible avec du texte blanc (contraste
  ≥ 4,5) et propre à l'impression.
- Toute l'interface et tout le contenu sont **en français**.
- Les huit modèles de CV (`src/cv-templates/`) se rendent sur une feuille
  A4 de 794 × 1123 px. Les tailles sont en pixels, multipliées par
  `settings.fontScale`.
- L'export PDF repose sur la copie `.print-only` et les règles `@page` de
  `src/app/globals.css` : toute modification de mise en page doit être
  revérifiée à l'impression, pas seulement à l'écran.
- L'éditeur fonctionne **sans compte et sans base de données** (persistance
  `localStorage`). Ne pas introduire de dépendance obligatoire à la base.
- **Le site doit rester déployable sans serveur** : `npm run build:statique`
  produit l'export destiné à l'hébergement mutualisé Hostinger. Toute
  fonctionnalité nouvelle qui appelle `/api` doit prévoir son repli navigateur
  et le déclarer via `SANS_SERVEUR` (`src/lib/deploiement.ts`), sinon l'export
  livrerait un bouton qui ne répond pas. Voir `deploiement/README.md`.
- **Le paiement doit rester facultatif** : sans `NEXT_PUBLIC_PAIEMENT_ACTIF=1`
  ni clés CinetPay, le téléchargement est libre et le site reste complet. Ne
  jamais faire transiter un numéro Mobile Money ou un code secret par le site,
  et ne jamais accorder un accès sans avoir vérifié la transaction auprès de
  l'agrégateur. La sauvegarde `.json` reste toujours gratuite : les données
  saisies appartiennent à l'utilisateur.
- **L'assistant de rédaction doit rester facultatif** : `/api/assistant`
  appelle Claude quand `ANTHROPIC_API_KEY` est présente, sinon le générateur
  local de `src/lib/assistant.ts` répond. Ne jamais envoyer le téléphone,
  l'e-mail ni la photo du candidat, et ne jamais insérer un texte généré sans
  action explicite de l'utilisateur.
- **L'import de CV** (`src/components/editor/ImportCv.tsx`) est la seule
  exception à cette règle : lire un CV, c'est lire ses coordonnées. Le CV
  complet (image comprise) ne part chez Claude (`/api/import-cv`) qu'après un
  écran de choix où l'utilisateur accepte explicitement l'envoi à Anthropic ;
  l'autre option, la lecture sur l'appareil (`cv-parse.ts`, OCR tesseract.js
  de `src/lib/ocr.ts`), ne fait rien sortir du navigateur. Ne jamais
  supprimer cet écran ni envoyer un CV sans ce consentement. Les PDF exportés
  ici portent leurs données dans un lien invisible (`src/lib/cv-embarque.ts`,
  sans la photo) et se réimportent à l'identique, sans analyse.

## Vérification visuelle

Chromium est disponible (`/opt/pw-browsers/`). Pour toute modification
d'interface, lancer `npm run build && npx next start -p <port>` puis capturer
l'écran avec Playwright (`npm i --no-save playwright`) avant de conclure —
y compris le rendu d'impression via `emulateMedia({ media: 'print' })`.

## Contenus à ne pas oublier avant mise en production

- Les témoignages de `src/data/marketing.ts` sont des exemples de
  démonstration : ils doivent être remplacés par de vrais retours clients ou
  retirés avant toute mise en ligne.
- Les coordonnées de `src/lib/seo.tsx` (email, téléphone) et les mentions
  légales sont des valeurs de remplacement.
