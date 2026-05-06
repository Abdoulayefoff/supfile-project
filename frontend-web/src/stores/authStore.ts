import { create } from 'zustand';
import type { User } from '@/types';

// ── Interface du store
interface AuthState {
    token: string | null;
    user: User | null;
    isAuthenticated: boolean;

    setAuth: (token: string, user: User, rememberMe?: boolean) => void;
    setUser: (user: User) => void;
    logout: () => void;
}

// ── Chargement de l'état initial depuis sessionStorage uniquement.
// jwt_token et sf_user ne persistent jamais dans localStorage (sécurité).
// Migration one-shot : nettoie les anciennes clés sensibles si elles existent.
const loadInitialState = (): Pick<AuthState, 'token' | 'user' | 'isAuthenticated'> => {
    // Suppression des anciennes clés sensibles dans localStorage (migration)
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('sf_user');
    localStorage.removeItem('supfile-auth');

    const token: string | null = sessionStorage.getItem('jwt_token');

    let user: User | null = null;
    const sfUserStr = sessionStorage.getItem('sf_user');
    if (sfUserStr) {
        try { user = JSON.parse(sfUserStr) as User; } catch { /* ignore */ }
    }

    return { token, user, isAuthenticated: !!(token && user) };
};

// ── Création du store (sans middleware persist — gestion manuelle du storage)
export const useAuthStore = create<AuthState>()((set) => ({
    ...loadInitialState(),

    /**
     * Connecte l'utilisateur et persiste dans sessionStorage.
     * Le paramètre rememberMe est conservé pour la compatibilité API mais ignoré :
     * jwt_token et sf_user ne vont jamais dans localStorage pour des raisons de sécurité.
     * La session reste active tant que l'onglet est ouvert.
     */
    setAuth: (token: string, user: User, _rememberMe = true) => {
        sessionStorage.setItem('jwt_token', token);
        sessionStorage.setItem('sf_user', JSON.stringify(user));
        set({ token, user, isAuthenticated: true });
    },

    /** Met à jour uniquement les infos user sans changer le token. */
    setUser: (user: User) => {
        sessionStorage.setItem('sf_user', JSON.stringify(user));
        set({ user });
    },

    /** Déconnecte et nettoie sessionStorage + legacy localStorage. */
    logout: () => {
        sessionStorage.removeItem('jwt_token');
        sessionStorage.removeItem('sf_user');
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('sf_user');
        localStorage.removeItem('supfile-auth');
        set({ token: null, user: null, isAuthenticated: false });
    },
}));
