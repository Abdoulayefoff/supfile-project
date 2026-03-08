#!/bin/bash

# Script de démarrage automatique pour le projet
# Ce script automatise toutes les étapes nécessaires pour lancer le projet

set -e  # Arrêter en cas d'erreur pour les commandes critiques

echo " _________ Démarrage __________"
echo ""

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier que .env.example existe
if [ ! -f ".env.example" ]; then
    error "Le fichier .env.example n'existe pas !"
    error "Ce fichier template est nécessaire pour créer .env"
    exit 1
fi

# Créer .env s'il n'existe pas
if [ ! -f ".env" ]; then
    warn "Le fichier .env n'existe pas. Création automatique depuis .env.example..."
    cp .env.example .env
    info "Fichier .env créé !"
fi

# Charger les variables d'environnement depuis .env
info "Chargement des variables d'environnement depuis .env..."
set -a  # Export automatiquement toutes les variables
source .env
set +a

# Fonction pour générer un secret aléatoire
generate_secret() {
    openssl rand -hex 32
}

# Fonction pour remplacer une variable dans .env
replace_in_env() {
    local var_name=$1
    local new_value=$2
    
    # Échapper les caractères spéciaux pour sed
    local escaped_value=$(echo "$new_value" | sed 's/[&/\]/\\&/g')
    
    # Remplacer la valeur dans .env
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|^${var_name}=.*|${var_name}=${escaped_value}|" .env
    else
        # Linux
        sed -i "s|^${var_name}=.*|${var_name}=${escaped_value}|" .env
    fi
}

# Vérifier et générer automatiquement les secrets si nécessaire
info "Vérification et génération automatique des secrets..."

SECRETS_GENERATED=0

# Générer APP_SECRET si nécessaire
if [ -z "$APP_SECRET" ] || [ "$APP_SECRET" = "change_me" ]; then
    warn "APP_SECRET non configuré. Génération automatique..."
    NEW_APP_SECRET=$(generate_secret)
    replace_in_env "APP_SECRET" "$NEW_APP_SECRET"
    APP_SECRET=$NEW_APP_SECRET
    SECRETS_GENERATED=1
    info "APP_SECRET généré "
fi

# Générer JWT_PASSPHRASE si nécessaire
if [ -z "$JWT_PASSPHRASE" ] || [ "$JWT_PASSPHRASE" = "change_me" ] || [ "$JWT_PASSPHRASE" = "change_me" ]; then
    warn "JWT_PASSPHRASE non configuré. Génération automatique..."
    NEW_JWT_PASSPHRASE=$(generate_secret)
    replace_in_env "JWT_PASSPHRASE" "$NEW_JWT_PASSPHRASE"
    JWT_PASSPHRASE=$NEW_JWT_PASSPHRASE
    SECRETS_GENERATED=1
    info "JWT_PASSPHRASE généré "
fi

# Générer MYSQL_ROOT_PASSWORD si nécessaire
if [ -z "$MYSQL_ROOT_PASSWORD" ] || [ "$MYSQL_ROOT_PASSWORD" = "change_me" ]; then
    warn "MYSQL_ROOT_PASSWORD non configuré. Génération automatique..."
    NEW_MYSQL_ROOT_PASSWORD=$(generate_secret)
    replace_in_env "MYSQL_ROOT_PASSWORD" "$NEW_MYSQL_ROOT_PASSWORD"
    MYSQL_ROOT_PASSWORD=$NEW_MYSQL_ROOT_PASSWORD
    SECRETS_GENERATED=1
    info "MYSQL_ROOT_PASSWORD généré "
fi

# Générer MYSQL_PASSWORD si nécessaire
if [ -z "$MYSQL_PASSWORD" ] || [ "$MYSQL_PASSWORD" = "change_me" ]; then
    warn "MYSQL_PASSWORD non configuré. Génération automatique..."
    NEW_MYSQL_PASSWORD=$(generate_secret)
    replace_in_env "MYSQL_PASSWORD" "$NEW_MYSQL_PASSWORD"
    MYSQL_PASSWORD=$NEW_MYSQL_PASSWORD
    SECRETS_GENERATED=1
    info "MYSQL_PASSWORD généré "
