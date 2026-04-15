FROM node:20-alpine

WORKDIR /app

# Copier les fichiers package
COPY package*.json ./

# Installer les dépendances avec nettoyage du cache
# Supprime package-lock.json pour forcer une résolution fraîche des
# dépendances natives optionnelles selon la plateforme cible (linux/arm64)
RUN rm -f package-lock.json && \
    npm cache clean --force && \
    npm install --legacy-peer-deps && \
    npm cache clean --force

# Copier le reste des fichiers
COPY . .

# Exposer le port 3000
EXPOSE 3000

# Démarrer le serveur de développement Vite
CMD ["npm", "run", "dev", "--", "--host", "--port", "3000"]