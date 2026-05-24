# SUPFile — Plateforme de Stockage Cloud Collaboratif

<div align="center">

![Symfony](https://img.shields.io/badge/Symfony-7.4_LTS-000000?style=flat-square&logo=symfony&logoColor=white)
![PHP](https://img.shields.io/badge/PHP-8.3-777BB4?style=flat-square&logo=php&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?style=flat-square&logo=react&logoColor=black)
![Expo](https://img.shields.io/badge/Expo_SDK-54-000020?style=flat-square&logo=expo&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat-square&logo=mysql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)
![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF?style=flat-square&logo=github-actions&logoColor=white)

**Projet 4PROJ — SUPINFO 2025–2026**

[🌐 Application Web](https://www.supfile-cloud.fr) · [📡 API](https://api.supfile-cloud.fr/api) · [📖 Documentation](./docs/documentation_technique.tex) · [📋 Manuel Utilisateur](./manuel_utilisateur.tex)

</div>

---

## Présentation

SUPFile est une plateforme de **stockage cloud personnel et collaboratif**, développée en équipe dans le cadre du projet 4PROJ à SUPINFO. Inspirée de Google Drive et Dropbox, elle permet de stocker, organiser, prévisualiser et partager des fichiers via une interface web moderne et une application mobile native.

**Architecture principale :** l'ensemble de la plateforme s'exécute localement via **Docker Compose** (3 services). Un unique script `./start.sh` suffit pour démarrer le projet. En complément, le projet est déployé en production sur **Microsoft Azure** (App Service + Azure MySQL + Azure Blob Storage).

---

## Fonctionnalités

| Fonctionnalité | Web | Mobile |
|---|:---:|:---:|
| Authentification JWT (email + mot de passe) | ✅ | ✅ |
| OAuth 2.0 (Google, GitHub, Microsoft) | ✅ | ✅ |
| Mot de passe oublié (email + token TTL 30 min) | ✅ | ✅ |
| Upload de fichiers (max 2 Go en local et prod) | ✅ | ✅ |
| Upload d'avatar de profil (max 2 Mo) | ✅ | ✅ |
| Téléchargement de fichiers | ✅ | ✅ |
| Prévisualisation (image, PDF, vidéo, audio) | ✅ | ✅ |
| Gestion de dossiers (hiérarchique) | ✅ | ✅ |
| Téléchargement d'un dossier en ZIP | ✅ | ✅ |
| Fil d'Ariane (breadcrumbs) | ✅ | ✅ |
| Partage par lien public (+ mot de passe + expiration) | ✅ | ✅ |
| Corbeille — soft delete + restauration | ✅ | ✅ |
| Quota utilisateur 30 Go | ✅ | ✅ |
| Recherche globale (fichiers + dossiers) | ✅ | ✅ |
| Tableau de bord analytique | ✅ | ✅ |
| Thème clair / sombre | ✅ | ✅ |
| Déploiement Azure Blob (production) | ✅ | — |

---

## Stack Technique

### Backend
| Composant | Technologie |
|---|---|
| Framework | Symfony 7.4 LTS / PHP 8.3 |
| ORM | Doctrine 3 (QueryBuilder, migrations) |
| Authentification | LexikJWT RS256 + KnpU OAuth2 |
| Autorisation | Symfony Voters (ownership RBAC) |
| Rate Limiting | Symfony RateLimiter |
| Cache | Redis 7 |
| Base de données | MySQL 8.0 |
| Stockage local | Volume Docker `storage_data` |
| Stockage production | Azure Blob Storage (LRS Standard) |

### Frontend Web
| Composant | Technologie |
|---|---|
| Framework | React 19 + TypeScript 5.7+ |
| Build | Vite 7 |
| State management | Zustand 5 |
| Data fetching | TanStack Query 5 |
| Client HTTP | Axios 1.13 (intercepteurs JWT) |
| Routing | React Router 7 |

### Frontend Mobile
| Composant | Technologie |
|---|---|
| Framework | React Native 0.81 + Expo SDK 54 |
| Stockage sécurisé JWT | expo-secure-store (Keychain / Keystore) |
| OAuth mobile | react-native-webview (incognito) |
| Build cloud | EAS Build (APK / IPA) |

> ⚠️ **Le frontend mobile n'est pas dockerisé.** Il se lance directement via `npx expo start`.

### Infrastructure
| Service | Rôle |
|---|---|
| Docker Compose | Orchestration locale (backend, database, frontend-web) |
| GitHub Actions | CI/CD — lint, tests, audit sécurité, build, déploiement Azure |
| Azure App Service B1 | Hébergement backend (production) |
| Azure MySQL Flexible B1ms | Base de données (production) |
| Azure Blob Storage LRS | Fichiers (production) |
| Azure Container Registry | Images Docker privées |
| Cloudflare | DNS, SSL/TLS Full Strict, CDN, DDoS |

---

## Prérequis

| Outil | Version | Requis pour |
|---|---|---|
| Docker | 24+ | Tous les services locaux |
| Docker Compose | 2.20+ | Orchestration |
| Git | 2.40+ | Cloner le projet |
| OpenSSL | 3.x | Génération des secrets JWT |
| Node.js | 20 LTS | Frontend mobile uniquement |
| EAS CLI | 12+ | Build APK/IPA (optionnel) |

---

## Démarrage Rapide

```bash
git clone git@github.com:Abdoulayefoff/supfile-project.git
cd supfile-project
chmod +x start.sh
./start.sh
```

Le script `start.sh` effectue automatiquement :

1. Vérification de Docker et Docker Compose
2. Génération du fichier `.env` avec des secrets cryptographiques (`openssl rand -hex 32`)
3. Installation des dépendances Composer
4. Génération de la paire de clés RSA pour JWT (LexikJWT)
5. Démarrage de tous les conteneurs Docker
6. Création de la base de données MySQL et exécution des migrations Doctrine
7. Installation des dépendances frontend web (`npm install`)
8. Health checks sur chaque service
9. Affichage des URLs d'accès

> 🔒 **Sécurité by Default :** aucun secret n'est commité dans le dépôt. Tous les secrets sont générés localement par `start.sh`.

Une fois démarré :

| Service | URL locale |
|---|---|
| Application Web | http://localhost:3000 |
| API REST | http://localhost:8000/api |
| MySQL | localhost:3306 |

---

## Installation Manuelle (étape par étape)

```bash
# 1. Cloner et configurer l'environnement
git clone git@github.com:Abdoulayefoff/supfile-project.git && cd supfile-project
cp .env.example .env
# Éditer .env avec vos valeurs (ou laisser start.sh le faire)

# 2. Installer les dépendances backend et générer les clés JWT
cd backend
composer install --no-dev --optimize-autoloader
php bin/console lexik:jwt:generate-keypair

# 3. Démarrer les conteneurs Docker
docker compose up -d --build

# 4. Créer la base de données et migrer
docker compose exec api php bin/console doctrine:database:create --if-not-exists
docker compose exec api php bin/console doctrine:migrations:migrate --no-interaction

# 5. Frontend mobile (hors Docker)
cd frontend-mobile
cp .env.example .env         # Définir EXPO_PUBLIC_API_URL=http://192.168.x.x:8000/api
npm install
npx expo start
```

---

## Commandes Make

```bash
make help          # Affiche toutes les commandes disponibles
```

### Démarrage

| Commande | Description |
|---|---|
| `make install` | Installation complète (première fois) |
| `make start` | Démarrer tous les conteneurs |
| `make stop` | Arrêter tous les conteneurs |
| `make restart` | Redémarrer les conteneurs |
| `make rebuild` | Reconstruire les images sans cache |

### Docker

| Commande | Description |
|---|---|
| `make ps` | État de tous les conteneurs |
| `make logs` | Logs en temps réel (tous les services) |
| `make logs-api` | Logs du backend Symfony |
| `make logs-web` | Logs du frontend web |
| `make logs-db` | Logs de la base de données |

### Backend Symfony

| Commande | Description |
|---|---|
| `make migrate` | Exécuter les migrations en attente |
| `make migration MSG="..."` | Générer une nouvelle migration |
| `make migration-status` | Statut des migrations |
| `make cache` | Vider le cache Symfony |
| `make cache-warmup` | Vider et réchauffer le cache |
| `make jwt` | Régénérer les clés JWT |
| `make db-reset` | Réinitialiser la base de données ⚠️ |
| `make db-shell` | Shell MySQL interactif |
| `make console CMD="..."` | Commande Symfony personnalisée |

### Tests

| Commande | Description |
|---|---|
| `make test` | Lancer tous les tests (backend + frontend web) |
| `make test-backend` | Tests PHPUnit uniquement |
| `make test-frontend-web` | Tests Jest uniquement |

### Frontend Mobile

| Commande | Description |
|---|---|
| `make mobile-install` | Installer les dépendances npm |
| `make mobile-start` | Démarrer le serveur Expo |
| `make mobile-android` | Lancer sur émulateur Android |

---

## API REST — Aperçu des Endpoints

| Groupe | Endpoints principaux |
|---|---|
| Auth | `POST /auth/register` · `POST /auth/login` · `GET /auth/me` · `POST /auth/forgot-password` |
| OAuth | `GET /auth/oauth/{provider}` · `GET /auth/oauth/{provider}/callback` |
| Fichiers | `GET /files` · `POST /files/upload` · `GET /files/{id}/download` · `GET /files/{id}/preview` |
| Dossiers | `GET /folders` · `POST /folders` · `GET /folders/{id}` · `GET /folders/{id}/download` · `GET /folders/{id}/breadcrumbs` |
| Corbeille | `GET /trash` · `POST /trash/{id}/restore` · `DELETE /trash/{id}` |
| Partage | `POST /shares` · `GET /shares` · `DELETE /shares/{id}` |
| Public | `GET /public/share/{token}` · `GET /public/share/{token}/download` |
| Dashboard | `GET /dashboard/stats` · `GET /dashboard/recent` · `GET /dashboard/search` · `GET /dashboard/storage` |
| Compte | `POST /user/update-profile` · `POST /user/change-password` · `DELETE /user/delete-account` |
| **Pages légales** | `GET /legal/terms` · `GET /legal/privacy` · `GET /legal/help` |

> 📖 Documentation complète disponible dans [`docs/documentation_technique.pdf`](./docs/documentation_technique.pdf)

---

## Structure du Projet

```
supfile-projet/
├── backend/                    # API Symfony 7.4 / PHP 8.3
│   ├── src/
│   │   ├── Controller/Api/     # Contrôleurs REST
│   │   ├── Entity/             # Entités Doctrine
│   │   ├── Repository/         # Requêtes QueryBuilder
│   │   ├── Service/            # Logique métier
│   │   ├── Security/           # Voters RBAC
│   │   └── EventListener/      # JWTCreatedListener
│   ├── config/                 # Configuration Symfony (YAML)
│   ├── legal/                  # Pages légales (Markdown)
│   │   ├── terms.md            # Conditions d'utilisation (CGU)
│   │   ├── privacy.md          # Politique de confidentialité (RGPD)
│   │   └── help.md             # Centre d'aide (FAQ)
│   ├── migrations/             # Migrations Doctrine
│   └── tests/                  # Tests PHPUnit
├── frontend-web/               # SPA React 19 + TypeScript + Vite
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/           # Appels API Axios
│       ├── stores/             # État global Zustand
│       └── lib/                # Instance Axios + intercepteurs JWT
├── frontend-mobile/            # React Native 0.81 + Expo SDK 54
│   └── src/
│       ├── components/
│       ├── screens/
│       ├── api/                # Appels API Axios
│       └── context/            # AuthContext (SecureStore)
├── docs/
│   └── documentation_technique.pdf  
    └── manuel_utilisateur.pdf   
├── docker-compose.yml
├── start.sh                    # Script de démarrage tout-en-un
├── Makefile                    # Commandes make
```

---

## Variables d'Environnement

Copiez `.env.example` en `.env` et configurez les variables suivantes (ou laissez `start.sh` les générer automatiquement) :

```env
# Application
APP_ENV=dev
APP_SECRET=<généré par openssl rand -hex 32>

# Base de données
DATABASE_URL=mysql://user:password@database:3306/supfile

# JWT (RS256)
JWT_SECRET_KEY=%kernel.project_dir%/config/jwt/private.pem
JWT_PUBLIC_KEY=%kernel.project_dir%/config/jwt/public.pem
JWT_PASSPHRASE=<généré par openssl rand -hex 32>

# Stockage : local (dev) ou azure (prod)
STORAGE_DRIVER=local

# OAuth (optionnel en local)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=

# Email (reset mot de passe)
MAILER_DSN=smtp://...

# Azure (production uniquement)
AZURE_STORAGE_ACCOUNT=
AZURE_STORAGE_KEY=
AZURE_STORAGE_CONTAINER=
```

> ⚠️ Le fichier `.env` est dans `.gitignore` — ne commitez jamais vos secrets.

---

## Génération de l'APK Android

```bash
cd frontend-mobile

# Configurer l'URL de l'API
echo "EXPO_PUBLIC_API_URL=https://api.supfile-cloud.fr/api" > .env

# Se connecter à Expo (compte requis sur https://expo.dev)
eas login

# APK pour distribution interne (Android)
eas build --platform android --profile preview

# AAB pour Google Play (production)
eas build --platform android --profile production
```

Le build s'exécute sur les serveurs cloud Expo en 8 à 15 minutes. Un lien de téléchargement direct est fourni à la fin.

---

## Pipeline CI/CD

Le pipeline GitHub Actions se déclenche sur chaque push vers `main` ou `dev` :

```
Push / PR → main ou dev
     │
     ├── 1. Lint PHP (PSR-12 + PHPStan niveau 6)
     ├── 2. Tests PHPUnit (avec MySQL de test)
     ├── 3. Audit sécurité (composer audit + npm audit)
     └── 4. Build Frontend
              │
              └── 5. Build & Push image Docker (Azure Container Registry)
                            │
                            └── 6. Deploy Azure App Service
```

Les secrets CI/CD (`ACR_USERNAME`, `ACR_PASSWORD`, `AZURE_CREDENTIALS`) sont stockés exclusivement dans les **GitHub Repository Secrets**.

---

## Sécurité

- **JWT RS256** — clés asymétriques, TTL 1 heure
- **bcrypt / argon2** — hachage des mots de passe
- **Symfony Voters** — vérification d'ownership sur chaque ressource (RBAC)
- **Doctrine QueryBuilder** — 0 requête SQL brute (protection injection SQL)
- **Rate Limiting** — 3 req/15 min par IP sur forgot-password (sliding window, pas de limite par email)
- **Path Traversal** — validation regex du `storagePath` avant tout accès
- **Secrets générés** — `openssl rand -hex 32` à chaque installation
- **Mobile** — JWT stocké dans Keychain (iOS) / Keystore (Android) via `expo-secure-store`
- **OAuth mobile** — WebView isolée (`incognito=true`, pas de cookies tiers)

---

## Équipe

| Membres |
|---|
| **Abdoulaye FOFANA** 
| **Rayelen GUESMI** 
| **Tharshan SIVAPALAN** 
| **Kendall GBAGUIDI** 

---

## Branches Git

| Branche | Rôle |
|---|---|
| `main` | Production — protégée, merge via PR uniquement |
| `develop` | Développement — branche d'intégration |
| `dev_X` | Branche de travail des devs` |

**Workflow :**
1. Créer sa branche de dev depuis `develop`
2. Développer et commiter
3. Ouvrir une Pull Request vers `develop`
4. Review + merge après validation
5. Lorsque `develop` est stable → PR vers `main` → déploiement automatique Azure

---

## Documentation

| Document | Description |
|---|---|
| [`docs/documentation_technique.pdf`](./docs/documentation_technique.pdf) | Documentation technique complète (LaTeX / Overleaf) |
| [`manuel_utilisateur.pdf`](./manuel_utilisateur.pdf) | Manuel utilisateur (LaTeX / Overleaf) |


### Pages Légales

Les pages légales sont rédigées en Markdown dans `backend/legal/` et exposées via l'API (`GET /api/legal/{page}`). Elles sont affichées dans l'interface web et mobile lors de l'inscription.

| Fichier | Endpoint API | Description |
|---|---|---|
| [`backend/legal/terms.md`](./backend/legal/terms.md) | `GET /api/legal/terms` | Conditions Générales d'Utilisation (CGU) |
| [`backend/legal/privacy.md`](./backend/legal/privacy.md) | `GET /api/legal/privacy` | Politique de Confidentialité (RGPD) |
| [`backend/legal/help.md`](./backend/legal/help.md) | `GET /api/legal/help` | Centre d'Aide — FAQ et guide utilisateur |

---

<div align="center">

**SUPFile** — Projet 4PROJ · SUPINFO 2025–2026

[🌐 supfile-cloud.fr](https://www.supfile-cloud.fr) · [📡 api.supfile-cloud.fr/api](https://api.supfile-cloud.fr/api) · [💻 GitHub](https://github.com/Abdoulayefoff/supfile-project)

</div>
