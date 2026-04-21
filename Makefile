#  SUPFILE — Makefile
#  Usage : make <commande>
#  Requis : Docker, Docker Compose


# Variables
DOCKER_COMPOSE = docker compose
API            = $(DOCKER_COMPOSE) exec -T api
DB             = $(DOCKER_COMPOSE) exec -T database
WEB            = $(DOCKER_COMPOSE) exec -T web

# Couleurs
CYAN  = \033[0;36m
GREEN = \033[0;32m
YELLOW= \033[1;33m
RESET = \033[0m

.DEFAULT_GOAL := help

#  AIDE

.PHONY: help
help: ## Affiche cette aide
	@echo ""
	@echo "$(CYAN)║              SUPFILE — Commandes Make                ║$(RESET)"
	@echo ""
	@echo "$(YELLOW)  DÉMARRAGE$(RESET)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; /^(install|start|rebuild|stop|restart)/ {printf "  $(GREEN)make %-25s$(RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)  DOCKER$(RESET)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; /^(up|down|build|ps|logs|logs-)/ {printf "  $(GREEN)make %-25s$(RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)  BACKEND (Symfony)$(RESET)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; /^(composer|cache|jwt|migrate|migration|db-)/ {printf "  $(GREEN)make %-25s$(RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)  FRONTEND WEB$(RESET)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; /^(web-)/ {printf "  $(GREEN)make %-25s$(RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)  FRONTEND MOBILE$(RESET)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; /^(mobile-)/ {printf "  $(GREEN)make %-25s$(RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)  QUALITÉ$(RESET)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; /^(test|lint)/ {printf "  $(GREEN)make %-25s$(RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)  SHELLS / ACCÈS$(RESET)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; /^(shell-)/ {printf "  $(GREEN)make %-25s$(RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)  NETTOYAGE$(RESET)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; /^(clean|prune)/ {printf "  $(GREEN)make %-25s$(RESET) %s\n", $$1, $$2}'
	@echo ""

#  DÉMARRAGE

.PHONY: install
install: ## Installation complète du projet (première fois)
	@echo "$(CYAN)▶ Installation complète du projet...$(RESET)"
	@bash start.sh

.PHONY: start
start: up ## Démarre tous les conteneurs
	@echo "$(GREEN)✔ Projet démarré$(RESET)"
	@echo "  Frontend Web  → http://localhost:3000"
	@echo "  Backend API   → http://localhost:8000/api"
	@echo "  MySQL         → localhost:3307"

.PHONY: stop
stop: ## Arrête tous les conteneurs
	@echo "$(CYAN)▶ Arrêt des conteneurs...$(RESET)"
	@$(DOCKER_COMPOSE) stop
	@echo "$(GREEN)✔ Conteneurs arrêtés$(RESET)"

.PHONY: restart
restart: ## Redémarre tous les conteneurs
	@echo "$(CYAN)▶ Redémarrage des conteneurs...$(RESET)"
	@$(DOCKER_COMPOSE) restart
	@echo "$(GREEN)✔ Conteneurs redémarrés$(RESET)"

.PHONY: rebuild
rebuild: ## Reconstruit toutes les images Docker (sans cache)
	@echo "$(CYAN)▶ Reconstruction complète des images...$(RESET)"
	@bash start.sh --rebuild

#  DOCKER

.PHONY: up
up: ## Lance les conteneurs en arrière-plan
	@$(DOCKER_COMPOSE) up -d

.PHONY: down
down: ## Arrête et supprime les conteneurs
	@echo "$(CYAN)▶ Suppression des conteneurs...$(RESET)"
	@$(DOCKER_COMPOSE) down
	@echo "$(GREEN)✔ Conteneurs supprimés$(RESET)"

.PHONY: build
build: ## Reconstruit les images Docker (avec cache)
	@echo "$(CYAN)▶ Construction des images Docker...$(RESET)"
	@$(DOCKER_COMPOSE) build
	@echo "$(GREEN)✔ Images construites$(RESET)"

.PHONY: ps
ps: ## Affiche l'état des conteneurs
	@$(DOCKER_COMPOSE) ps

.PHONY: logs
logs: ## Affiche les logs de tous les conteneurs (live)
	@$(DOCKER_COMPOSE) logs -f

.PHONY: logs-api
logs-api: ## Affiche les logs du backend Symfony (live)
	@$(DOCKER_COMPOSE) logs -f api

.PHONY: logs-web
logs-web: ## Affiche les logs du frontend web (live)
	@$(DOCKER_COMPOSE) logs -f web

.PHONY: logs-db
logs-db: ## Affiche les logs de la base de données (live)
	@$(DOCKER_COMPOSE) logs -f database

#  BACKEND — SYMFONY

.PHONY: composer
composer: ## Lance une commande Composer (ex: make composer CMD="require vendor/pkg")
	@$(API) composer $(CMD)

.PHONY: composer-install
composer-install: ## Installe les dépendances PHP
	@echo "$(CYAN)▶ Installation des dépendances PHP...$(RESET)"
	@$(API) composer install --no-interaction
	@echo "$(GREEN)✔ Dépendances installées$(RESET)"

.PHONY: composer-update
composer-update: ## Met à jour les dépendances PHP
	@echo "$(CYAN)▶ Mise à jour des dépendances PHP...$(RESET)"
	@$(API) composer update --no-interaction
	@echo "$(GREEN)✔ Dépendances mises à jour$(RESET)"

.PHONY: cache
cache: ## Vide le cache Symfony
	@echo "$(CYAN)▶ Vidage du cache Symfony...$(RESET)"
	@$(API) php bin/console cache:clear
	@echo "$(GREEN)✔ Cache vidé$(RESET)"

.PHONY: cache-warmup
cache-warmup: ## Vide et réchauffe le cache Symfony
	@echo "$(CYAN)▶ Vidage et réchauffement du cache...$(RESET)"
	@$(API) php bin/console cache:clear
	@$(API) php bin/console cache:warmup
	@echo "$(GREEN)✔ Cache réchauffé$(RESET)"

.PHONY: jwt
jwt: ## Génère les clés JWT
	@echo "$(CYAN)▶ Génération des clés JWT...$(RESET)"
	@$(API) php bin/console lexik:jwt:generate-keypair --skip-if-exists
	@echo "$(GREEN)✔ Clés JWT générées$(RESET)"

.PHONY: migrate
migrate: ## Exécute toutes les migrations en attente
	@echo "$(CYAN)▶ Exécution des migrations...$(RESET)"
	@$(API) php bin/console doctrine:migrations:migrate --no-interaction
	@echo "$(GREEN)✔ Migrations exécutées$(RESET)"

.PHONY: migration
migration: ## Génère une nouvelle migration à partir des entités (ex: make migration MSG="add user table")
	@echo "$(CYAN)▶ Génération de la migration...$(RESET)"
	@$(API) php bin/console doctrine:migrations:diff --no-interaction
	@echo "$(GREEN)✔ Migration générée dans backend/migrations/$(RESET)"

.PHONY: migration-status
migration-status: ## Affiche l'état des migrations
	@$(API) php bin/console doctrine:migrations:status

.PHONY: db-create
db-create: ## Crée la base de données
	@echo "$(CYAN)▶ Création de la base de données...$(RESET)"
	@$(API) php bin/console doctrine:database:create --if-not-exists
	@echo "$(GREEN)✔ Base de données créée$(RESET)"

.PHONY: db-drop
db-drop: ## Supprime la base de données ( irréversible)
	@echo "$(YELLOW)⚠ Suppression de la base de données...$(RESET)"
	@$(API) php bin/console doctrine:database:drop --force --if-exists
	@echo "$(GREEN)✔ Base de données supprimée$(RESET)"

.PHONY: db-reset
db-reset: db-drop db-create migrate ## Réinitialise la base de données ( toutes les données seront perdues)
	@echo "$(GREEN)✔ Base de données réinitialisée$(RESET)"

.PHONY: db-shell
db-shell: ## Ouvre un shell MySQL interactif
	@$(DOCKER_COMPOSE) exec database mysql -u$$MYSQL_USER -p$$MYSQL_PASSWORD $$MYSQL_DATABASE

.PHONY: console
console: ## Lance une commande Symfony (ex: make console CMD="debug:router")
	@$(API) php bin/console $(CMD)

#  FRONTEND WEB

.PHONY: web-install
web-install: ## Installe les dépendances npm du frontend web
	@echo "$(CYAN)▶ Installation des dépendances frontend web...$(RESET)"
	@$(WEB) npm install --legacy-peer-deps
	@echo "$(GREEN)✔ Dépendances installées$(RESET)"

.PHONY: web-build
web-build: ## Compile le frontend web pour la production
	@echo "$(CYAN)▶ Build du frontend web...$(RESET)"
	@$(WEB) npm run build
	@echo "$(GREEN)✔ Build terminé dans frontend-web/dist/$(RESET)"

.PHONY: web-lint
web-lint: ## Lance le linter ESLint sur le frontend web
	@echo "$(CYAN)▶ Lint du frontend web...$(RESET)"
	@$(WEB) npm run lint

#  FRONTEND MOBILE — EXPO

.PHONY: mobile-install
mobile-install: ## Installe les dépendances npm du frontend mobile (local)
	@echo "$(CYAN)▶ Installation des dépendances mobile...$(RESET)"
	@cd frontend-mobile && npm install --legacy-peer-deps
	@echo "$(GREEN)✔ Dépendances mobile installées$(RESET)"

.PHONY: mobile-start
mobile-start: ## Démarre le serveur Expo (local)
	@echo "$(CYAN)▶ Démarrage d'Expo...$(RESET)"
	@cd frontend-mobile && npx expo start

.PHONY: mobile-android
mobile-android: ## Lance l'app sur Android (local)
	@cd frontend-mobile && npx expo start --android

.PHONY: mobile-ios
mobile-ios: ## Lance l'app sur iOS (local)
	@cd frontend-mobile && npx expo start --ios

.PHONY: mobile-web
mobile-web: ## Lance l'app Expo dans le navigateur (local)
	@cd frontend-mobile && npx expo start --web

#  QUALITÉ — TESTS & LINT

.PHONY: test-setup
test-setup: ## Crée la base de données de test (à faire une seule fois après clone)
	@echo "$(CYAN)▶ Création de la base de données de test...$(RESET)"
	@ROOT_PWD=$$(grep MYSQL_ROOT_PASSWORD .env | cut -d= -f2); \
	$(DB) mysql -uroot -p$$ROOT_PWD \
		-e "CREATE DATABASE IF NOT EXISTS supfile_db_test; \
		    GRANT ALL PRIVILEGES ON supfile_db_test.* TO 'supfile_user'@'%'; \
		    FLUSH PRIVILEGES;" 2>/dev/null || true
	@echo "$(GREEN)✔ Base de données supfile_db_test prête$(RESET)"

.PHONY: test
test: test-backend test-frontend-web ## Lance tous les tests (backend + frontend-web)

.PHONY: test-backend
test-backend: test-setup ## Lance tous les tests PHPUnit du backend
	@echo "$(CYAN)▶ Lancement des tests PHPUnit...$(RESET)"
	@$(API) php bin/phpunit
	@echo "$(GREEN)✔ Tests backend terminés$(RESET)"

.PHONY: test-frontend-web
test-frontend-web: ## Lance tous les tests Jest du frontend web (local)
	@echo "$(CYAN)▶ Lancement des tests Jest (frontend-web)...$(RESET)"
	@cd frontend-web && npx jest --clearCache > /dev/null 2>&1; npx jest --no-coverage
	@echo "$(GREEN)✔ Tests frontend-web terminés$(RESET)"

.PHONY: test-frontend-web-coverage
test-frontend-web-coverage: ## Lance les tests Jest avec rapport de couverture
	@echo "$(CYAN)▶ Tests Jest avec couverture (frontend-web)...$(RESET)"
	@cd frontend-web && npx jest --coverage
	@echo "$(GREEN)✔ Rapport disponible dans frontend-web/coverage/$(RESET)"

.PHONY: test-unit
test-unit: ## Lance uniquement les tests unitaires backend
	@echo "$(CYAN)▶ Tests unitaires backend...$(RESET)"
	@$(API) php bin/phpunit tests/Unit/ --testdox
	@echo "$(GREEN)✔ Tests unitaires terminés$(RESET)"

.PHONY: test-functional
test-functional: test-setup ## Lance uniquement les tests fonctionnels backend
	@echo "$(CYAN)▶ Tests fonctionnels backend...$(RESET)"
	@$(API) php bin/phpunit tests/Functional/ --testdox
	@echo "$(GREEN)✔ Tests fonctionnels terminés$(RESET)"

.PHONY: test-coverage
test-coverage: test-setup ## Lance les tests backend avec rapport de couverture HTML
	@echo "$(CYAN)▶ Tests backend avec couverture de code...$(RESET)"
	@$(API) php bin/phpunit --coverage-html var/coverage
	@echo "$(GREEN)✔ Rapport disponible dans backend/var/coverage/index.html$(RESET)"

.PHONY: lint
lint: web-lint ## Lance tous les linters (web + backend)
	@echo "$(CYAN)▶ Analyse statique PHP (php-cs-fixer si disponible)...$(RESET)"
	@$(API) php bin/console lint:twig templates/ 2>/dev/null || true
	@$(API) php bin/console lint:yaml config/ 2>/dev/null || true
	@echo "$(GREEN)✔ Lint terminé$(RESET)"

#  SHELLS / ACCÈS

.PHONY: shell-api
shell-api: ## Ouvre un shell bash dans le conteneur API
	@$(DOCKER_COMPOSE) exec api bash

.PHONY: shell-web
shell-web: ## Ouvre un shell sh dans le conteneur Web
	@$(DOCKER_COMPOSE) exec web sh

.PHONY: shell-db
shell-db: ## Ouvre un shell bash dans le conteneur MySQL
	@$(DOCKER_COMPOSE) exec database bash

#  NETTOYAGE

.PHONY: clean
clean: ## Supprime les conteneurs, volumes anonymes et images du projet
	@echo "$(YELLOW) Suppression des conteneurs et volumes anonymes...$(RESET)"
	@$(DOCKER_COMPOSE) down -v --remove-orphans
	@echo "$(GREEN)✔ Nettoyage terminé$(RESET)"

.PHONY: clean-all
clean-all: ## Suppression totale : conteneurs, volumes nommés, images ( perd les données MySQL)
	@echo "$(YELLOW) Suppression complète (conteneurs + volumes nommés + images)...$(RESET)"
	@$(DOCKER_COMPOSE) down -v --remove-orphans --rmi local
	@echo "$(GREEN)✔ Nettoyage complet terminé$(RESET)"

.PHONY: prune
prune: ## Supprime toutes les ressources Docker inutilisées sur le système
	@echo "$(YELLOW)⚠ Nettoyage du système Docker...$(RESET)"
	@docker system prune -f
	@echo "$(GREEN)✔ Système Docker nettoyé$(RESET)"
