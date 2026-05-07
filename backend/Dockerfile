FROM php:8.3-fpm

# Installer les dépendances système
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libjpeg-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    libzip-dev \
    nginx \
    && docker-php-ext-configure gd --with-jpeg \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Installer Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Configurer PHP pour les uploads de gros fichiers
RUN echo "upload_max_filesize = 2G" >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo "post_max_size = 2G" >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo "max_execution_time = 1800" >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo "max_input_time = 1800" >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo "memory_limit = 512M" >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo "upload_tmp_dir = /var/www/html/var/tmp" >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo "output_buffering = 4096" >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo "display_errors = Off" >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo "log_errors = On" >> /usr/local/etc/php/conf.d/uploads.ini \
    && mkdir -p /var/www/html/var/tmp \
    && chown -R www-data:www-data /var/www/html/var/tmp \
    && chmod 755 /var/www/html/var/tmp

# Créer le répertoire de travail
WORKDIR /var/www/html

# Copier la configuration Nginx
COPY docker/nginx.conf /etc/nginx/sites-available/default

# Créer les répertoires nécessaires avec les bonnes permissions
RUN mkdir -p /var/www/html/var/cache \
    && mkdir -p /var/www/html/var/log \
    && mkdir -p /var/www/html/var/sessions \
    && mkdir -p /var/www/html/var/tmp \
    && mkdir -p /var/www/html/storage \
    && mkdir -p /var/www/html/public/uploads/avatars \
    && chown -R www-data:www-data /var/www/html \
    && chmod -R 775 /var/www/html/var \
    && chmod -R 775 /var/www/html/storage \
    && chmod -R 775 /var/www/html/public/uploads

# Exposer le port 8000
EXPOSE 8000

# Copier le script de démarrage
COPY docker/start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

# Démarrer PHP-FPM et Nginx
CMD ["/usr/local/bin/start.sh"]