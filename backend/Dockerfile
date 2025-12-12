FROM php:8.3-cli

# Installation des dépendances système
RUN apt-get update && apt-get install -y \
    libzip-dev zip unzip git libicu-dev \
    libpng-dev libjpeg-dev libfreetype6-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo pdo_mysql zip intl gd \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Installation de Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Configuration Composer
ENV COMPOSER_ALLOW_SUPERUSER=1

# Copier TOUT le code source
COPY . .

# Installer TOUTES les dépendances Composer
RUN composer install --no-interaction --prefer-dist --optimize-autoloader

# Créer les dossiers nécessaires
RUN mkdir -p storage var/cache var/log config/jwt \
    && chmod -R 777 storage var config/jwt

EXPOSE 8000

# Préchauffer le cache puis démarrer
CMD php bin/console cache:warmup --no-optional-warmers 2>/dev/null || true && \
    php -S 0.0.0.0:8000 -t public