# Mettre IDJÔ CV en ligne sur Hostinger

Deux chemins possibles, selon l'offre souscrite. Le même code sert aux deux :
il suffit de choisir la commande de construction.

| | Hébergement mutualisé | VPS |
| --- | --- | --- |
| Commande | `npm run build:statique` | `npm run build:vps` |
| Ce qui est mis en ligne | le dossier `out/` | le serveur Node |
| Éditeur, 8 modèles, 24 palettes, 7 doses, 9 polices | oui | oui |
| Export PDF, sauvegarde `.json`, lettre de motivation | oui | oui |
| Assistant de rédaction | générateur local | Claude si `ANTHROPIC_API_KEY` |
| Import d'un CV existant | analyse dans le navigateur | analyse assistée par Claude |
| Formulaire de contact | e-mail / WhatsApp | envoi depuis le site |
| Envoi du CV par e-mail | non | oui |
| Paiement CinetPay | lien + code vérifié dans le navigateur | oui (clés API ou lien + code signé) |
| Enregistrement en base | non | oui |

Aucune de ces différences n'empêche un candidat de faire son CV et de le
télécharger : c'est le cœur du site, et il tient entier dans le navigateur.

---

## 1. Hébergement mutualisé (Web Hosting)

Apache et PHP, pas de Node : le site doit être livré en fichiers déjà
construits. C'est `npm run build:statique` qui les produit, dans `out/`.

### Construire

```bash
cp .env.example .env          # renseignez au moins NEXT_PUBLIC_SITE_URL
npm ci
npm run build:statique
```

Le script écarte les routes `/api` le temps du build (elles n'ont pas de sens
sans serveur), les remet en place ensuite, et dépose `.htaccess` dans `out/`.

### Déposer — par le gestionnaire de fichiers

1. hPanel → **Fichiers** → **Gestionnaire de fichiers**.
2. Ouvrez `public_html` et videz-le de son contenu de démonstration.
3. Envoyez **le contenu** de `out/` (pas le dossier lui-même) : `index.html`,
   `_next/`, `.htaccess` compris.
4. Vérifiez que `.htaccess` est bien là : le gestionnaire masque parfois les
   fichiers commençant par un point (menu **Paramètres → Afficher les fichiers
   cachés**).

### Déposer — automatiquement, par Git

Le dépôt contient un automate GitHub (`.github/workflows/hostinger-statique.yml`)
qui reconstruit le site à chaque envoi sur `main` et publie le résultat sur la
branche **`hostinger`**. Cette branche ne contient que le site construit, prêt
à servir.

1. Dans GitHub : **Settings → Secrets and variables → Actions → Variables**,
   ajoutez `NEXT_PUBLIC_SITE_URL` (par exemple `https://idjocv.ci`) et, si vous
   le souhaitez, les autres variables `NEXT_PUBLIC_*` listées dans
   `.env.example`.
2. Dans hPanel : **Site web → Git**, dépôt
   `https://github.com/idjocommunication/idjo-cv-claude`, branche `hostinger`,
   répertoire `public_html`.
3. À chaque nouvelle version : bouton **Déployer**.

> L'automate réécrit l'historique de la branche `hostinger` à chaque
> construction : elle ne grossit pas avec le temps. N'y travaillez jamais à la
> main, tout y serait écrasé.

### Après la mise en ligne

- Activez le SSL dans hPanel (**Sécurité → SSL**), puis décommentez le bloc
  HTTPS en tête du `.htaccess`. Le faire avant couperait le site.
- Vérifiez `https://votre-domaine/sitemap.xml` et `/robots.txt`.
- Le fichier `version.txt` à la racine indique la date de construction en
  ligne : pratique pour vérifier qu'un déploiement est bien passé.

---

## 2. VPS

Une machine à vous : le site tourne entier, routes serveur comprises.

### Préparer la machine (une fois)

