import { apiClient } from './client';

// Objet regroupant les appels API liés au profil de l'utilisateur
export const profileApi = {
  // Appel API pour supprimer définitivement le compte utilisateur
  deleteAccount: async () => {
    const response = await apiClient.delete('/user/me');
    return response.data;
  },
  // Appel API pour mettre à jour les informations du profil (ex: prénom, nom)
  updateProfile: async (data: any) => {
    const response = await apiClient.patch('/user/me', data);
    return response.data;
  },
  // Appel API pour changer le mot de passe de l'utilisateur
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await apiClient.post('/user/me/password', { currentPassword, newPassword });
    return response.data;
  },
  // Appel API pour uploader un nouvel avatar (image de profil) en utilisant FormData
  uploadAvatar: async (formData: FormData) => {
    const response = await apiClient.post('/user/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
