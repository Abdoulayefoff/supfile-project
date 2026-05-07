import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

// URL de base de l'API — définie dans .env (VITE_API_URL)
// Fallback sur localhost pour le développement
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';

// ── Instance Axios configurée
const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    // Timeout à 30s pour les uploads de fichiers
    timeout: 30000,
});

// ── Intercepteur REQUÊTE
// Injecte automatiquement le token JWT dans le header Authorization.
// Le token est uniquement dans sessionStorage (jamais localStorage pour des raisons de sécurité).
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = sessionStorage.getItem('jwt_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError) => Promise.reject(error),
);

// ── Intercepteur RÉPONSE
// Si l'API retourne 401 (token expiré ou invalide) :
//   1. On nettoie sessionStorage
//   2. On dispatche un événement custom pour que le store Zustand
//      puisse réagir et déconnecter l'utilisateur proprement
apiClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            sessionStorage.removeItem('jwt_token');
            sessionStorage.removeItem('sf_user');
            window.dispatchEvent(new CustomEvent('auth:logout'));
        }
        return Promise.reject(error);
    },
);

export default apiClient;
