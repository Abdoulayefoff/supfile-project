// Hooks React Query pour le profil utilisateur

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getMe,
    updateProfile,
    changePassword,
    uploadAvatar,
    deleteAccount,
} from '@/services/userService';

import type {
    UpdateProfileParams,
    ChangePasswordParams,
} from '@/services/userService';

import { useAuthStore } from '@/stores/authStore';

// Query keys
export const userKeys = {
    me: ['user', 'me'] as const,
};

// Hooks

/**
 * Récupère le profil de l'utilisateur connecté.
 * GET /api/user/me
 */
export const useMe = () =>
    useQuery({
        queryKey: userKeys.me,
        queryFn:  getMe,
    });

/**
 * Met à jour le profil (prénom, nom, thème).
 * PATCH /api/user/me
 * Met à jour le store Zustand + invalide le cache React Query.
 */
export const useUpdateProfile = () => {
    const qc      = useQueryClient();
    const setUser = useAuthStore((s) => s.setUser);
    const setAuth = useAuthStore((s) => s.setAuth);

    return useMutation({
        mutationFn: (params: UpdateProfileParams) => updateProfile(params),
        onSuccess: ({ user, token }) => {
            // Si un nouveau token JWT est fourni (changement d'email), on recharge la session
            if (token) {
                setAuth(token, user);
            } else {
                setUser(user);
            }
            void qc.invalidateQueries({ queryKey: userKeys.me });
        },
    });
};

/**
 * Change l'email via PATCH /api/user/me avec le champ email.
 * Réutilise le même endpoint que updateProfile.
 * Si l'email change, le backend génère un nouveau token JWT.
 */
export const useChangeEmail = () => {
    const qc      = useQueryClient();
    const setUser = useAuthStore((s) => s.setUser);
    const setAuth = useAuthStore((s) => s.setAuth);

    return useMutation({
        mutationFn: (email: string) => updateProfile({ email }),
        onSuccess: ({ user, token }) => {
            if (token) {
                setAuth(token, user);
            } else {
                setUser(user);
            }
            void qc.invalidateQueries({ queryKey: userKeys.me });
        },
    });
};

/**
 * Change le mot de passe.
 * POST /api/user/me/password
 */
export const useChangePassword = () =>
    useMutation({
        mutationFn: (params: ChangePasswordParams) => changePassword(params),
    });

/**
 * Upload un avatar utilisateur.
 * POST /api/user/me/avatar
 * Met à jour le store Zustand + invalide le cache React Query.
 */
export const useUploadAvatar = () => {
    const qc      = useQueryClient();
    const setUser = useAuthStore((s) => s.setUser);

    return useMutation({
        mutationFn: ({
            file,
            onUploadProgress,
        }: {
            file:              File;
            onUploadProgress?: (percent: number) => void;
        }) => uploadAvatar(file, onUploadProgress),

        onSuccess: (updatedUser) => {
            // Mise à jour immédiate du store global
            setUser(updatedUser);
            // Invalide le cache pour forcer un refetch propre
            void qc.invalidateQueries({ queryKey: userKeys.me });
        },
    });
};

/**
 * Supprime définitivement le compte (RGPD).
 * DELETE /api/user/me — déconnecte automatiquement après succès.
 */
export const useDeleteAccount = () => {
    const logout = useAuthStore((s) => s.logout);

    return useMutation({
        mutationFn: deleteAccount,
        onSuccess: () => {
            logout();
        },
    });
};