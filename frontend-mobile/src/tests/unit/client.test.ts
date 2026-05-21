// Suite de tests unitaires pour le module client
import { apiClient, setMemoryToken, getMemoryToken } from '../../api/client';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Nous devons accéder aux intercepteurs pour les tests
const requestInterceptor = (apiClient.interceptors.request as any).handlers[0];
const responseInterceptor = (apiClient.interceptors.response as any).handlers[0];

// Groupe de tests couvrant la configuration et les intercepteurs d'Axios
describe('api client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setMemoryToken(null);
  });

  // Tests de la gestion du token en mémoire vive
  describe('token management', () => {
    it('définit et obtient le jeton en mémoire', () => {
      setMemoryToken('test-token');
      expect(getMemoryToken()).toBe('test-token');
      
      setMemoryToken(null);
      expect(getMemoryToken()).toBeNull();
    });
  });

  // Tests de l'intercepteur de requête (ajout du header Authorization)
  describe('request interceptor', () => {
    it('ajoute l\'en-tête Authorization si le jeton mémoire existe', async () => {
      setMemoryToken('test-token');
      const config = { headers: {} };
      
      const updatedConfig = await requestInterceptor.fulfilled(config);
      
      expect(updatedConfig.headers.Authorization).toBe('Bearer test-token');
    });

    it('n\'ajoute pas l\'en-tête Authorization s\'il n\'y a pas de jeton', async () => {
      setMemoryToken(null);
      const config = { headers: {} };
      
      const updatedConfig = await requestInterceptor.fulfilled(config);
      
      expect(updatedConfig.headers.Authorization).toBeUndefined();
    });

    it('gère les erreurs de requête', async () => {
      const error = new Error('Request error');
      await expect(requestInterceptor.rejected(error)).rejects.toThrow('Request error');
    });
  });

  // Tests de l'intercepteur de réponse (gestion 401, effacement du token)
  describe('response interceptor', () => {
    it('laisse passer les réponses réussies', async () => {
      const response = { data: 'test' };
      const result = await responseInterceptor.fulfilled(response);
      expect(result).toBe(response);
    });

    it('supprime le jeton sur l\'erreur 401 en natif', async () => {
      Platform.OS = 'ios';
      setMemoryToken('test-token');
      
      const error = {
        response: { status: 401 },
      };
      
      await expect(responseInterceptor.rejected(error)).rejects.toEqual(error);
      
      expect(getMemoryToken()).toBeNull();
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('jwt_token');
    });

    it('supprime le jeton sur l\'erreur 401 sur le web', async () => {
      Platform.OS = 'web';
      setMemoryToken('test-token');
      
      const mockRemoveItem = jest.fn();
      global.localStorage = { removeItem: mockRemoveItem } as any;
      
      const error = {
        response: { status: 401 },
      };
      
      await expect(responseInterceptor.rejected(error)).rejects.toEqual(error);
      
      expect(getMemoryToken()).toBeNull();
      expect(mockRemoveItem).toHaveBeenCalledWith('jwt_token');
      
      global.localStorage = undefined as any;
    });

    it('laisse passer d\'autres erreurs sans supprimer le jeton', async () => {
      setMemoryToken('test-token');
      
      const error = {
        response: { status: 500 },
      };
      
      await expect(responseInterceptor.rejected(error)).rejects.toEqual(error);
      
      expect(getMemoryToken()).toBe('test-token');
      expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
    });
    
    it('gère l\'erreur SecureStore avec grâce sur 401', async () => {
      Platform.OS = 'ios';
      setMemoryToken('test-token');
      (SecureStore.deleteItemAsync as jest.Mock).mockRejectedValueOnce(new Error('Failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const error = {
        response: { status: 401 },
      };
      
      await expect(responseInterceptor.rejected(error)).rejects.toEqual(error);
      
      expect(getMemoryToken()).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to remove token', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });
});
