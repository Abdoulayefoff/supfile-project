import { apiClient } from './client';
import { FileItem, FolderItem, Breadcrumb } from '../types';

// Objet regroupant les appels API concernant la gestion des fichiers et dossiers.
export const filesApi = {
  // Récupère la liste des fichiers, avec filtres optionnels sur le dossier parent et la recherche.
  getFiles: async (folderId?: number, search?: string): Promise<FileItem[]> => {
    const params = new URLSearchParams();
    if (folderId) params.append('folderId', folderId.toString());
    if (search) params.append('search', search);
    const response = await apiClient.get(`/files?${params.toString()}`);
    return response.data;
  },
  // Récupère la liste des dossiers pour un parent donné.
  getFolders: async (parentId?: number): Promise<FolderItem[]> => {
    const params = new URLSearchParams();
    if (parentId) params.append('parentId', parentId.toString());
    const response = await apiClient.get(`/folders?${params.toString()}`);
    return response.data;
  },
  // Récupère le fil d'Ariane (chemin complet) pour un dossier spécifique.
  getBreadcrumbs: async (folderId: number): Promise<Breadcrumb[]> => {
    const response = await apiClient.get(`/folders/${folderId}/breadcrumbs`);
    return response.data;
  },
  // Crée un nouveau dossier.
  createFolder: async (name: string, parentId?: number | null): Promise<FolderItem> => {
    const response = await apiClient.post('/folders', { name, parentId });
    return response.data;
  },
  // Téléverse (upload) un nouveau fichier, potentiellement dans un dossier précis.
  uploadFile: async (
    fileUri: string, // Chemin local du fichier sur l'appareil
    mimeType: string,
    name: string,
    folderId?: number | null,
    onProgress?: (percent: number) => void, // Callback pour afficher la barre de progression
  ): Promise<FileItem> => {
    const formData = new FormData();
    // Création d'un objet formaté que l'API FormData de React Native comprend
    formData.append('file', {
      uri: fileUri,
      type: mimeType || 'application/octet-stream',
      name: name,
    } as any);

    if (folderId) {
      formData.append('folderId', folderId.toString());
    }

    const response = await apiClient.post('/files', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        // Calcul du pourcentage et appel du callback si fourni
        if (onProgress && event.total && event.total > 0) {
          onProgress(Math.round((event.loaded * 100) / event.total));
        }
      },
    });
    return response.data;
  },
  // Modifie le nom d'un fichier existant.
  renameFile: async (id: number, name: string): Promise<FileItem> => {
    const response = await apiClient.patch(`/files/${id}`, { name });
    return response.data;
  },
  // Modifie le nom d'un dossier existant.
  renameFolder: async (id: number, name: string): Promise<FolderItem> => {
    const response = await apiClient.patch(`/folders/${id}`, { name });
    return response.data;
  },
  // Envoie un fichier à la corbeille (Soft Delete).
  deleteFile: async (id: number) => {
    const response = await apiClient.delete(`/files/${id}`);
    return response.data;
  },
  // Envoie un dossier à la corbeille (Soft Delete).
  deleteFolder: async (id: number) => {
    const response = await apiClient.delete(`/folders/${id}`);
    return response.data;
  },
  // Déplace un fichier vers un autre dossier.
  moveFile: async (id: number, targetFolderId?: number | null) => {
    const response = await apiClient.patch(`/files/${id}/move`, { targetFolderId });
    return response.data;
  },
  // Déplace un dossier dans un autre dossier parent.
  moveFolder: async (id: number, targetParentId?: number | null) => {
    const response = await apiClient.patch(`/folders/${id}/move`, { targetParentId });
    return response.data;
  },
  // Demande le téléchargement d'un dossier complet (au format ZIP par le backend).
  downloadFolder: async (id: number) => {
    const response = await apiClient.get(`/folders/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
