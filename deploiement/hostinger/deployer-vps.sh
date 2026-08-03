#!/usr/bin/env bash
#
# Déploiement du site sur un VPS Hostinger.
#
# Chaque mise en ligne est construite dans un dossier daté, puis « courant »
# bascule dessus d'un seul coup : le site ne sert jamais un build à moitié
# copié, et revenir à la version précédente tient en un changement de lien.
#
#   ./deploiement/hostinger/deployer-vps.sh            # branche par défaut
#   ./deploiement/hostinger/deployer-vps.sh main       # une branche précise
#
# Prérequis sur le VPS : git, Node 20+, npm, et le service idjo-cv installé
# (voir deploiement/README.md).

set -euo pipefail

BRANCHE="${1:-main}"
RACINE="${IDJO_RACINE:-/var/www/idjo-cv}"
DEPOT="${IDJO_DEPOT:-$RACINE/depot}"
PARTAGE="$RACINE/partage"
COURANT="$RACINE/courant"
VERSION="$RACINE/versions/$(date +%Y%m%d-%H%M%S)"
GARDER=3

echo "→ Déploiement de la branche $BRANCHE dans $VERSION"

# --- Code -------------------------------------------------------------------
if [ ! -d "$DEPOT/.git" ]; then
  echo "Dépôt absent dans $DEPOT — clonez-le d'abord (voir deploiement/README.md)." >&2
  exit 1
fi

git -C "$DEPOT" fetch --prune origin
git -C "$DEPOT" checkout "$BRANCHE"
git -C "$DEPOT" reset --hard "origin/$BRANCHE"

# --- Construction -----------------------------------------------------------
cd "$DEPOT"

if [ ! -f "$PARTAGE/.env" ]; then
  echo "Fichier $PARTAGE/.env absent : copiez .env.example et renseignez-le." >&2
  exit 1
fi

# Les variables NEXT_PUBLIC_* sont figées à la construction : le build doit
# donc voir le même fichier que le service.
set -a
# shellcheck disable=SC1091
. "$PARTAGE/.env"
set +a

npm ci
SORTIE=standalone npm run build

# --- Mise en place ----------------------------------------------------------
mkdir -p "$VERSION"
cp -r .next/standalone/. "$VERSION/"
# Le build standalone n'embarque ni les fichiers publics ni les ressources
# statiques : sans cette copie, le site sort sans styles ni images.
mkdir -p "$VERSION/.next"
cp -r .next/static "$VERSION/.next/static"
cp -r public "$VERSION/public"

ln -sfn "$VERSION" "$COURANT.nouveau"
mv -Tf "$COURANT.nouveau" "$COURANT"

sudo systemctl restart idjo-cv

# --- Vérification -----------------------------------------------------------
echo "→ Attente de la réponse du site…"
for _ in $(seq 1 30); do
  if curl -fsS -o /dev/null "http://127.0.0.1:${PORT:-3000}/"; then
    echo "✓ En ligne : $(basename "$VERSION")"
    # Ménage : on garde les dernières versions pour pouvoir revenir en arrière.
    ls -1dt "$RACINE"/versions/*/ | tail -n +$((GARDER + 1)) | xargs -r rm -rf
    exit 0
  fi
  sleep 2
done

echo "✗ Le site ne répond pas après 60 s. Journal : journalctl -u idjo-cv -n 50" >&2
echo "  Pour revenir en arrière : ln -sfn <version précédente> $COURANT && sudo systemctl restart idjo-cv" >&2
exit 1