```bash
# Node 20 et Nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx git

# Utilisateur dédié et arborescence
sudo adduser --system --group --home /var/www/idjo-cv idjo
sudo mkdir -p /var/www/idjo-cv/{depot,partage,versions}
sudo chown -R idjo:idjo /var/www/idjo-cv

# Code et réglages
sudo -u idjo git clone https://github.com/idjocommunication/idjo-cv-claude \
  /var/www/idjo-cv/depot
sudo -u idjo cp /var/www/idjo-cv/depot/.env.example /var/www/idjo-cv/partage/.env
sudo -u idjo nano /var/www/idjo-cv/partage/.env        # secrets et réglages
sudo chmod 600 /var/www/idjo-cv/partage/.env
```

`PAIEMENT_SECRET` doit être une longue chaîne aléatoire, propre à ce serveur :

```bash
openssl rand -hex 32
```

### Installer le service et la façade web

```bash
cd /var/www/idjo-cv/depot
sudo cp deploiement/hostinger/idjo-cv.service /etc/systemd/system/
sudo systemctl daemon-reload

sudo cp deploiement/hostinger/nginx-idjo-cv.conf /etc/nginx/sites-available/idjo-cv
sudo ln -s /etc/nginx/sites-available/idjo-cv /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Certificat HTTPS (remplacez le domaine)
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d idjocv.ci -d www.idjocv.ci
```

Ouvrez le pare-feu si nécessaire : `sudo ufw allow 'Nginx Full'`.

### Déployer

```bash
sudo -u idjo /var/www/idjo-cv/depot/deploiement/hostinger/deployer-vps.sh main
```

Le script récupère le code, construit, installe la version dans un dossier
daté, bascule le lien `courant` dessus, redémarre le service et **vérifie que
le site répond** avant de conserver la version. En cas d'échec, il l'annonce
et rappelle la commande de retour arrière ; les trois dernières versions
restent sur disque.

Surveillance et dépannage :

```bash
systemctl status idjo-cv
journalctl -u idjo-cv -f
```

### Options du VPS

