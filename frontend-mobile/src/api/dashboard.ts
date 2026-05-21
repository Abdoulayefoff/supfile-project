import { apiClient } from './client';
import { DashboardStats, MimeTypeStat, FileItem } from '../types';

// Objet regroupant les appels API pour les données du tableau de bord (statistiques, fichiers récents).
export const dashboardApi = {
  // Récupère les statistiques générales (quota utilisé, total fichiers, etc.)
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get('/dashboard/stats');
    return response.data;
  },
  // Récupère la répartition du stockage par type de fichier (images, documents, etc.)
  getStatsByType: async (): Promise<MimeTypeStat[]> => {
    const response = await apiClient.get('/dashboard/stats/type');
    return response.data;
  },
  // Récupère la liste des fichiers récemment modifiés ou ajoutés
  getRecentFiles: async (): Promise<FileItem[]> => {
    const response = await apiClient.get('/dashboard/recent');
    return response.data;
  },
};
