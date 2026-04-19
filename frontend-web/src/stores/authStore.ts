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

// ── Chargement de l'état initial depuis localStorage ou sessionStorage
// Gère aussi la migration depuis l'ancien format zustand persist ('supfile-auth')
const loadInitialState = (): Pick<AuthState, 'token' | 'user' | 'isAuthenticated'> => {
    // 1. Nouveau format : jwt_token + sf_user
    let token: string | null =
        localStorage.getItem('jwt_token') ?? sessionStorage.getItem('jwt_token');

    let user: User | null = null;
    const sfUserStr =
        localStorage.getItem('sf_user') ?? sessionStorage.getItem('sf_user');
    if (sfUserStr) {
        try { user = JSON.parse(sfUserStr) as User; } catch { /* ignore */ }
    }

    // 2. Migration depuis l'ancien format zustand persist
    if (!token || !user) {
        const legacy = localStorage.getItem('supfile-auth');
        if (legacy) {
            try {
                const parsed = JSON.parse(legacy) as { state?: { token?: string; user?: User } };
                if (!token) token = parsed.state?.token ?? null;
                if (!user)  user  = parsed.state?.user  ?? null;
                // Migrer vers le nouveau format et nettoyer l'ancien
                if (token && user) {
                    localStorage.setItem('jwt_token', token);
                    localStorage.setItem('sf_user', JSON.stringify(user));
                    localStorage.removeItem('supfile-auth');
                }
            } catch { /* ignore */ }
        }
    }

    return { token, user, isAuthenticated: !!(token && user) };
};

// ── Création du store (sans middleware persist — gestion manuelle du storage)
export const useAuthStore = create<AuthState>()((set) => ({
    ...loadInitialState(),

    /**
     * Connecte l'utilisateur et persiste dans le bon storage.
     * rememberMe=true  → localStorage  (survit à la fermeture du navigateur)
     * rememberMe=false → sessionStorage (supprimé à la fermeture de l'onglet)
     */
    setAuth: (token: string, user: User, rememberMe = true) => {
        if (rememberMe) {
            localStorage.setItem('jwt_token', token);
            localStorage.setItem('sf_user', JSON.stringify(user));
            sessionStorage.removeItem('jwt_token');
            sessionStorage.removeItem('sf_user');
        } else {
            sessionStorage.setItem('jwt_token', token);
            sessionStorage.setItem('sf_user', JSON.stringify(user));
            localStorage.removeItem('jwt_token');
            localStorage.removeItem('sf_user');
            localStorage.removeItem('supfile-auth');
        }
        set({ token, user, isAuthenticated: true });
    },

    /** Met à jour uniquement les infos user sans changer le token. */
    setUser: (user: User) => {
        // Mettre à jour le storage approprié (détecté via la présence du token)
        if (localStorage.getItem('jwt_token')) {
            localStorage.setItem('sf_user', JSON.stringify(user));
        } else {
            sessionStorage.setItem('sf_user', JSON.stringify(user));
        }
        set({ user });
    },

    /** Déconnecte et nettoie tous les storages. */
    logout: () => {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('sf_user');
        localStorage.removeItem('supfile-auth');
        sessionStorage.removeItem('jwt_token');
        sessionStorage.removeItem('sf_user');
        set({ token: null, user: null, isAuthenticated: false });
    },
}));
