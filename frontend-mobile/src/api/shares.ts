import { apiClient } from './client';
import { Share } from '../types';

// Objet regroupant les appels API relatifs au partage de fichiers et dossiers.
export const sharesApi = {
  // Récupère les partages créés par l'utilisateur courant.
  getShares: async (): Promise<Share[]> => {
    const response = await apiClient.get('/shares');
    return response.data;
  },
  // Récupère les partages reçus par l'utilisateur courant (partages privés entrants).
  getReceivedShares: async (): Promise<Share[]> => {
    const response = await apiClient.get('/shares/received');
    return response.data;
  },
  // Crée un nouveau lien de partage public ou privé.
  createShare: async (data: any): Promise<Share> => {
    const response = await apiClient.post('/shares', data);
    return response.data;
  },
  // Supprime (révoque) un partage existant.
  deleteShare: async (id: number) => {
    const response = await apiClient.delete(`/shares/${id}`);
    return response.data;
  },
  // Récupère les informations d'un partage public via son token d'accès.
  getPublicShare: async (token: string) => {
    const response = await apiClient.get(`/shares/public/${token}`);
    return response.data;
  },
  // Valide l'accès à un partage public (vérification du mot de passe si requis).
  validatePublicShare: async (token: string, password?: string) => {
    const response = await apiClient.post(`/shares/public/${token}/validate`, { password });
    return response.data;
  },
};
