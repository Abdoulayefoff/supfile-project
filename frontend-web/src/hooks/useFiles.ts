// Hooks React Query pour les opérations sur les fichiers

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    listFiles,
    uploadFile,
    renameFile,
    moveFile,
    deleteFile,
    downloadFile,
    getPreviewUrl,
} from '@/services/fileService';
import type {
    ListFilesParams,
    UploadFileParams,
    RenameFileParams,
    MoveFileParams,
} from '@/services/fileService';

// Query keys centralisés
export const fileKeys = {
    all:  ['files'] as const,
    list: (params: ListFilesParams) => ['files', params] as const,
};

// Queries
/** Liste les fichiers d'un dossier ou de la racine. */
export const useFileList = (params: ListFilesParams = {}) =>
    useQuery({
        queryKey: fileKeys.list(params),
        queryFn:  () => listFiles(params),
    });

// Mutations
/** Upload un fichier avec suivi de progression. */
export const useUploadFile = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (params: UploadFileParams) => uploadFile(params),
        onSuccess: () => {
            void qc.refetchQueries({ queryKey: fileKeys.all });
            void qc.refetchQueries({ queryKey: ['dashboard', 'stats'] });
            void qc.refetchQueries({ queryKey: ['dashboard', 'recent'] });
        },
    });
};

/** Renomme un fichier. */
export const useRenameFile = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ fileId, params }: { fileId: number; params: RenameFileParams }) =>
            renameFile(fileId, params),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: fileKeys.all });
        },
    });
};

/** Déplace un fichier. */
export const useMoveFile = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ fileId, params }: { fileId: number; params: MoveFileParams }) =>
            moveFile(fileId, params),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: fileKeys.all });
            void qc.invalidateQueries({ queryKey: ['folders'] });
            void qc.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
};

/** Supprime un fichier (soft delete → corbeille). */
export const useDeleteFile = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (fileId: number) => deleteFile(fileId),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: fileKeys.all });
            void qc.invalidateQueries({ queryKey: ['dashboard'] });
            void qc.invalidateQueries({ queryKey: ['trash'] });
        },
    });
};

/** Déclenche le téléchargement d'un fichier. */
export const useDownloadFile = () =>
    useMutation({
        mutationFn: ({ fileId, fileName }: { fileId: number; fileName: string }) =>
            downloadFile(fileId, fileName),
    });

/** Retourne l'URL de prévisualisation d'un fichier. */
export { getPreviewUrl };
