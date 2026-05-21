import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Définition de l'état pour la gestion du mode clair / sombre
interface ThemeState {
  theme: 'light' | 'dark';
  loadTheme: () => Promise<void>; // Charge le thème depuis le stockage local
  setTheme: (theme: 'light' | 'dark') => Promise<void>; // Force un thème et le sauvegarde
  toggleTheme: () => Promise<void>; // Alterne entre clair et sombre
}

// Création du store Zustand pour le thème (persistant)
export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light', // Thème par défaut
  // Récupère la préférence de thème au démarrage de l'app
  loadTheme: async () => {
    try {
      let savedTheme: string | null = null;
      if (Platform.OS === 'web') {
        savedTheme = localStorage.getItem('app_theme');
      } else {
        savedTheme = await SecureStore.getItemAsync('app_theme');
      }
      if (savedTheme === 'dark') {
        set({ theme: 'dark' });
      } else {
        set({ theme: 'light' });
      }
    } catch (e) {
      console.error('Failed to load theme', e);
    }
  },
  // Définit et sauvegarde le thème de manière persistante (Web = localStorage, Mobile = SecureStore)
  setTheme: async (theme) => {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem('app_theme', theme);
      } else {
        await SecureStore.setItemAsync('app_theme', theme);
      }
      set({ theme });
    } catch (e) {
      console.error('Failed to save theme', e);
    }
  },
  // Action utilitaire pour basculer rapidement d'un thème à l'autre
  toggleTheme: async () => {
    const newTheme = get().theme === 'light' ? 'dark' : 'light';
    await get().setTheme(newTheme);
  },
}));