fi

if [ $SECRETS_GENERATED -eq 1 ]; then
    info " Secrets générés et sauvegardés dans .env"
    info " Le fichier .env contient maintenant vos secrets. Ne le commitez JAMAIS sur Git !"
    echo ""
    # Recharger .env pour avoir les nouvelles valeurs
    set -a
    source .env
    set +a
fi

# Détection automatique de HOST_IP pour le frontend mobile
info "Détection automatique de l'IP de l'hôte..."

# Fonction pour détecter l'IP locale
detect_host_ip() {
    local detected_ip=""
    
    # Essayer différentes méthodes selon l'OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        detected_ip=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        detected_ip=$(hostname -I | awk '{print $1}')
        
        # Si hostname -I ne fonctionne pas, essayer ip addr
        if [ -z "$detected_ip" ]; then
            detected_ip=$(ip addr show | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | cut -d'/' -f1 | head -n 1)
        fi
    else
        # Méthode générique (WSL, autres Unix)
        detected_ip=$(hostname -I 2>/dev/null | awk '{print $1}')
        
        # Fallback avec ip addr
        if [ -z "$detected_ip" ]; then
            detected_ip=$(ip addr show 2>/dev/null | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | cut -d'/' -f1 | head -n 1)
        fi
    fi
    
    echo "$detected_ip"
}

# Détecter l'IP
DETECTED_IP=$(detect_host_ip)

if [ -n "$DETECTED_IP" ]; then
    info "IP détectée : $DETECTED_IP"
    
    # Vérifier si HOST_IP est déjà configuré avec une vraie IP
    if [ -z "$HOST_IP" ] || [ "$HOST_IP" = "192.168.1.100" ] || [ "$HOST_IP" = "localhost" ]; then
        warn "HOST_IP non configuré ou valeur par défaut. Configuration automatique..."
        replace_in_env "HOST_IP" "$DETECTED_IP"
        
        # Mettre à jour EXPO_PUBLIC_API_URL avec la nouvelle IP
        NEW_EXPO_URL="http://${DETECTED_IP}:8000/api"
        replace_in_env "EXPO_PUBLIC_API_URL" "$NEW_EXPO_URL"
        
        HOST_IP=$DETECTED_IP
        info "HOST_IP configuré : $DETECTED_IP "
        info "EXPO_PUBLIC_API_URL configuré : $NEW_EXPO_URL "
        
        # Recharger .env
        set -a
        source .env
        set +a
    else
        info "HOST_IP déjà configuré : $HOST_IP "
    fi
else
    warn "Impossible de détecter automatiquement l'IP locale"
    warn "Utilisation de la valeur dans .env : ${HOST_IP:-localhost}"
    
    if [ "$HOST_IP" = "192.168.1.100" ] || [ "$HOST_IP" = "localhost" ]; then
        warn "HOST_IP utilise une valeur par défaut"
        warn "Pour le frontend mobile, configurez manuellement HOST_IP dans .env"
        warn "Trouvez votre IP avec : hostname -I (Linux) ou ifconfig (macOS)"
    fi
fi

echo ""

# Créer backend/.env s'il n'existe pas
info "Configuration du backend Symfony..."

if [ ! -f "backend/.env" ]; then
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        info "Fichier backend/.env créé depuis backend/.env.example "
    else
        # Créer un .env minimal pour Symfony
        cat > backend/.env <<'EOF'
###> symfony/framework-bundle ###
APP_ENV=dev
# APP_SECRET injecté par Docker Compose depuis .env racine
###< symfony/framework-bundle ###

###> doctrine/doctrine-bundle ###
# DATABASE_URL injecté par Docker Compose depuis .env racine
###< doctrine/doctrine-bundle ###

