# SupFile - Frontend Mobile

Ceci est l'application mobile officielle du projet SupFile, développée avec **React Native** et **Expo**.

## 🚀 Comment lancer le projet

### Prérequis
- [Node.js](https://nodejs.org/) installé sur votre machine.
- L'application **Expo Go** installée sur votre smartphone (iOS ou Android) ou un émulateur correctement configuré sur votre machine.

### Installation
1. Installez les dépendances du projet en vous plaçant dans le dossier `frontend-mobile` :
   ```bash
   npm install
   ```

2. Configuration de l'environnement :
   Assurez-vous d'avoir un fichier `.env` à la racine du dossier `frontend-mobile`. Il doit contenir l'URL vers votre backend SupFile.
   *Exemple :*
   ```env
   EXPO_PUBLIC_API_URL=http://votre-adresse-ip-locale:8000/api
   ```
   **Important :** Si vous lancez le backend localement, vous devez mettre votre **adresse IP réseau** (ex: `192.168.x.x`) et non `localhost`, afin que le smartphone/émulateur puisse y accéder.

3. Lancement du serveur de développement :
   ```bash
   npx expo start
   ```
   - **Sur un téléphone physique** : Scannez le QR Code affiché dans le terminal (avec l'appareil photo sur iOS ou avec l'application Expo Go sur Android).
   - **Sur un émulateur** : Appuyez sur `a` (pour Android) ou `i` (pour iOS) directement dans la console.

---

## 🔗 Comment l'application se connecte au Backend

L'application mobile communique avec le backend (qui gère l'authentification, les dossiers, les partages, etc.) via une **API REST**.

1. **Centralisation (Client Axios)** : Toute la communication réseau est gérée dans le fichier `src/api/client.ts`. Ce fichier configure une instance d'`Axios` utilisant la base URL définie dans votre fichier `.env` (`EXPO_PUBLIC_API_URL`).
2. **Authentification (JWT)** : 
   - Lors de la connexion de l'utilisateur (via un formulaire ou OAuth), le backend renvoie un **token JWT**.
   - Ce token est intercepté et sauvegardé de façon hautement sécurisée sur l'appareil de l'utilisateur grâce à la librairie `expo-secure-store`.
   - **Les intercepteurs** : À chaque nouvelle requête vers le backend, l'intercepteur configuré dans `client.ts` récupère automatiquement ce token et l'ajoute en en-tête de la requête HTTP (`Authorization: Bearer <token>`). L'application est donc authentifiée.
3. **Architecture** : Les appels API spécifiques sont découpés par domaine dans le dossier `src/api/` (`auth.ts`, `files.ts`, `trash.ts`, etc.) et mettent à jour le **Store global** (géré avec Zustand dans `src/store/`) pour que l'interface réagisse immédiatement (chargement, erreur, affichage des données).

---

## 🧪 Comment lancer les tests

Le projet possède une suite très complète de tests unitaires et d'intégration utilisant **Jest** et **React Native Testing Library**. La logique métier, les stores, les hooks et les interfaces sont testés.

Pour exécuter les tests depuis le dossier `frontend-mobile` :

```bash
# 1. Lancer les tests une seule fois (Recommandé pour la CI ou la validation)
npm run test -- --watchAll=false

# 2. Lancer les tests en mode "Watch" (le test se relance à chaque sauvegarde d'un fichier)
npm run test
```

### Vérifier la couverture de code (Coverage)
Si vous souhaitez voir précisément quel pourcentage du code est validé par les tests :

```bash
npm run test -- --watchAll=false --coverage
```
Un résumé détaillé s'affichera dans le terminal. Un dossier `coverage/` sera également créé. Vous pouvez ouvrir le fichier `coverage/lcov-report/index.html` dans votre navigateur web pour naviguer visuellement ligne par ligne dans votre code et voir les zones couvertes.
