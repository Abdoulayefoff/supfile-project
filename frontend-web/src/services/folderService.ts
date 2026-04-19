// Service HTTP pour la gestion des dossiers — appels API purs, sans logique UI

import apiClient        from '@/lib/axios';
import type { Folder }  from '@/types';

// Types des payloads
export interface ListFoldersParams {
    parentId?: number | null;
}

export interface CreateFolderParams {
    name:      string;
    parentId?: number | null;
}

export interface RenameFolderParams {
    name: string;
}

export interface MoveFolderParams {
    targetParentId: number | null;
}

// Fonctions du service

/**
 * Récupère la liste des dossiers enfants d'un dossier parent (ou la racine)
 * GET /api/folders?parentId=X
 */
export const listFolders = async (params: ListFoldersParams = {}): Promise<Folder[]> => {
    const queryParams: Record<string, string> = {};

    if (params.parentId !== undefined && params.parentId !== null) {
        queryParams.parentId = String(params.parentId);
    }

    const response = await apiClient.get<Folder[]>('/folders', {
        params: queryParams,
    });

    return response.data ?? [];
};

/**
 * Crée un nouveau dossier
 * POST /api/folders
 */
export const createFolder = async (params: CreateFolderParams): Promise<Folder> => {
    const payload: Record<string, unknown> = {
        name: params.name.trim(),
    };

    if (params.parentId !== undefined && params.parentId !== null) {
        payload.parentId = params.parentId;
    }

    const response = await apiClient.post<Folder>('/folders', payload);
    return response.data;
};

/**
 * Télécharge un dossier entier au format ZIP
 * GET /api/folders/{id}/download
 */
export const downloadFolder = async (
    folderId:   number,
    folderName: string
): Promise<void> => {
    const response = await apiClient.get(`/folders/${folderId}/download`, {
        responseType: 'blob',
    });

    const url  = window.URL.createObjectURL(new Blob([response.data as BlobPart]));
    const link = document.createElement('a');
    link.href  = url;
    link.setAttribute('download', `${folderName}.zip`);
    document.body.appendChild(link);
    link.click();

    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
};

/**
 * Renomme un dossier
 * PATCH /api/folders/{id}
 */
export const renameFolder = async (
    folderId: number,
    params:   RenameFolderParams
): Promise<Folder> => {
    const response = await apiClient.patch<Folder>(
        `/folders/${folderId}`,
        params
    );
    return response.data;
};

/**
 * Déplace un dossier vers un autre parent (ou à la racine)
 * PATCH /api/folders/{id}/move
 */
export const moveFolder = async (
    folderId: number,
    params:   MoveFolderParams
): Promise<Folder> => {
    const response = await apiClient.patch<Folder>(
        `/folders/${folderId}/move`,
        params
    );
    return response.data;
};

/**
 * Supprime un dossier (soft delete → corbeille).
 * DELETE /api/folders/{id}
 */
export const deleteFolder = async (folderId: number): Promise<void> => {
    await apiClient.delete(`/folders/${folderId}`);
};

// Breadcrumbs
export interface BreadcrumbItem {
    id:   number;
    name: string;
}

/**
 * Retourne le fil d'Ariane d'un dossier
 * GET /api/folders/{id}/breadcrumbs
 * Réponse : [{ id, name }, ...] du parent le plus haut au dossier courant.
 */
export const getFolderBreadcrumbs = async (folderId: number): Promise<BreadcrumbItem[]> => {
    const response = await apiClient.get<BreadcrumbItem[]>(`/folders/${folderId}/breadcrumbs`);
    return response.data ?? [];
};