- **Base PostgreSQL** (facultative — l'éditeur fonctionne sans) :
  renseignez `DATABASE_URL`, puis `npx prisma db push` depuis le dépôt.
- **Export PDF côté serveur**, nécessaire à l'envoi par e-mail :
  `sudo apt-get install -y chromium` puis `CHROMIUM_PATH=/usr/bin/chromium`.
- **Paiement CinetPay** : renseignez les clés du compte marchand, puis
  `NEXT_PUBLIC_PAIEMENT_ACTIF=1`. Déclarez l'URL de notification
  `https://votre-domaine/api/paiement/notification` dans le tableau de bord
  CinetPay. Tant que ces variables sont vides, le téléchargement reste libre.

---

## 3. Hébergement Node.js Hostinger — paiement automatique par l'API CinetPay

C'est le mode qui permet un paiement **sans intervention** : le client paie
chez CinetPay, revient sur le site, l'accès s'ouvre seul. Il exige un
serveur Node, parce que la clé et le mot de passe CinetPay ne doivent jamais
atteindre le navigateur.

### Comment le site idjôcv.com est relié aujourd'hui

- Le site est déclaré « Node.js » chez Hostinger et **relié au dépôt GitHub** :
  chaque mise à jour de la branche `main` relance une construction Node
  (Node 22, type « next », script `build`).
- Les mises en ligne récentes ont été faites en **export statique** par-dessus,
  avec le `.htaccess` de ce dossier : c'est lui qui est servi.
- Aucune variable d'environnement n'est réglée côté Node.

> Tant que la bascule n'est pas faite, **ne fusionnez rien dans `main`** : la
> construction automatique écraserait l'export statique avec un serveur sans
> variables, donc sans paiement (téléchargement libre), et le `.htaccess`
> statique resté en place pourrait l'empêcher de répondre.

### Avant la bascule

1. **CinetPay** : passer le compte en production, relever la clé `sk_live_…`
   et le mot de passe API, recréer le lien de paiement en production.
2. **Liste blanche CinetPay** : y ajouter l'adresse IP **de sortie** du
   serveur, celle que CinetPay voit : `46.202.172.231` en octobre 2026. Elle
   diffère de l'adresse publique du site (`193.203.168.199`). Les appels
   partent en IPv4 ; si CinetPay refuse un jour le serveur (changement de
   machine chez Hostinger), le journal Node.js affiche la nouvelle adresse à
   déclarer : « CinetPay refuse l'adresse IP de ce serveur (x.x.x.x) ».
3. **Variables d'environnement** (hPanel → Sites → Node.js → Variables
   d'environnement), à saisir **vous-même** dans hPanel plutôt qu'à faire
   circuler par message :

   | Variable | Valeur |
   | --- | --- |
   | `NEXT_PUBLIC_SITE_URL` | `https://xn--idjcv-8ta.com` (adresse publique exacte, sert aux retours CinetPay) |
   | `NEXT_PUBLIC_PAIEMENT_ACTIF` | `1` |
   | `NEXT_PUBLIC_PAIEMENT_PRIX` | `500` (= montant facturé par téléchargement) |
   | `NEXT_PUBLIC_PAIEMENT_LIEN` | lien CinetPay de production (repli) |
   | `PAIEMENT_SECRET` | longue chaîne aléatoire (`openssl rand -base64 48`) |
   | `CINETPAY_API_KEY` | `sk_live_…` |
   | `CINETPAY_API_PASSWORD` | mot de passe API CinetPay |
   | `NEXT_PUBLIC_CONTACT_EMAIL` | adresse de contact |

   Les `NEXT_PUBLIC_*` sont figées à la construction : régler les variables
   **avant** de lancer la construction.
4. **URL de notification** dans CinetPay :
   `https://xn--idjcv-8ta.com/api/paiement/notification`.

### La bascule

1. Fusionner la branche de travail dans `main` : Hostinger reconstruit le
   serveur Node automatiquement.
2. Vérifier que le site répond en mode serveur :
   `curl https://xn--idjcv-8ta.com/api/paiement/initier` doit renvoyer
   `"fournisseurs":["cinetpay"]`. Un 404 signifie que l'ancien `.htaccess`
   statique est encore servi : le retirer de `public_html` et relancer la
   construction depuis hPanel.
3. Faire un paiement réel de 500 F de sa poche et vérifier : débit visible chez
   CinetPay, retour sur l'éditeur, « Paiement confirmé », PDF déverrouillé.

En cas de souci, revenir à l'export statique (section 1) remet le site dans
l'état actuel, avec le lien de paiement et les codes d'accès.

---

## Avant d'ouvrir le site au public

Deux points que le code ne peut pas décider à votre place :

- `src/data/marketing.ts` contient des **témoignages de démonstration** :
  remplacez-les par de vrais retours clients, ou retirez-les.
- `src/lib/seo.tsx` et les mentions légales portent des **coordonnées de
  remplacement** : e-mail, téléphone, hébergeur déclaré. Renseignez les
  variables `NEXT_PUBLIC_*` correspondantes.

### Empreintes des codes d'accès

`deploiement/hostinger/empreintes-codes.txt` contient les empreintes SHA-256
des codes d'accès déjà remis aux clients. Elles sont publiques par nature (le
site les embarque) et ne permettent pas de retrouver les codes. Pour
reconstruire l'export statique sans les perdre :

```bash
NEXT_PUBLIC_PAIEMENT_ACTIF=1 \
NEXT_PUBLIC_PAIEMENT_LIEN="https://pay.cinetpay.net/link/…" \
NEXT_PUBLIC_PAIEMENT_CODES_HASH="$(cat deploiement/hostinger/empreintes-codes.txt)" \
npm run build:statique
```

En mode serveur, la même variable garde ces codes valables. Chaque code n'ouvre
qu'un téléchargement : le serveur note l'empreinte des codes utilisés dans son
registre (`PAIEMENT_REGISTRE`, par défaut `~/.idjo-cv/registre-telechargements.txt`).
En export statique, sans serveur, le navigateur ne peut pas savoir qu'un code a
déjà servi ailleurs : un code ressaisi rouvre un téléchargement.
