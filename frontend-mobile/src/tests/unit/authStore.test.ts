// Suite de tests unitaires pour le module authStore
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/auth';

jest.mock('../../api/auth', () => ({
  authApi: {
    login: jest.fn(),
    register: jest.fn(),
    getMe: jest.fn(),
    logout: jest.fn(),
    saveToken: jest.fn(),
    getToken: jest.fn(),
    removeToken: jest.fn(),
  },
}));

// Groupe de tests couvrant les actions du store d'authentification Zustand
describe('authStore', () => {
  // Réinitialise le store à l'état déconnecté avant chaque test
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  // Vérifie que le store part bien d'un état non-authentifié
  it('l\'état initial est correct', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  // Vérifie que updateUser remplace bien l'objet user dans le store
  it('updateUser met à jour l\'utilisateur dans l\'état', () => {
    const mockUser = { id: 1, email: 'test@test.com', firstName: 'Test', lastName: 'User' } as any;
    useAuthStore.getState().updateUser(mockUser);
    
    expect(useAuthStore.getState().user).toEqual(mockUser);
  });

  // Vérifie que login() met à jour le token, l'user et isAuthenticated
  it('login met à jour l\'état en cas de succès', async () => {
    const mockResponse = {
      token: 'fake-token',
      user: { id: 1, email: 'test@test.com' },
    };
    (authApi.login as jest.Mock).mockResolvedValueOnce(mockResponse);
    (authApi.getMe as jest.Mock).mockResolvedValueOnce({ user: mockResponse.user });

    await useAuthStore.getState().login('test@test.com', 'password123');

    const state = useAuthStore.getState();
    expect(state.token).toBe('fake-token');
    expect(state.user).toEqual(mockResponse.user);
    expect(state.isAuthenticated).toBe(true);
    expect(authApi.saveToken).toHaveBeenCalledWith('fake-token');
  });

  // Vérifie que logout() vide le store et appelle authApi.logout
  it('logout efface l\'état', async () => {
    // Configurer l'état initial connecté
    useAuthStore.setState({
      user: { id: 1, email: 'test@test.com' } as any,
      token: 'fake-token',
      isAuthenticated: true,
    });

    await useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(authApi.logout).toHaveBeenCalled();
  });
  it('register appelle authApi.register', async () => {
    const data = { email: 'test@test.com' };
    await useAuthStore.getState().register(data);
    expect(authApi.register).toHaveBeenCalledWith(data);
  });

  // Tests de la vérification du token sauvegardé au démarrage
  describe('checkAuth', () => {
    it('définit l\'état correctement quand le jeton existe', async () => {
      const mockUser = { id: 1, email: 'test@test.com' };
      (authApi.getToken as jest.Mock).mockResolvedValueOnce('saved-token');
      (authApi.getMe as jest.Mock).mockResolvedValueOnce({ user: mockUser });

      await useAuthStore.getState().checkAuth();

      const state = useAuthStore.getState();
      expect(state.token).toBe('saved-token');
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(authApi.saveToken).toHaveBeenCalledWith('saved-token');
    });

    it('définit l\'état correctement quand le jeton n\'existe pas', async () => {
      (authApi.getToken as jest.Mock).mockResolvedValueOnce(null);

      await useAuthStore.getState().checkAuth();

      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it('gère les erreurs avec grâce', async () => {
      (authApi.getToken as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await useAuthStore.getState().checkAuth();

      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      
      consoleSpy.mockRestore();
    });
  });

  // Vérifie que setOAuthSession sauvegarde le token et met à jour le store
  it('setOAuthSession sauvegarde le jeton et met à jour l\'état', async () => {
    const mockUser = { id: 1, email: 'oauth@test.com' } as any;
    await useAuthStore.getState().setOAuthSession('oauth-token', mockUser);

    const state = useAuthStore.getState();
    expect(authApi.saveToken).toHaveBeenCalledWith('oauth-token');
    expect(state.token).toBe('oauth-token');
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
  });
});
