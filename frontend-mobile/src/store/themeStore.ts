import { create } from 'zustand';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => Promise<void>;
  loadTheme: () => Promise<void>;
  setTheme: (theme: Theme) => Promise<void>;
}

// Stockage compatible web + mobile
const storage = {
  get: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') return localStorage.getItem(key);
    return SecureStore.getItemAsync(key);
  },
  set: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') { localStorage.setItem(key, value); return; }
    await SecureStore.setItemAsync(key, value);
  },
  delete: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') { localStorage.removeItem(key); return; }
    await SecureStore.deleteItemAsync(key);
  },
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light',

  loadTheme: async () => {
    const saved = await storage.get('app_theme');
    if (saved === 'dark' || saved === 'light') {
      set({ theme: saved });
    }
  },

  setTheme: async (theme) => {
    await storage.set('app_theme', theme);
    set({ theme });
  },

  toggleTheme: async () => {
    const next = get().theme === 'light' ? 'dark' : 'light';
    await storage.set('app_theme', next);
    set({ theme: next });
  },
}));