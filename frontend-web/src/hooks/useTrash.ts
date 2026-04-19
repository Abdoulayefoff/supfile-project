// Hooks React Query pour la corbeille

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    listTrash,
    restoreFile,
    restoreFolder,
    permanentDeleteFile,
    permanentDeleteFolder,
} from '@/services/trashService';

export const trashKeys = {
    all: ['trash'] as const,
};

/** Liste les éléments en corbeille. */
export const useTrashList = () =>
    useQuery({
        queryKey: trashKeys.all,
        queryFn:  listTrash,
    });

/** Restaure un fichier depuis la corbeille. */
export const useRestoreFile = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (fileId: number) => restoreFile(fileId),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: trashKeys.all });
            void qc.invalidateQueries({ queryKey: ['files'] });
            void qc.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
        },
    });
};

/** Restaure un dossier depuis la corbeille. */
export const useRestoreFolder = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (folderId: number) => restoreFolder(folderId),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: trashKeys.all });
            void qc.invalidateQueries({ queryKey: ['folders'] });
            void qc.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
        },
    });
};

/** Supprime définitivement un fichier (irréversible). */
export const usePermanentDeleteFile = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (fileId: number) => permanentDeleteFile(fileId),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: trashKeys.all });
        },
    });
};

/** Supprime définitivement un dossier (irréversible). */
export const usePermanentDeleteFolder = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (folderId: number) => permanentDeleteFolder(folderId),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: trashKeys.all });
        },
    });
};
