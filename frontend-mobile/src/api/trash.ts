import { apiClient } from './client';

// Objet regroupant les appels API pour gérer la corbeille (Soft delete / Hard delete).
export const trashApi = {
  // Récupère tous les éléments (fichiers et dossiers) actuellement dans la corbeille.
  getTrash: async () => {
    const response = await apiClient.get('/trash');
    return response.data;
  },
  // Restaure un fichier supprimé à son emplacement d'origine.
  restoreFile: async (id: number) => {
    const response = await apiClient.post(`/trash/files/${id}/restore`);
    return response.data;
  },
  // Restaure un dossier supprimé à son emplacement d'origine.
  restoreFolder: async (id: number) => {
    const response = await apiClient.post(`/trash/folders/${id}/restore`);
    return response.data;
  },
  // Supprime définitivement (hard delete) un fichier du stockage et de la base de données.
  deleteFile: async (id: number) => {
    const response = await apiClient.delete(`/trash/files/${id}`);
    return response.data;
  },
  // Supprime définitivement (hard delete) un dossier et tout son contenu du stockage.
  deleteFolder: async (id: number) => {
    const response = await apiClient.delete(`/trash/folders/${id}`);
    return response.data;
  },
};
