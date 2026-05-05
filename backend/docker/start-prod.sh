#!/bin/sh
set -e

# CLÉS JWT
#
# IMPORTANT : Les containers Azure App Service sont éphémères.
# Si on génère les clés à chaque démarrage, tous les utilisateurs sont
# déconnectés à chaque redéploiement (leurs tokens JWT deviennent invalides).
#
# Solution : stocker les clés en base64 dans les variables d'environnement
# JWT_PRIVATE_KEY_BASE64 et JWT_PUBLIC_KEY_BASE64
echo "==> Configuration des clés JWT..."
mkdir -p config/jwt

if [ -n "$JWT_PRIVATE_KEY_BASE64" ] && [ -n "$JWT_PUBLIC_KEY_BASE64" ]; then
    # Clés persistantes depuis les variables d'environnement (RECOMMANDÉ)
    echo "$JWT_PRIVATE_KEY_BASE64" | base64 -d > config/jwt/private.pem
    echo "$JWT_PUBLIC_KEY_BASE64"  | base64 -d > config/jwt/public.pem
    chmod 600 config/jwt/private.pem
    echo "    Clés JWT chargées depuis les variables d'environnement."
elif [ ! -f config/jwt/private.pem ]; then
    # Génération temporaire — les sessions seront perdues à chaque redémarrage
    php bin/console lexik:jwt:generate-keypair --env=prod
    echo "    AVERTISSEMENT : Clés JWT générées (éphémères)."
    echo "    Configure JWT_PRIVATE_KEY_BASE64 et JWT_PUBLIC_KEY_BASE64 (voir guide section 10.3)."
else
    echo "    Clés JWT déjà présentes."
fi

echo "==> Compilation du cache Symfony..."
php bin/console cache:clear --env=prod --no-debug
php bin/console cache:warmup --env=prod --no-debug

echo "==> Exécution des migrations (avec retry si la DB n'est pas prête)..."
RETRY=0
MAX_RETRY=20
until php bin/console doctrine:migrations:migrate --no-interaction --env=prod; do
    RETRY=$((RETRY + 1))
    if [ "$RETRY" -ge "$MAX_RETRY" ]; then
        echo "ERREUR : Impossible d'atteindre la base de données après $MAX_RETRY tentatives."
        exit 1
    fi
    echo "    Base de données non prête. Tentative $RETRY/$MAX_RETRY dans 5s..."
    sleep 5
done

echo "==> Ajustement des permissions..."
chown -R www-data:www-data var/ storage/ 2>/dev/null || true

echo "==> Démarrage de PHP-FPM..."
php-fpm -D

echo "==> Démarrage de Nginx (foreground)..."
exec nginx -g 'daemon off;'