import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.0.22:8000/api';

// Cache mémoire simple
let memoryToken: string | null = null;

export const setMemoryToken = (token: string | null) => {
  memoryToken = token;
};

export const getMemoryToken = () => memoryToken;

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
 timeout: 30000,
});

// Intercepteur synchrone — utilise le cache mémoire uniquement
apiClient.interceptors.request.use((config) => {
  if (memoryToken) {
    config.headers.Authorization = `Bearer ${memoryToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      memoryToken = null;
      await SecureStore.deleteItemAsync('jwt_token');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
export { API_URL };
