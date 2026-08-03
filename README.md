# IDJÔ CV

Plateforme SaaS de création de CV, pensée pour les candidats de **Côte d'Ivoire et d'Afrique
francophone**. Éditeur en ligne, aperçu A4 en temps réel, export PDF fidèle, huit modèles
professionnels déclinables en vingt-quatre palettes et neuf typographies.

## Stack

| Domaine | Choix |
| --- | --- |
| Framework | Next.js 15 (App Router, React 19, Server Components) |
| Langage | TypeScript strict |
| Styles | Tailwind CSS 3.4 + polices `next/font` (Inter, Anton) |
| État client | Zustand + `persist` (stockage local du navigateur) |
| Base de données | PostgreSQL via Prisma (optionnelle) |
| Validation | Zod (routes API) |
| Icônes | lucide-react |

## Démarrage

```bash
npm install
cp .env.example .env    # facultatif : la plateforme fonctionne sans base de données
npm run dev             # http://localhost:3000
```

Scripts utiles :

```bash
npm run build       # build de production
npm run typecheck   # vérification TypeScript
npm run lint        # ESLint (config Next.js)
npm run db:push     # applique le schéma Prisma sur PostgreSQL
```

## Architecture

```
src/
├── app/                    Routes App Router
│   ├── page.tsx            Accueil (hero carrousel + sections marketing)
│   ├── editeur/            Éditeur de CV (client, plein écran)
│   ├── modeles/            Galerie + fiche détaillée par modèle
│   ├── tarifs/             Offres en F CFA
│   ├── conseils/           Articles SEO
│   ├── contact/            Formulaire de contact
│   ├── legal/[slug]/       Mentions légales, confidentialité, CGU
│   ├── api/cv/             Enregistrement / relecture d'un CV
│   ├── api/contact/        Réception des messages (limitation par IP)
│   ├── sitemap.ts robots.ts manifest.ts
│   └── globals.css         Charte, feuille A4, styles d'impression
├── cv-templates/           Les 8 modèles + primitives de rendu
├── components/
│   ├── landing/            HeroCarousel, sections, carte modèle
│   ├── editor/             Coquille, formulaire, panneau de design
│   ├── site/               En-tête, pied de page, logo, formulaire contact
│   └── ui/                 Boutons, feuille auto-redimensionnée
├── data/                   Modèles, CV d'exemple, contenus marketing, articles
└── lib/                    Types, store, SEO, validation, Prisma, utilitaires
```

## Les modèles

Les quatre mises en page reprennent les références fournies, redessinées en monochrome :

| Modèle | Style | Recommandé pour | ATS |
| --- | --- | --- | --- |
| **Abidjan** | Dense, bandeau d'accroche, trois colonnes | Profils expérimentés | 92 |
| **Plateau** | Épuré, beaucoup de blanc, niveaux en pastilles | Créatifs, jeunes diplômés | 96 |
| **Lagune** | Colonne latérale pleine, corporate | Banque, audit, administration | 90 |
| **Cocody** | Carte latérale arrondie, polyvalent | Cadres, commerce, stages | 88 |

Chaque modèle est un composant React qui reçoit l'objet `CvData` et se rend dans une feuille
`794 × 1123 px` (A4 à 96 dpi). L'aperçu écran applique un simple `transform: scale()` ; l'export
PDF passe par une copie plein format (`.print-only`) et les règles `@page` de `globals.css`, ce
qui garantit un rendu identique à l'écran et à l'impression.

## Carrousel du hero

`src/components/landing/HeroCarousel.tsx` fait défiler les modèles de CV selon quatre rôles
(`center`, `left`, `right`, `back`). Position, échelle, flou, opacité et couleur de scène
transitionnent simultanément sur `650 ms` en `cubic-bezier(0.4, 0, 0.2, 1)`. Défilement
automatique, flèches, navigation clavier, et respect de `prefers-reduced-motion`.

## Assistant de rédaction

Le bouton « Assistant IA » de l'éditeur et de la lettre de motivation appelle
`POST /api/assistant` (`src/app/api/assistant/route.ts`). Quatre tâches : accroche du CV,
puces d'une expérience, propositions de compétences, et les trois paragraphes de la lettre.

- Avec `ANTHROPIC_API_KEY`, la route interroge Claude (`claude-opus-5`, réflexion adaptative,
  sortie structurée validée par Zod) à partir d'un résumé du CV **sans téléphone, e-mail ni
  photo**.
