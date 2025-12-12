FROM php:8.3-cli

# ==========================================
# Installation des dépendances système
# ==========================================
RUN apt-get update && apt-get install -y \
    # Dépendances de base
    libzip-dev \
    zip \
    unzip \
    git \
    libicu-dev \
    # Dépendances pour GD (images - pour bonus miniatures)
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    # Nettoyage
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo pdo_mysql zip intl gd \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# ==========================================
# Installation de Composer
# ==========================================
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# ==========================================
# Configuration du répertoire de travail
# ==========================================
WORKDIR /var/www/html

# ==========================================
# Copie et installation des dépendances
# ==========================================
# Copier composer.json et composer.lock en premier (cache Docker)
COPY composer.json composer.lock ./

# Installation des dépendances Composer
ENV COMPOSER_ALLOW_SUPERUSER=1
RUN composer install --no-scripts --no-autoloader --prefer-dist --no-dev --optimize-autoloader || true

# ==========================================
# Copie du reste de l'application
# ==========================================
COPY . .

# ==========================================
# Finalisation de l'installation Composer
# ==========================================
RUN composer dump-autoload --optimize

# ==========================================
# Création et permissions des dossiers
# ==========================================
RUN mkdir -p storage var/cache var/log config/jwt \
    && chmod -R 777 storage var config/jwt

# ==========================================
# Exposition du port
# ==========================================
EXPOSE 8000

# ==========================================
# Commande de démarrage
# ==========================================
CMD ["php", "-S", "0.0.0.0:8000", "-t", "public"]