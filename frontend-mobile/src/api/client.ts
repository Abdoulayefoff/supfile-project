import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// URL de base de l'API. Utilise la variable d'environnement si disponible, sinon une adresse IP locale par défaut.
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.0.22:8000/api';

// Création d'une instance Axios centralisée avec configuration par défaut (URL, timeout, headers).
export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // Timeout fixé à 30 secondes
  headers: {
    'Content-Type': 'application/json',
  },
});

// Variable en mémoire pour stocker le token JWT afin d'éviter des accès asynchrones constants au SecureStore.
let memoryToken: string | null = null;

// Met à jour le token en mémoire.
export const setMemoryToken = (token: string | null) => {
  memoryToken = token;
};

// Récupère le token actuellement en mémoire.
export const getMemoryToken = () => memoryToken;

// Intercepteur de requête Axios : Ajoute automatiquement le token JWT dans les headers de chaque requête sortante.
apiClient.interceptors.request.use(
  async (config) => {
    // Si un token est disponible en mémoire, l'ajouter à l'en-tête Authorization.
    if (memoryToken) {
      config.headers.Authorization = `Bearer ${memoryToken}`;
    }
    return config;
  },
  (error) => {
    // En cas d'erreur avant l'envoi, rejeter la promesse.
    return Promise.reject(error);
  }
);

// Intercepteur de réponse Axios : Gère globalement les réponses et surtout les erreurs (ex: Token expiré).
apiClient.interceptors.response.use(
  (response) => response, // Laisse passer les réponses réussies.
  async (error) => {
    // Si l'API retourne une erreur 401 (Non autorisé / Token expiré)
    if (error.response && error.response.status === 401) {
      memoryToken = null; // Efface le token en mémoire
      try {
        // Efface le token du stockage persistant selon la plateforme (Web ou Mobile)
        if (Platform.OS === 'web') {
          localStorage.removeItem('jwt_token');
        } else {
          await SecureStore.deleteItemAsync('jwt_token');
        }
      } catch (e) {
        console.error('Failed to remove token', e);
      }
    }
    // Rejette l'erreur pour qu'elle puisse être traitée par la fonction appelante.
    return Promise.reject(error);
  }
);
