# Encaisser en Mobile Money et livrer le CV par e-mail

Ce document répond à deux questions :

1. **quel service de paiement ivoirien brancher** pour encaisser en Wave,
   Orange Money et MTN MoMo ;
2. **comment le connecter** à IDJÔ CV, et comment le client reçoit son CV en
   PDF par e-mail une fois débité.

Tout ce qui suit est facultatif : sans aucune de ces clés, le site fonctionne
et le téléchargement reste libre.

---

## 1. Le parcours vu par le client

1. Il clique sur **Télécharger le PDF**.
2. Une fenêtre lui demande ses coordonnées :
   - l'**e-mail** sur lequel il recevra son CV en PDF ;
   - le **numéro Mobile Money** qui sera débité ;
   - son nom (exigé par l'agrégateur pour la transaction).
3. Il est envoyé sur la page sécurisée de l'agrégateur, choisit Wave, Orange
   Money, MTN, Moov ou sa carte, et valide le débit sur son téléphone.
4. De retour sur le site, la transaction est vérifiée auprès de l'agrégateur ;
   **le CV part alors automatiquement en PDF sur son e-mail**, et le
   téléchargement direct s'ouvre sur l'appareil.

Aucun numéro complet, aucun code secret, aucun solde ne transite par IDJÔ CV.
Le site ne conserve ni le document, ni l'adresse e-mail.

---

## 2. Quel agrégateur choisir ?

En Côte d'Ivoire, un marchand a deux voies : signer avec **chaque opérateur**
(Wave, Orange, MTN, Moov) ou passer par un **agrégateur** qui les regroupe
derrière une seule intégration et un seul reversement.

| Solution | Canaux couverts | Pour qui | Remarque |
|---|---|---|---|
| **CinetPay** *(recommandé, déjà intégré)* | Wave, Orange Money, MTN MoMo, Moov Money, Visa/Mastercard | PME et indépendants en Côte d'Ivoire et UEMOA | Société ivoirienne, la plus répandue localement ; un seul contrat, une seule API, un seul tableau de bord |
| PayDunya | Wave, Orange, MTN, Moov, cartes | Marchands présents aussi au Sénégal | Équivalent fonctionnel, ancrage sénégalais |
| Fedapay | Mobile money UEMOA, cartes | Développeurs | Documentation soignée, ancrage béninois |
| Flutterwave | Mobile money + cartes, multi-pays | Activité au-delà de l'UEMOA | Support francophone plus distant |
| **Wave Business** (API directe) | Wave uniquement | Volume important sur Wave | Commission plus basse sur le canal dominant, mais il faut ajouter Orange et MTN séparément |
| Orange Money / MTN MoMo (API directes) | Un opérateur chacun | Gros volumes | Un contrat, une intégration et une réconciliation par opérateur |

**Recommandation.** Démarrer avec **CinetPay** : un seul compte marchand couvre
les quatre porte-monnaie mobiles et les cartes, c'est ce que le code fait déjà.
Si Wave finit par représenter l'essentiel des encaissements, ajouter plus tard
l'API Wave directe pour ce canal et garder CinetPay pour le reste.

> Les commissions, les délais de reversement et les pièces demandées à
> l'ouverture évoluent : faites-les confirmer par écrit par le service
> commercial avant de vous engager. Comptez, à titre indicatif, une commission
> de quelques pour cent par transaction Mobile Money et un reversement sous
> quelques jours ouvrés.

---

## 3. Ouvrir le compte marchand CinetPay

1. Créer le compte sur <https://cinetpay.com> et confirmer l'e-mail.
2. Fournir les pièces demandées pour l'activation — en général : pièce
   d'identité du dirigeant, justificatif d'activité (RCCM / DFE ou équivalent)
   et un compte de reversement (compte bancaire ou porte-monnaie marchand).
   La liste exacte est affichée dans le tableau de bord.
3. Déclarer le site (nom, URL de production) : cela crée le **`site_id`**.
4. Relever dans le tableau de bord la **clé API** et le **`site_id`**.
5. Renseigner les URL techniques :
   - notification serveur à serveur : `https://VOTRE-DOMAINE/api/paiement/notification`
   - retour client : `https://VOTRE-DOMAINE/api/paiement/retour`
6. Activer les canaux souhaités (Wave, Orange Money, MTN, Moov, cartes).

---

## 4. Brancher les clés

Dans l'environnement de production (`.env`, Vercel, conteneur…) :

```bash
# Le paiement ne s'active que si cette variable vaut 1
NEXT_PUBLIC_PAIEMENT_ACTIF="1"
NEXT_PUBLIC_PAIEMENT_PRIX="4900"        # F CFA, multiple de 5
NEXT_PUBLIC_PAIEMENT_DUREE_JOURS="30"
NEXT_PUBLIC_SITE_URL="https://votre-domaine.ci"

CINETPAY_API_KEY="…"
CINETPAY_SITE_ID="…"

# Chaîne aléatoire longue : elle signe les accès accordés.
# openssl rand -base64 48
PAIEMENT_SECRET="…"
```

Il n'y a **rien d'autre à écrire** : les quatre routes `/api/paiement/*` sont
déjà en place.

### Vérifier avant d'ouvrir au public

`CINETPAY_BASE_URL` permet de viser un bac à sable ou un simulateur local au
lieu de l'API réelle. Le parcours complet — initiation, retour, vérification,
envoi du PDF — se teste ainsi sans débiter personne.

Contrôles à faire une fois en production, avec un règlement réel de votre
propre poche :

- le débit apparaît bien dans le tableau de bord CinetPay ;
- le PDF arrive sur l'e-mail saisi ;
- un `Ctrl+P` **avant** paiement sort la page « Document verrouillé » ;
- une transaction abandonnée n'ouvre aucun accès.

---

## 5. Livrer le PDF par e-mail

Deux briques, indépendantes du paiement.

### a. L'expéditeur d'e-mails

Au choix, l'une des deux :

```bash
EMAIL_EXPEDITEUR="cv@votre-domaine.ci"   # adresse vérifiée chez le fournisseur
EMAIL_EXPEDITEUR_NOM="IDJÔ CV"

RESEND_API_KEY="…"     # https://resend.com
# ou
BREVO_API_KEY="…"      # https://brevo.com
```

Le domaine de l'expéditeur doit être vérifié (SPF/DKIM) chez le fournisseur,
sinon les messages partent en indésirable — ou ne partent pas du tout.

### b. Le moteur qui fabrique le PDF

Le serveur imprime la page HTML du CV, exactement celle que le client voit.

- **Hébergement classique / VPS / conteneur** : installer Chromium
  (`apt install chromium`) — il est détecté automatiquement. Sinon :

  ```bash
  CHROMIUM_PATH="/usr/bin/chromium"
  ```

- **Hébergement sans serveur (Vercel, Netlify…)** : passer par un service de
  conversion HTTP :

  ```bash
  PDF_API_URL="https://production-sfo.browserless.io/pdf"
  PDF_API_KEY="…"
  PDF_API_FORMAT="browserless"     # ou "pdfshift"
  ```

Sans l'une de ces deux configurations, l'envoi par e-mail se déclare
honnêtement inactif dans l'interface et le client télécharge son PDF
directement : rien ne se casse, et il n'est jamais débité pour un envoi qui
n'aurait pas lieu.

Vérification rapide de l'état du site :

```bash
curl https://votre-domaine.ci/api/envoi-cv
# {"disponible":true}
```

---

## 6. Ce que fait le code

| Fichier | Rôle |
|---|---|
| `src/components/editor/PaiementDialog.tsx` | Fenêtre de coordonnées (e-mail + numéro débité), puis bandeau de retour de paiement |
| `src/lib/paiement.ts` | Tarif, canaux affichés, accès conservé dans le navigateur |
| `src/lib/paiement-serveur.ts` | Dialogue CinetPay, signature HMAC des accès |
| `src/app/api/paiement/initier` | Ouvre la transaction, renvoie l'adresse de paiement |
| `src/app/api/paiement/statut` | Vérifie auprès de CinetPay et délivre le jeton d'accès |
| `src/app/api/paiement/retour` · `notification` | Retour client (GET/POST) et notification serveur à serveur |
| `src/lib/print.ts` → `buildStandaloneHtml` | Page imprimable autonome (styles et polices incorporés) |
| `src/app/api/envoi-cv` | Vérifie l'accès, fabrique le PDF, l'envoie en pièce jointe |
| `src/lib/pdf-serveur.ts` · `src/lib/email.ts` | Moteur PDF et expéditeur d'e-mails |

Règles de sécurité respectées par cette implémentation :

- l'état d'une transaction n'est jamais déduit du retour navigateur ni du corps
  du webhook : il est **relu auprès de CinetPay** ;
- un règlement inférieur au tarif n'ouvre aucun accès ;
- l'accès est un HMAC signé côté serveur, sans base de données ;
- tant que l'accès n'est pas accordé, les copies imprimables ne sont pas dans
  la page : un `Ctrl+P` ne contourne pas le paiement ;
- le HTML reçu par `/api/envoi-cv` est nettoyé et imprimé sans exécution de
  script ;
- la sauvegarde `.json` reste gratuite : ces données appartiennent au client.
