// Hooks pour l'authentification (login, register, logout, reset mot de passe)
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

/**
 * Envoie l'email de réinitialisation de mot de passe.
 * Le backend retourne toujours 200 même si l'email n'existe pas (anti-énumération).
 * Le frontend affiche un message générique dans tous les cas.
 */
export const useForgotPassword = () => {
    return useMutation({
        mutationFn: (email: string) => authService.forgotPassword(email),
    });
};

/**
 * Réinitialise le mot de passe avec le token reçu par email.
 * Le token est extrait de l'URL par ResetPasswordPage et transmis ici.
 * Le backend vérifie que le token est valide, non expiré et non encore utilisé.
 */
export const useResetPassword = () => {
    return useMutation({
        mutationFn: ({ token, password }: { token: string; password: string }) =>
            authService.resetPassword(token, password),
    });
};