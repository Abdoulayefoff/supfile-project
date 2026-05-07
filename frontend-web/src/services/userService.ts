// Service HTTP pour la gestion du profil utilisateur — appels API purs.

import apiClient from '@/lib/axios';
import type { User } from '@/types';

// Types des payloads

/**
 * Paramètres pour mettre à jour le profil
 * Tous les champs sont optionnels (PATCH partiel)
 * Le champ email est géré par le même endpoint PATCH /api/user/me —
 * le backend génère un nouveau token JWT si l'email change.
 */
export interface UpdateProfileParams {
    firstName?: string;
    lastName?:  string;
    theme?:     'light' | 'dark';
    email?:     string;
}

/**
 * Paramètres pour changer le mot de passe
 * Le mot de passe actuel est requis pour des raisons de sécurité
 */
export interface ChangePasswordParams {
    currentPassword: string;
    newPassword:     string;
}

// Fonctions du service

/**
 * Récupère le profil de l'utilisateur connecté.
 * GET /api/user/me
 */
export const getMe = async (): Promise<User> => {
    const response = await apiClient.get<{ user: User }>('/user/me');
    return response.data.user;
};

/**
 * Met à jour le profil (prénom, nom, thème, email).
 * PATCH /api/user/me
 *
 * Si l'email change, le backend génère un nouveau token JWT
 * et le retourne dans la réponse — penser à mettre à jour le store.
 */
export const updateProfile = async (
    params: UpdateProfileParams,
): Promise<{ user: User; token?: string }> => {
    const response = await apiClient.patch<{ user: User; token?: string }>('/user/me', params);
    return response.data;
};

/**
 * Change le mot de passe (nécessite le mot de passe actuel).
 * POST /api/user/me/password
 */
export const changePassword = async (params: ChangePasswordParams): Promise<void> => {
    await apiClient.post('/user/me/password', params);
};

/**
 * Upload un avatar utilisateur
 * POST /api/user/me/avatar  (multipart/form-data)
 *
 * @param file               - Fichier image à uploader (JPG, PNG, max 2 Mo)
 * @param onUploadProgress   - Callback optionnel pour la progression (0-100)
 */
export const uploadAvatar = async (
    file:              File,
    onUploadProgress?: (percent: number) => void,
): Promise<User> => {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await apiClient.post<{ user: User }>(
        '/user/me/avatar',
        formData,
        {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (progressEvent) => {
                if (onUploadProgress && progressEvent.total) {
                    const percent = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total,
                    );
                    onUploadProgress(percent);
                }
            },
        },
    );

    return response.data.user;
};

/**
 * Supprime définitivement le compte de l'utilisateur connecté (RGPD).
 * DELETE /api/user/me
 */
export const deleteAccount = async (): Promise<void> => {
    await apiClient.delete('/user/me');
};