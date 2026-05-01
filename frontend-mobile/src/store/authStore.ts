import { create } from "zustand";
import { authApi } from "../api/auth";
import { setMemoryToken } from "../api/client";
import { User } from "../types";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,

login: async (email, password) => {
  set({ isLoading: true });
  try {
    const start = Date.now();
    console.log('=== LOGIN START ===', new Date().toISOString());
    const loginStart = Date.now();
    const { token } = await authApi.login(email, password);
    console.log('Login API took:', Date.now() - loginStart, 'ms');
    await authApi.saveToken(token);
    console.log('Token sauvegardé');
    console.log('Token value:', token);
    const getMeStart = Date.now();
    const user = await authApi.getMe();
    console.log('GetMe API took:', Date.now() - getMeStart, 'ms');
    console.log('Total login time:', Date.now() - start, 'ms');
    set({ token, user, isAuthenticated: true });
    console.log('=== LOGIN SUCCESS ===');
  } catch (err: any) {
    console.log('=== LOGIN ERROR ===');
    console.log('status:', err.response?.status);
    console.log('data:', JSON.stringify(err.response?.data));
    console.log('message:', err.message);
    throw err;
  } finally {
    set({ isLoading: false });
  }
},
  register: async (data) => {
    set({ isLoading: true });
    try {
      await authApi.register(data);
    } finally {
      set({ isLoading: false });
    }
  },
  
loginWithToken: async (token: string) => {
  await authApi.saveToken(token);
  const user = await authApi.getMe();
  set({ token, user, isAuthenticated: true });
},

  logout: async () => {
    await authApi.logout();
    set({ user: null, token: null, isAuthenticated: false });
  },

loadUser: async () => {
  try {
    const token = await authApi.getToken();
    if (!token) {
      set({ isAuthenticated: false });
      return;
    }
    // Met le token en cache immédiatement
    setMemoryToken(token);
    // Marque comme authentifié de suite avec les données stockées
    set({ token, isAuthenticated: true });
    // Puis charge les infos user en arrière-plan
    authApi.getMe().then(user => {
      set({ user });
    }).catch(async () => {
      await authApi.logout();
      set({ isAuthenticated: false, user: null, token: null });
    });
  } catch {
    set({ isAuthenticated: false });
  }
},
  /*
  loadUser: async () => {
    set({ isLoading: true });
    try {
      const token = await authApi.getToken();
      if (!token) {
        set({ isAuthenticated: false });
        return;
      }
      const user = await authApi.getMe();
      set({ token, user, isAuthenticated: true });
    } catch {
      await authApi.logout();
      set({ isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },*/

  
}));
