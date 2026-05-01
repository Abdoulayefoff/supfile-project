import apiClient, { API_URL, getMemoryToken } from './client';
import { User } from '../types';

export const profileApi = {
  updateProfile: async (data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    theme?: 'light' | 'dark';
  }): Promise<User> => {
    const res = await apiClient.patch('/user/me', data);
    return res.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiClient.post('/user/me/password', { currentPassword, newPassword });
  },

  uploadAvatar: async (uri: string, mimeType: string): Promise<{ avatar: string }> => {
    const token = getMemoryToken();
    const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const mime = mimeType ?? (ext === 'png' ? 'image/png' : 'image/jpeg');

    const formData = new FormData();
    formData.append('avatar', {
      uri,
      type: mime,
      name: `avatar.${ext}`,
    } as any);

    const response = await fetch(`${API_URL}/user/me/avatar`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        // Ne PAS mettre Content-Type ici — fetch le gère automatiquement avec FormData
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Erreur ${response.status}: ${error}`);
    }

    return response.json();
  },
};