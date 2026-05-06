import apiClient from '@/lib/axios';
import type { User } from '@/types';

// ── Types des requêtes / réponses 
interface LoginRequest {
    email: string;
    password: string;
}

interface RegisterRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    consent: boolean;
}

interface AuthResponse {
    token: string;
    user: User;
}

interface LoginApiResponse {
    token: string;
}

interface RegisterApiResponse {
    token: string;
    user: User;
}

// ── Service d'authentification 
// Contient uniquement les appels HTTP vers l'API Symfony
// Aucune logique métier — le backend décide de tout
export const authService = {

    // POST /api/auth/login → retourne uniquement { token }
    // On enchaîne avec GET /api/user/me pour récupérer les données utilisateur
    login: async (data: LoginRequest): Promise<AuthResponse> => {
        const loginResponse = await apiClient.post<LoginApiResponse>('/auth/login', data);
        const token = loginResponse.data.token;

        // GET /api/user/me retourne { user: {...} }
        const userResponse = await apiClient.get<{ user: User }>('/user/me', {
            headers: { Authorization: `Bearer ${token}` },
        });

        return { token, user: userResponse.data.user };
    },

    // POST /api/auth/register → retourne { token, user }
    register: async (data: RegisterRequest): Promise<AuthResponse> => {
        const response = await apiClient.post<RegisterApiResponse>('/auth/register', data);
        return response.data;
    },

    // GET /api/auth/oauth/{provider}
    // Redirige le navigateur vers le provider OAuth (Google, GitHub, Microsoft)
    getOAuthUrl: (provider: 'google' | 'github' | 'microsoft'): string => {
        const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';
        return `${apiUrl}/auth/oauth/${provider}`;
    },
};