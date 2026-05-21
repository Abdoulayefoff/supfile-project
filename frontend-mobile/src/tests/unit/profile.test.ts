// Suite de tests unitaires pour le module profile
import { profileApi } from '../../api/profile';
import { apiClient } from '../../api/client';

jest.mock('../../api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

// Groupe de tests vérifiant que chaque méthode de profileApi appelle le bon endpoint
describe('profileApi', () => {
  // Réinitialise les appels mockés avant chaque test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deleteAccount appelle le bon point de terminaison', async () => {
    (apiClient.delete as jest.Mock).mockResolvedValueOnce({ data: {} });
    await profileApi.deleteAccount();
    expect(apiClient.delete).toHaveBeenCalledWith('/user/me');
  });

  it('updateProfile appelle le bon point de terminaison', async () => {
    (apiClient.patch as jest.Mock).mockResolvedValueOnce({ data: {} });
    await profileApi.updateProfile({ firstName: 'New' });
    expect(apiClient.patch).toHaveBeenCalledWith('/user/me', { firstName: 'New' });
  });

  it('changePassword appelle le bon point de terminaison', async () => {
    (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: {} });
    await profileApi.changePassword('old', 'new');
    expect(apiClient.post).toHaveBeenCalledWith('/user/me/password', { currentPassword: 'old', newPassword: 'new' });
  });

  it('uploadAvatar appelle le bon point de terminaison', async () => {
    (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: {} });
    const formData = new FormData();
    await profileApi.uploadAvatar(formData);
    expect(apiClient.post).toHaveBeenCalledWith('/user/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  });
});
