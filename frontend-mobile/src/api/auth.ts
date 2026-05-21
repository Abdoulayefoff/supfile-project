import { apiClient, setMemoryToken } from './client';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { User } from '../types';

// Objet regroupant tous les appels API liés à l'authentification et aux utilisateurs.
export const authApi = {
  // Inscription d'un nouvel utilisateur.
  register: async (data: any) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },
  // Connexion de l'utilisateur avec email et mot de passe.
  login: async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data; // Retourne généralement le token et les infos utilisateur.
  },
  // Récupère les informations du profil de l'utilisateur actuellement connecté.
  getMe: async (): Promise<{ user: User }> => {
    const response = await apiClient.get('/user/me');
    return response.data;
  },
  // Sauvegarde le token de manière sécurisée (mémoire + stockage persistant).
  saveToken: async (token: string) => {
    setMemoryToken(token); // Sauvegarde rapide en mémoire RAM.
    try {
      // Stockage persistant adapté selon la plateforme.
      if (Platform.OS === 'web') {
        localStorage.setItem('jwt_token', token);
      } else {
        await SecureStore.setItemAsync('jwt_token', token); // Keychain (iOS) / Keystore (Android)
      }
    } catch (e) {
      console.error('Failed to save token', e);
    }
  },
  // Récupère le token depuis le stockage persistant (utilisé au démarrage de l'app).
  getToken: async (): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem('jwt_token');
      } else {
        return await SecureStore.getItemAsync('jwt_token');
      }
    } catch (e) {
      console.error('Failed to get token', e);
      return null;
    }
  },
  // Déconnecte l'utilisateur en supprimant le token de partout.
  logout: async () => {
    setMemoryToken(null);
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem('jwt_token');
      } else {
        await SecureStore.deleteItemAsync('jwt_token');
      }
    } catch (e) {
      console.error('Failed to remove token', e);
    }
  },

  // Déclenche l'envoi d'un email pour réinitialiser le mot de passe.
  forgotPassword: async (email: string): Promise<void> => {
    await apiClient.post('/auth/forgot-password', { email });
  },

  // Valide la réinitialisation du mot de passe avec le token reçu par email.
  resetPassword: async (token: string, password: string): Promise<void> => {
    await apiClient.post('/auth/reset-password', { token, password });
  },
};
