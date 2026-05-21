import { create } from 'zustand';
import { User } from '../types';
import { authApi } from '../api/auth';

// Définition de l'interface pour l'état d'authentification Zustand.
interface AuthState {
  user: User | null; // Les informations de l'utilisateur connecté.
  token: string | null; // Le jeton JWT actuel.
  isAuthenticated: boolean; // Booléen indiquant si l'utilisateur est connecté.
  isLoading: boolean; // État de chargement (ex: lors de la vérification initiale).
  login: (email: string, pass: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateUser: (user: User) => void;
  setOAuthSession: (token: string, user: User) => Promise<void>;
}

// Création du store Zustand pour la gestion globale de l'authentification.
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true, // Vrai par défaut jusqu'à ce que la vérification (checkAuth) soit terminée.

  // Action de connexion : appelle l'API, sauvegarde le token, récupère le profil et met à jour l'état.
  login: async (email, pass) => {
    const data = await authApi.login(email, pass);
    await authApi.saveToken(data.token);
    const me = await authApi.getMe();
    set({ user: me.user, token: data.token, isAuthenticated: true });
  },

  // Action d'inscription : délègue à l'API. (Ne connecte pas automatiquement l'utilisateur).
  register: async (data) => {
    await authApi.register(data);
  },

  // Action de déconnexion : nettoie les tokens persistants et réinitialise l'état Zustand.
  logout: async () => {
    await authApi.logout();
    set({ user: null, token: null, isAuthenticated: false });
  },

  // Vérifie si une session existe au lancement de l'application.
  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const token = await authApi.getToken(); // Récupère le token du SecureStore
      if (token) {
        await authApi.saveToken(token); // Assigne le token en mémoire pour les requêtes futures
        const me = await authApi.getMe(); // Teste la validité du token en demandant le profil
        set({ user: me.user, token, isAuthenticated: true });
      } else {
        // Aucun token trouvé, utilisateur non authentifié.
        set({ user: null, token: null, isAuthenticated: false });
      }
    } catch (e: any) {
      // Si une erreur survient (ex: 401 token expiré), on désauthentifie silencieusement.
      if (e.response && e.response.status !== 401) {
        console.error('Check auth failed', e);
      }
      set({ user: null, token: null, isAuthenticated: false });
    } finally {
      // Fin du chargement initial
      set({ isLoading: false });
    }
  },

  // Met à jour les informations du profil utilisateur en cache (ex: après modif de l'avatar).
  updateUser: (user) => {
    set({ user });
  },

  // Initialise la session suite à une connexion OAuth réussie.
  setOAuthSession: async (token, user) => {
    await authApi.saveToken(token);
    set({ user, token, isAuthenticated: true });
  },
}));