- Sans clé — ou en cas de panne, de quota ou de coupure réseau — le générateur local
  déterministe de `src/lib/assistant.ts` répond à la place, avec la même forme de réponse.
  L'interface indique la provenance du texte.

Le texte proposé n'est jamais inséré tout seul : l'utilisateur clique sur « Insérer ».

## Importer un CV existant

Le bouton « Importer » de l'éditeur accepte un PDF, un document Word (`.docx`),
du texte brut, ou une sauvegarde IDJÔ CV (`.json`) — et il est aussi possible de
coller directement le texte du CV.

- La lecture se fait dans le navigateur : `pdfjs-dist` pour les PDF, `fflate`
  pour décompresser les `.docx`. Les deux sont chargés à la demande, uniquement
  quand un fichier est déposé. Le « worker » de pdf.js est copié dans `public/`
  par `scripts/copy-pdf-worker.mjs` (déclenché par `prebuild` et `predev`).
- La structuration passe par `POST /api/import-cv` : Claude quand
  `ANTHROPIC_API_KEY` est présente, sinon l'analyse locale de `src/lib/cv-parse.ts`,
  qui reconnaît les rubriques usuelles d'un CV francophone. L'interface indique
  la provenance et prévient que l'analyse locale se perd sur les mises en page
  en colonnes.
- Le résultat est **toujours affiché avant d'être appliqué**, avec le texte lu
  d'origine : un import ne doit jamais écraser un travail en cours par surprise.
  Le modèle et les couleurs de l'utilisateur sont conservés.

## Paiement du téléchargement

La création, l'aperçu, l'assistant, l'analyse ATS et l'import sont gratuits.
Seul l'export du document final est payant, réglé par **Wave, Orange Money,
MTN MoMo, Moov Money ou carte bancaire** via **CinetPay**, qui couvre ces cinq
canaux avec une seule intégration.

Le parcours, sans compte ni base de données :

0. Le clic sur **Télécharger le PDF** ouvre une fenêtre de coordonnées :
   l'**e-mail** qui recevra le PDF, et le **numéro Mobile Money** qui sera
   débité.
1. `POST /api/paiement/initier` ouvre une transaction et renvoie l'adresse de
   la page de paiement CinetPay. Aucun numéro Mobile Money ni code secret ne
   transite par le site.
2. L'utilisateur règle, puis revient par `/api/paiement/retour` (GET ou POST,
   les deux sont acceptés) vers `/editeur?paiement=<référence>`.
3. `GET /api/paiement/statut` interroge CinetPay — **seule source de vérité**,
   ni le retour navigateur ni le corps du webhook ne font foi — et délivre un
   jeton d'accès signé en HMAC, conservé dans le navigateur.
4. `POST /api/paiement/notification` reçoit la notification serveur à serveur
   et sert de filet si l'utilisateur ferme son navigateur trop tôt.

Tant que l'accès n'est pas ouvert, **les copies imprimables ne sont pas
rendues** : un `Ctrl+P` sort une page « Document verrouillé » au lieu du CV. La
sauvegarde `.json` reste libre — ces données appartiennent à l'utilisateur.

Sans `NEXT_PUBLIC_PAIEMENT_ACTIF=1`, ou sans clés CinetPay, le téléchargement
reste entièrement libre : le site fonctionne avant même l'ouverture du compte
marchand.

### Réception du CV par e-mail

Une fois le débit confirmé, le document part en PDF sur l'adresse indiquée
avant le paiement. Le navigateur fabrique la page imprimable autonome
(`buildStandaloneHtml` : styles et polices incorporés), `POST /api/envoi-cv`
vérifie le jeton d'accès, imprime le PDF et l'expédie en pièce jointe. Rien
n'est conservé : ni le document, ni l'adresse.

Deux briques facultatives : un expéditeur (`RESEND_API_KEY` ou `BREVO_API_KEY`
+ `EMAIL_EXPEDITEUR`) et un moteur PDF (Chromium local, détecté
automatiquement ou via `CHROMIUM_PATH` ; sinon `PDF_API_URL` en hébergement
sans serveur). **Sans elles, l'interface annonce que l'envoi n'est pas actif et
propose le téléchargement direct** — jamais un envoi silencieusement perdu.
`GET /api/envoi-cv` répond `{"disponible":true|false}`.

