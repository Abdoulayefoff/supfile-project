// Service HTTP pour la gestion des fichiers — appels API purs, sans logique UI

import apiClient     from '@/lib/axios';
import type { FileItem } from '@/types';

// Types des payloads
export interface ListFilesParams {
    folderId?: number | null;
    search?:   string;
}

export interface UploadFileParams {
    file:               File;
    folderId?:          number | null;
    onUploadProgress?:  (percent: number) => void;
}

export interface RenameFileParams {
    name: string;
}

export interface MoveFileParams {
    targetFolderId: number | null;
}

// Fonctions du service

/**
 * Récupère la liste des fichiers d'un dossier (ou de la racine)
 * GET /api/files?folderId=X
 */
export const listFiles = async (params: ListFilesParams = {}): Promise<FileItem[]> => {
    const queryParams: Record<string, string> = {};

    if (params.folderId !== undefined && params.folderId !== null) {
        queryParams.folderId = String(params.folderId);
    }
    if (params.search && params.search.trim().length > 0) {
        queryParams.search = params.search.trim();
    }

    const response = await apiClient.get<FileItem[]>('/files', {
        params: queryParams,
    });

    return response.data ?? [];
};

/**
 * Upload un fichier avec suivi de progression.
 * POST /api/files  (multipart/form-data)
 */
export const uploadFile = async (params: UploadFileParams): Promise<FileItem> => {
    const formData = new FormData();
    formData.append('file', params.file);

    if (params.folderId !== undefined && params.folderId !== null) {
        formData.append('folderId', String(params.folderId));
    }

    const response = await apiClient.post<FileItem>('/files', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
            if (params.onUploadProgress && progressEvent.total) {
                const percent = Math.round(
                    (progressEvent.loaded * 100) / progressEvent.total
                );
                params.onUploadProgress(percent);
            }
        },
    });

    return response.data;
};

/**
 * Télécharge un fichier (force le téléchargement navigateur).
 * GET /api/files/{id}
 */
export const downloadFile = async (fileId: number, fileName: string): Promise<void> => {
    const response = await apiClient.get(`/files/${fileId}`, {
        responseType: 'blob',
    });

    const url  = window.URL.createObjectURL(new Blob([response.data as BlobPart]));
    const link = document.createElement('a');
    link.href  = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();

    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
};

/**
 * Construit l'URL de prévisualisation d'un fichier (token JWT dans l'URL).
 * GET /api/files/{id}/preview?token={JWT}
 */
export const getPreviewUrl = (fileId: number, token: string): string => {
    const baseUrl = import.meta.env.VITE_API_URL as string;
    return `${baseUrl}/files/${fileId}/preview?token=${encodeURIComponent(token)}`;
};

/**
 * Renomme un fichier.
 * PATCH /api/files/{id}
 */
export const renameFile = async (
    fileId: number,
    params: RenameFileParams
): Promise<FileItem> => {
    const response = await apiClient.patch<FileItem>(
        `/files/${fileId}`,
        params
    );
    return response.data;
};

/**
 * Déplace un fichier vers un autre dossier (ou à la racine).
 * PATCH /api/files/{id}/move
 */
export const moveFile = async (
    fileId: number,
    params: MoveFileParams
): Promise<FileItem> => {
    const response = await apiClient.patch<FileItem>(
        `/files/${fileId}/move`,
        params
    );
    return response.data;
};

/**
 * Supprime un fichier (soft delete → corbeille).
 * DELETE /api/files/{id}
 */
export const deleteFile = async (fileId: number): Promise<void> => {
    await apiClient.delete(`/files/${fileId}`);
};