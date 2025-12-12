FROM node:20-alpine

# ==========================================
# Configuration du répertoire de travail
# ==========================================
WORKDIR /app

# ==========================================
# Copie et installation des dépendances
# ==========================================
# Copier package.json et package-lock.json en premier (cache Docker)
COPY package*.json ./

# Installation des dépendances
RUN npm install

# ==========================================
# Copie du reste de l'application
# ==========================================
COPY . .

# ==========================================
# Exposition du port Vite
# ==========================================
EXPOSE 5173

# ==========================================
# Commande de démarrage
# ==========================================
# --host 0.0.0.0 permet l'accès depuis l'extérieur du conteneur
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]