Le choix de l'agrégateur ivoirien, l'ouverture du compte marchand et la
configuration complète sont détaillés dans
[`docs/paiement-mobile-money.md`](docs/paiement-mobile-money.md).

## Contact et coordonnées

Aucune coordonnée n'est écrite en dur : `SITE` (`src/lib/seo.tsx`) lit l'environnement et les
blocs restent masqués tant qu'une valeur n'est pas fournie. Le formulaire (`/api/contact`) essaie
successivement Resend, un webhook, puis la base ; **si aucun canal n'est configuré il répond `503`
et l'interface propose au visiteur d'envoyer lui-même le message par e-mail ou WhatsApp**. Il ne
doit jamais afficher « message reçu » sans destinataire.

## Longueur du CV

La feuille grandit avec le contenu. `ScaledCvSheet` mesure sa hauteur réelle, trace un repère à
chaque changement de page et remonte le nombre de pages : l'éditeur affiche « 1 page » ou
« 2 pages · la dernière est peu remplie ». À l'impression, les blocs marqués `.cv-block`
(expériences, formations) ne sont jamais coupés en deux.

## Données et confidentialité

Par défaut, aucun CV ne quitte le navigateur : l'éditeur persiste dans le `localStorage`
(`idjo-cv:document`), la lettre dans `idjo-cv:lettre`, et l'éditeur propose un export / import
JSON. Seul l'assistant, s'il est activé par une clé API, envoie un résumé anonymisé du CV. La base PostgreSQL n'est nécessaire que
pour la synchronisation multi-appareils et la facturation ; sans `DATABASE_URL`, les routes API
répondent proprement (503) et le reste de la plateforme fonctionne normalement.

## SEO

- Métadonnées et canoniques par page (`buildMetadata`), Open Graph et Twitter Cards.
- JSON-LD : `Organization`, `SoftwareApplication`, `FAQPage`, `Article`.
- `sitemap.xml` et `robots.txt` générés (l'éditeur est exclu de l'indexation).
- Pages statiques pré-rendues, polices auto-hébergées, aucune image bloquante dans le hero.

## Déploiement

Ce dépôt est prêt pour **Hostinger**, dans ses deux formules — le guide complet,
pas à pas, est dans [`deploiement/README.md`](deploiement/README.md).

| | Hébergement mutualisé | VPS |
| --- | --- | --- |
| Construction | `npm run build:statique` | `npm run build:vps` |
| Mise en ligne | contenu de `out/` dans `public_html`, ou branche `hostinger` via Git | `deploiement/hostinger/deployer-vps.sh` |
| Routes serveur | absentes — replis navigateur | toutes actives |

L'export statique conserve l'essentiel : éditeur, huit modèles, palettes, doses,
typographies, export PDF, lettre de motivation et sauvegardes `.json`
fonctionnent entièrement dans le navigateur. L'assistant y bascule sur son
générateur local, le formulaire de contact propose l'e-mail et WhatsApp, et le
téléchargement reste libre — faute de serveur pour vérifier un paiement.

Le site reste par ailleurs compatible avec toute plateforme supportant
Next.js 15 (Vercel, conteneur Node 20+).
Variables d'environnement : voir `.env.example`. Aucune n'est obligatoire pour faire tourner le
site, mais avant une mise en ligne il faut renseigner au minimum `NEXT_PUBLIC_SITE_URL`, les
coordonnées publiques (`NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_WHATSAPP`,
`NEXT_PUBLIC_LEGAL_NAME`, `NEXT_PUBLIC_HOST_NAME`) et un canal de réception pour le formulaire de
contact (`RESEND_API_KEY` + `CONTACT_FROM_EMAIL` + `CONTACT_TO_EMAIL`, ou `CONTACT_WEBHOOK_URL`).
`ANTHROPIC_API_KEY` active l'assistant de rédaction, `DATABASE_URL` la base optionnelle, le
groupe `NEXT_PUBLIC_PAIEMENT_*` + `CINETPAY_*` + `PAIEMENT_SECRET` le paiement du téléchargement,
et `EMAIL_EXPEDITEUR` + (`RESEND_API_KEY` ou `BREVO_API_KEY`) + un moteur PDF (`CHROMIUM_PATH` ou
`PDF_API_URL`) l'envoi du CV par e-mail.
