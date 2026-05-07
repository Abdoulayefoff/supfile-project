#!/bin/sh
set -e

echo "==> Création du .env de production..."
cat > /var/www/html/.env << EOF
APP_ENV=prod
APP_SECRET=${APP_SECRET}
EOF

echo "==> Configuration des clés JWT..."
mkdir -p config/jwt

if [ -n "$JWT_PRIVATE_KEY_BASE64" ] && [ -n "$JWT_PUBLIC_KEY_BASE64" ]; then
    echo "$JWT_PRIVATE_KEY_BASE64" | base64 -d > config/jwt/private.pem
    echo "$JWT_PUBLIC_KEY_BASE64"  | base64 -d > config/jwt/public.pem
    # PHP-FPM runs as www-data — it must be able to read the private key
    chmod 640 config/jwt/private.pem
    chmod 644 config/jwt/public.pem
    chown www-data:www-data config/jwt/private.pem config/jwt/public.pem
    echo "    Clés JWT chargées depuis les variables d'environnement."
elif [ ! -f config/jwt/private.pem ]; then
    php bin/console lexik:jwt:generate-keypair --env=prod
    chown www-data:www-data config/jwt/private.pem config/jwt/public.pem
    chmod 640 config/jwt/private.pem
    chmod 644 config/jwt/public.pem
    echo "    AVERTISSEMENT : Clés JWT générées (éphémères)."
else
    chown www-data:www-data config/jwt/private.pem config/jwt/public.pem
    chmod 640 config/jwt/private.pem
    chmod 644 config/jwt/public.pem
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