###> lexik/jwt-authentication-bundle ###
JWT_SECRET_KEY=%kernel.project_dir%/config/jwt/private.pem
JWT_PUBLIC_KEY=%kernel.project_dir%/config/jwt/public.pem
# JWT_PASSPHRASE injecté par Docker Compose depuis .env racine
###< lexik/jwt-authentication-bundle ###

###> nelmio/cors-bundle ###
CORS_ALLOW_ORIGIN='^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$'
###< nelmio/cors-bundle ###
EOF
        info "Fichier backend/.env créé "
    fi
else
    info "Fichier backend/.env existe déjà "
fi

# Vérifier que les variables critiques sont maintenant définies
info "Vérification finale des variables d'environnement..."

REQUIRED_VARS=(
    "MYSQL_ROOT_PASSWORD"
    "MYSQL_DATABASE"
    "MYSQL_USER"
    "MYSQL_PASSWORD"
    "APP_SECRET"
    "JWT_PASSPHRASE"
)

MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    error "Les variables suivantes sont toujours manquantes dans .env :"
    for var in "${MISSING_VARS[@]}"; do
        error "  - $var"
    done
    error ""
    error "Veuillez éditer le fichier .env et configurer ces variables."
    exit 1
fi

info "Variables d'environnement validées "

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    error "Docker n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

if ! command -v docker compose &> /dev/null; then
    error "Docker Compose n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

info "Vérification des prérequis... "

# Étape 1 : Démarrer les conteneurs
info "Étape 1/7 : Démarrage des conteneurs Docker..."

# Rebuild les images si nécessaire
if [ "$1" == "--rebuild" ] || [ "$1" == "-r" ]; then
    info "Reconstruction complète des images Docker..."
    docker compose build --no-cache
else
    # Vérifier si les images existent
    info "Vérification des images Docker..."
    set +e
    IMAGE_API_EXISTS=$(docker images -q supfile-project-api 2>/dev/null)
    IMAGE_WEB_EXISTS=$(docker images -q supfile-project-web 2>/dev/null)
    set -e
    
    if [ -z "$IMAGE_API_EXISTS" ] || [ -z "$IMAGE_WEB_EXISTS" ]; then
        warn "Les images Docker n'existent pas. Construction automatique..."
        info "Cette étape peut prendre plusieurs minutes lors de la première installation..."
        docker compose build
        info "Images Docker construites "
    else
        info "Images Docker trouvées "
    fi
fi

info "Démarrage des conteneurs..."
docker compose up -d

# Attendre que les conteneurs soient prêts
info "Attente du démarrage des conteneurs..."
sleep 5

# Vérifier que les conteneurs sont démarrés
if ! docker compose ps | grep -q "Up"; then
    error "Les conteneurs ne sont pas démarrés correctement."
    exit 1
fi

info "Conteneurs démarrés "

# Créer les dossiers de stockage nécessaires
# Ces dossiers sont ignorés par Git mais doivent exister
# pour que les uploads PHP fonctionnent correctement
info "Création des dossiers de stockage..."
mkdir -p backend/storage
mkdir -p backend/var/tmp
chmod 777 backend/var/tmp
info "Dossiers de stockage créés "

# Étape 2 : Installer les dépendances backend
info "Étape 2/7 : Installation des dépendances backend..."
set +e  # Désactiver set -e temporairement
if ! docker compose exec -T api composer install --no-interaction; then
    warn "Erreur lors de l'installation des dépendances. Réessayez..."
    docker compose exec api composer install --no-interaction
    if [ $? -ne 0 ]; then
        error "Impossible d'installer les dépendances backend. Vérifiez les logs."
        exit 1
    fi
fi
set -e  # Réactiver set -e
info "Dépendances backend installées "

info "Vider le cache Symfony..."
docker compose exec -T api php bin/console cache:clear
info "Cache Symfony vidé "


# Étape 3 : Générer les clés JWT
info "Étape 3/7 : Génération des clés JWT..."

