// Suite de tests unitaires pour le module auth
import { authApi } from '../../api/auth';
import { apiClient, setMemoryToken } from '../../api/client';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

jest.mock('../../api/client', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
  },
  setMemoryToken: jest.fn(),
}));

// Groupe de tests unitaires couvrant les méthodes de l'API d'authentification
describe('authApi', () => {
  // Réinitialise les appels mockés avant chaque cas de test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Vérifie que l'endpoint et les paramètres de register sont corrects
  it('register calls correct endpoint', async () => {
    const data = { email: 'test@test.com' };
    (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: { success: true } });
    
    const result = await authApi.register(data);
    expect(apiClient.post).toHaveBeenCalledWith('/auth/register', data);
    expect(result).toEqual({ success: true });
  });

  // Vérifie que login envoie email et password au bon endpoint
  it('login calls correct endpoint', async () => {
    (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: { token: 'token' } });
    
    const result = await authApi.login('test@test.com', 'password');
    expect(apiClient.post).toHaveBeenCalledWith('/auth/login', { email: 'test@test.com', password: 'password' });
    expect(result).toEqual({ token: 'token' });
  });

  // Vérifie que getMe interroge bien /user/me
  it('getMe calls correct endpoint', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: { user: { id: 1 } } });
    
    const result = await authApi.getMe();
    expect(apiClient.get).toHaveBeenCalledWith('/user/me');
    expect(result).toEqual({ user: { id: 1 } });
  });

  // Tests de la sauvegarde du token selon la plateforme (native vs web)
  describe('saveToken', () => {
    it('saves token on native', async () => {
      Platform.OS = 'ios';
      await authApi.saveToken('token123');
      expect(setMemoryToken).toHaveBeenCalledWith('token123');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('jwt_token', 'token123');
    });

    it('saves token on web', async () => {
      Platform.OS = 'web';
      const mockSetItem = jest.fn();
      global.localStorage = { setItem: mockSetItem } as any;
      
      await authApi.saveToken('token123');
      expect(setMemoryToken).toHaveBeenCalledWith('token123');
      expect(mockSetItem).toHaveBeenCalledWith('jwt_token', 'token123');
      
      global.localStorage = undefined as any;
    });
  });

  // Tests de la lecture du token selon la plateforme
  describe('getToken', () => {
    it('gets token on native', async () => {
      Platform.OS = 'ios';
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('token123');
      
      const token = await authApi.getToken();
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('jwt_token');
      expect(token).toBe('token123');
    });

    it('gets token on web', async () => {
      Platform.OS = 'web';
      const mockGetItem = jest.fn().mockReturnValue('token123');
      global.localStorage = { getItem: mockGetItem } as any;
      
      const token = await authApi.getToken();
      expect(mockGetItem).toHaveBeenCalledWith('jwt_token');
      expect(token).toBe('token123');
      
      global.localStorage = undefined as any;
    });
  });

  // Tests de la suppression du token selon la plateforme
  describe('logout', () => {
    it('removes token on native', async () => {
      Platform.OS = 'ios';
      await authApi.logout();
      expect(setMemoryToken).toHaveBeenCalledWith(null);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('jwt_token');
    });

    it('removes token on web', async () => {
      Platform.OS = 'web';
      const mockRemoveItem = jest.fn();
      global.localStorage = { removeItem: mockRemoveItem } as any;
      
      await authApi.logout();
      expect(setMemoryToken).toHaveBeenCalledWith(null);
      expect(mockRemoveItem).toHaveBeenCalledWith('jwt_token');
      
      global.localStorage = undefined as any;
    });
  });
});
