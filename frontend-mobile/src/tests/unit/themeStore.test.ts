// Suite de tests unitaires pour le module themeStore
import { useThemeStore } from '../../store/themeStore';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Groupe de tests couvrant le store du thème (chargement, sauvegarde, bascule)
describe('themeStore', () => {
  // Réinitialise les mocks et le thème au mode clair avant chaque test
  beforeEach(() => {
    jest.clearAllMocks();
    useThemeStore.setState({ theme: 'light' });
  });

  // Tests de loadTheme : lecture du thème sauvegardé selon la plateforme
  describe('loadTheme', () => {
    it('loads light theme by default if nothing saved on native', async () => {
      Platform.OS = 'ios';
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null);
      
      await useThemeStore.getState().loadTheme();
      
      expect(useThemeStore.getState().theme).toBe('light');
    });

    it('loads dark theme if saved on native', async () => {
      Platform.OS = 'android';
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('dark');
      
      await useThemeStore.getState().loadTheme();
      
      expect(useThemeStore.getState().theme).toBe('dark');
    });

    it('handles web platform using localStorage', async () => {
      Platform.OS = 'web';
      
      // Simuler le localStorage
      const mockGetItem = jest.fn().mockReturnValue('dark');
      global.localStorage = { getItem: mockGetItem } as any;
      
      await useThemeStore.getState().loadTheme();
      
      expect(mockGetItem).toHaveBeenCalledWith('app_theme');
      expect(useThemeStore.getState().theme).toBe('dark');
      
      // Nettoyage
      global.localStorage = undefined as any;
    });

    it('gère les erreurs avec grâce', async () => {
      Platform.OS = 'ios';
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValueOnce(new Error('Failed to read'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await useThemeStore.getState().loadTheme();
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load theme', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  // Tests de setTheme : persistance du thème selon la plateforme
  describe('setTheme', () => {
    it('saves theme on native', async () => {
      Platform.OS = 'ios';
      
      await useThemeStore.getState().setTheme('dark');
      
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('app_theme', 'dark');
      expect(useThemeStore.getState().theme).toBe('dark');
    });

    it('saves theme on web using localStorage', async () => {
      Platform.OS = 'web';
      
      // Simuler le localStorage
      const mockSetItem = jest.fn();
      global.localStorage = { setItem: mockSetItem } as any;
      
      await useThemeStore.getState().setTheme('dark');
      
      expect(mockSetItem).toHaveBeenCalledWith('app_theme', 'dark');
      expect(useThemeStore.getState().theme).toBe('dark');
      
      // Nettoyage
      global.localStorage = undefined as any;
    });

    it('handles save errors gracefully', async () => {
      Platform.OS = 'ios';
      (SecureStore.setItemAsync as jest.Mock).mockRejectedValueOnce(new Error('Failed to save'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await useThemeStore.getState().setTheme('dark');
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to save theme', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  // Tests du basculement light ↔ dark
  describe('toggleTheme', () => {
    it('toggles from light to dark', async () => {
      Platform.OS = 'ios';
      useThemeStore.setState({ theme: 'light' });
      
      await useThemeStore.getState().toggleTheme();
      
      expect(useThemeStore.getState().theme).toBe('dark');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('app_theme', 'dark');
    });

    it('toggles from dark to light', async () => {
      Platform.OS = 'ios';
      useThemeStore.setState({ theme: 'dark' });
      
      await useThemeStore.getState().toggleTheme();
      
      expect(useThemeStore.getState().theme).toBe('light');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('app_theme', 'light');
    });
  });
});