docker compose exec -T api mkdir -p config/jwt
docker compose exec -T api chmod -R 777 config/jwt 2>/dev/null || true

if docker compose exec -T api php bin/console lexik:jwt:generate-keypair --skip-if-exists 2>/dev/null; then
    info "Clés JWT générées "
else
    docker compose exec -T api php bin/console lexik:jwt:generate-keypair --no-interaction 2>/dev/null || warn "Les clés JWT existent déjà"
fi

# Étape 4 : Configuration de la base de données MySQL
info "Étape 4/7 : Configuration de la base de données MySQL..."

# Attendre que MySQL soit prêt
info "Attente que MySQL soit prêt..."
MYSQL_READY=0
for i in {1..15}; do
    set +e
    docker compose exec -T database mysqladmin ping -h localhost --silent 2>/dev/null
    if [ $? -eq 0 ]; then
        MYSQL_READY=1
        break
    fi
    set -e
    sleep 2
done

if [ $MYSQL_READY -eq 0 ]; then
    error "MySQL n'est pas prêt après 30 secondes. Vérifiez les logs : docker compose logs database"
    exit 1
fi

info "MySQL est prêt "

# Créer la base de données
info "Création de la base de données '$MYSQL_DATABASE'..."
set +e
docker compose exec -T database mysql -uroot -p"$MYSQL_ROOT_PASSWORD" <<EOF 2>/dev/null
CREATE DATABASE IF NOT EXISTS $MYSQL_DATABASE CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EOF
set -e
info "Base de données créée "

# Créer l'utilisateur MySQL
info "Configuration de l'utilisateur MySQL '$MYSQL_USER'..."
set +e
docker compose exec -T database mysql -uroot -p"$MYSQL_ROOT_PASSWORD" <<EOF 2>/dev/null
DROP USER IF EXISTS '$MYSQL_USER'@'%';
CREATE USER '$MYSQL_USER'@'%' IDENTIFIED BY '$MYSQL_PASSWORD';
GRANT ALL PRIVILEGES ON $MYSQL_DATABASE.* TO '$MYSQL_USER'@'%';
FLUSH PRIVILEGES;
EOF
set -e
info "Utilisateur MySQL configuré "

# Étape 5 : Exécuter les migrations
info "Étape 5/7 : Exécution des migrations..."
sleep 2

set +e
docker compose exec -T api php bin/console doctrine:migrations:migrate --no-interaction 2>&1
MIGRATION_RESULT=$?
set -e

if [ $MIGRATION_RESULT -ne 0 ]; then
    warn "Les migrations ont échoué (peut-être déjà exécutées)"
else
    info "Migrations exécutées "
fi

# Étape 6 : Installer les dépendances frontend web
info "Étape 6/7 : Installation des dépendances frontend web..."

sleep 3

if ! docker compose ps web | grep -q "Up"; then
    docker compose up -d web
    sleep 5
fi

if ! docker compose exec -T web test -d /app/node_modules 2>/dev/null; then
    docker compose exec -T web npm install --legacy-peer-deps
else
    info "Dépendances frontend web déjà présentes "
fi

# Étape 7 : Vérification finale
info "Étape 7/7 : Vérification finale..."

sleep 3

info "État des conteneurs :"
docker compose ps

echo ""
info "Installation terminée avec succès !"
echo ""
echo "Accès aux services :"
echo "   - Frontend Web      : http://localhost:3000"
echo "   - Backend API       : http://localhost:8000/api"
echo "   - MySQL             : localhost:3307"
echo ""
echo "Commandes utiles :"
echo "   - Voir les logs     : docker compose logs -f"
echo "   - Arrêter           : docker compose down"
echo "   - Redémarrer        : docker compose restart"
echo "   - Reconstruction    : ./start.sh --rebuild"
echo ""
echo "En cas de problème :"
echo "   - Vérifiez que Docker Desktop est en cours d'exécution"
echo "   - Consultez les logs : docker compose logs -f"
echo ""