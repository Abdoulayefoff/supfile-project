// Service HTTP pour la corbeille — appels API purs, sans logique UI

import apiClient from '@/lib/axios';
export interface TrashItem {
    id:        number;
    name:      string;
    deletedAt: string | null;
    size?:     number;
    mimeType?: string;
}

export interface TrashResponse {
    files:   TrashItem[];
    folders: TrashItem[];
}

/**
 * Liste les fichiers et dossiers dans la corbeille.
 * GET /api/trash
 */
export const listTrash = async (): Promise<TrashResponse> => {
    const response = await apiClient.get<TrashResponse>('/trash');
    return response.data;
};

/**
 * Restaure un fichier depuis la corbeille.
 * POST /api/trash/files/{id}/restore
 */
export const restoreFile = async (fileId: number): Promise<void> => {
    await apiClient.post(`/trash/files/${fileId}/restore`);
};

/**
 * Restaure un dossier depuis la corbeille.
 * POST /api/trash/folders/{id}/restore
 */
export const restoreFolder = async (folderId: number): Promise<void> => {
    await apiClient.post(`/trash/folders/${folderId}/restore`);
};

/**
 * Supprime définitivement un fichier (irréversible).
 * DELETE /api/trash/files/{id}
 */
export const permanentDeleteFile = async (fileId: number): Promise<void> => {
    await apiClient.delete(`/trash/files/${fileId}`);
};

/**
 * Supprime définitivement un dossier (irréversible).
 * DELETE /api/trash/folders/{id}
 */
export const permanentDeleteFolder = async (folderId: number): Promise<void> => {
    await apiClient.delete(`/trash/folders/${folderId}`);
};
