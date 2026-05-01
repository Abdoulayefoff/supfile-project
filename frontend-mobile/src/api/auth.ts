import apiClient, { setMemoryToken, getMemoryToken } from './client';
import * as SecureStore from 'expo-secure-store';
import { User } from '../types';
import { Platform } from 'react-native';

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

export const authApi = {
  register: async (data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<{ token: string; user: User }> => {
    const res = await apiClient.post('/auth/register', data);
    return res.data;
  },

  login: async (email: string, password: string): Promise<{ token: string }> => {
    const res = await apiClient.post('/auth/login', { email, password });
    return res.data;
  },

  getMe: async (): Promise<User> => {
    const res = await apiClient.get('/user/me');
    return res.data;
  },

  saveToken: async (token: string) => {
    setMemoryToken(token);
    storage.set('jwt_token', token).catch(console.error);
  },

  getToken: async (): Promise<string | null> => {
    const mem = getMemoryToken();
    if (mem) return mem;
    const stored = await storage.get('jwt_token');
    if (stored) setMemoryToken(stored);
    return stored;
  },

  logout: async () => {
    setMemoryToken(null);
    await storage.delete('jwt_token');
  },
};