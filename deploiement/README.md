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
| Paiement CinetPay | non | oui |
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

## Avant d'ouvrir le site au public

Deux points que le code ne peut pas décider à votre place :

- `src/data/marketing.ts` contient des **témoignages de démonstration** :
  remplacez-les par de vrais retours clients, ou retirez-les.
- `src/lib/seo.tsx` et les mentions légales portent des **coordonnées de
  remplacement** : e-mail, téléphone, hébergeur déclaré. Renseignez les
  variables `NEXT_PUBLIC_*` correspondantes.
