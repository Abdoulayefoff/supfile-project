// Hooks React Query pour les opérations sur les dossiers

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    listFolders,
    createFolder,
    renameFolder,
    moveFolder,
    deleteFolder,
    downloadFolder,
    getFolderBreadcrumbs,
} from '@/services/folderService';
import type {
    ListFoldersParams,
    CreateFolderParams,
    RenameFolderParams,
    MoveFolderParams,
} from '@/services/folderService';

// Query keys centralisés
export const folderKeys = {
    all:        ['folders'] as const,
    list:       (params: ListFoldersParams) => ['folders', params] as const,
    browse:     (folderId: number | null) => ['folders-browse', folderId] as const,
    breadcrumb: (folderId: number) => ['breadcrumbs', folderId] as const,
};

// Queries
/** Liste les dossiers d'un parent ou de la racine. */
export const useFolderList = (params: ListFoldersParams = {}) =>
    useQuery({
        queryKey: folderKeys.list(params),
        queryFn:  () => listFolders(params),
    });

/** Liste les dossiers pour la navigation dans MoveModal (queryKey distinct). */
export const useFolderBrowse = (folderId: number | null) =>
    useQuery({
        queryKey: folderKeys.browse(folderId),
        queryFn:  () => listFolders({ parentId: folderId }),
    });

/** Récupère le fil d'Ariane d'un dossier. */
export const useFolderBreadcrumbs = (folderId: number | undefined) =>
    useQuery({
        queryKey: folderKeys.breadcrumb(folderId ?? 0),
        queryFn:  () => getFolderBreadcrumbs(folderId!),
        enabled:  folderId !== undefined,
    });

// Mutations
/** Crée un nouveau dossier. */
export const useCreateFolder = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (params: CreateFolderParams) => createFolder(params),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: folderKeys.all });
        },
    });
};

/** Renomme un dossier. */
export const useRenameFolder = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ folderId, params }: { folderId: number; params: RenameFolderParams }) =>
            renameFolder(folderId, params),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: folderKeys.all });
        },
    });
};

/** Déplace un dossier. */
export const useMoveFolder = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ folderId, params }: { folderId: number; params: MoveFolderParams }) =>
            moveFolder(folderId, params),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: folderKeys.all });
            void qc.invalidateQueries({ queryKey: ['files'] });
            void qc.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
};

/** Supprime un dossier (soft delete → corbeille). */
export const useDeleteFolder = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (folderId: number) => deleteFolder(folderId),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: folderKeys.all });
            void qc.invalidateQueries({ queryKey: ['dashboard'] });
            void qc.invalidateQueries({ queryKey: ['trash'] });
        },
    });
};

/** Télécharge un dossier en ZIP. */
export const useDownloadFolder = () =>
    useMutation({
        mutationFn: ({ folderId, folderName }: { folderId: number; folderName: string }) =>
            downloadFolder(folderId, folderName),
    });
