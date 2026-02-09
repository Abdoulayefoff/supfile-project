# Base PHP CLI avec extensions nécessaires
FROM php:8.2-cli

RUN apt-get update && apt-get install -y \
    git unzip libzip-dev libicu-dev \
    && docker-php-ext-install pdo pdo_mysql intl zip

# Installer Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

COPY . .

# Installer les dépendances PHP
RUN composer install

# Lancer le serveur intégré Symfony
CMD php -S 0.0.0.0:8000 -t public
