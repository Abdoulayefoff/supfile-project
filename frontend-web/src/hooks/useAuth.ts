// Hooks pour l'authentification (login, register, logout)

import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';

/** Connecte l'utilisateur et stocke le token + user dans le store. */
export const useLogin = () => {
    const setAuth = useAuthStore((s) => s.setAuth);
    return useMutation({
        mutationFn: (data: { email: string; password: string; rememberMe?: boolean }) =>
            authService.login({ email: data.email, password: data.password }),
        onSuccess: ({ token, user }, variables) => {
            setAuth(token, user, variables.rememberMe ?? true);
        },
    });
};

/** Inscrit un nouvel utilisateur et stocke le token + user. */
export const useRegister = () => {
    const setAuth = useAuthStore((s) => s.setAuth);
    return useMutation({
        mutationFn: (data: {
            email: string;
            password: string;
            firstName: string;
            lastName: string;
            consent: boolean;
        }) => authService.register(data),
        onSuccess: ({ token, user }) => {
            setAuth(token, user);
        },
    });
};

/** Déconnecte l'utilisateur (vide le store). */
export const useLogout = () => {
    const logout = useAuthStore((s) => s.logout);
    return { logout };
};

/** URL OAuth pour un provider donné. */
export const getOAuthUrl = authService.getOAuthUrl;

/** Redirige vers une URL (abstrait pour faciliter les tests) */
export const redirectToUrl = (url: string) => {
    window.location.assign(url);
};
