// Hooks React Query pour la gestion des partages.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    createShare,
    listShares,
    listReceivedShares,
    deleteShare,
    getPublicShare,
    validateSharePassword,
    downloadPublicShare,
    getPublicPreviewUrl,
} from '@/services/shareService';
import type { CreateShareParams } from '@/services/shareService';

// Query keys — centralisés pour éviter les fautes de frappe
export const shareKeys = {
    all:      ['shares']              as const,
    received: ['shares', 'received']  as const,
    public:   (token: string) => ['shares', 'public', token] as const,
};

// Hooks — partages authentifiés

/**
 * Liste tous les partages créés par l'utilisateur connecté.
 * GET /api/shares
 */
export const useShareList = () =>
    useQuery({
        queryKey: shareKeys.all,
        queryFn:  listShares,
    });

/**
 * Liste les partages reçus (partagés avec l'utilisateur connecté).
 * GET /api/shares/received
 */
export const useReceivedShares = () =>
    useQuery({
        queryKey: shareKeys.received,
        queryFn:  listReceivedShares,
    });

/**
 * Crée un partage public ou privé.
 * POST /api/shares
 * Invalide la liste des partages après succès.
 */
export const useCreateShare = () => {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (params: CreateShareParams) => createShare(params),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: shareKeys.all });
        },
    });
};

/**
 * Révoque (supprime) un partage.
 * DELETE /api/shares/{id}
 * Invalide la liste des partages après succès.
 */
export const useDeleteShare = () => {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (shareId: number) => deleteShare(shareId),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: shareKeys.all });
        },
    });
};

// Hooks — partage public (sans authentification)

/**
 * Récupère les métadonnées d'un partage public.
 * GET /api/shares/public/{token}
 *
 * Retourne soit les données complètes du partage,
 * soit { protected: true } si protégé par mot de passe.
 *
 * - retry: false car on veut gérer 404/410 immédiatement dans la page
 * - staleTime: 0 pour toujours avoir les données fraîches
 */
export const usePublicShare = (token: string) =>
    useQuery({
        queryKey: shareKeys.public(token),
        queryFn:  () => getPublicShare(token),
        enabled:  token.trim().length > 0,
        retry:    false,
        staleTime: 0,
    });

/**
 * Valide le mot de passe d'un partage public protégé.
 * POST /api/shares/public/{token}/validate
 *
 * En cas de succès, invalide le cache du partage pour forcer
 * un re-rendu avec les données complètes retournées.
 */
export const useValidateSharePassword = (token: string) => {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: ({ password }: { password: string }) =>
            validateSharePassword(token, password),

        onSuccess: (fullShareData) => {
            // Injecte directement les données complètes dans le cache
            // pour éviter un double appel réseau
            qc.setQueryData(shareKeys.public(token), fullShareData);
        },
    });
};

/**
 * Déclenche le téléchargement d'une ressource partagée publiquement.
 * GET /api/shares/public/{token}/download
 * GET /api/shares/public/{token}/download?password={password}
 */
export const useDownloadPublicShare = () =>
    useMutation({
        mutationFn: ({
            token,
            fileName,
            password,
        }: {
            token:     string;
            fileName:  string;
            password?: string;
        }) => downloadPublicShare(token, fileName, password),
    });

// Utilitaire — URL de prévisualisation publique (pas un hook React Query)

/**
 * Retourne l'URL de prévisualisation publique.
 * Utilisée directement dans les balises <img>, <video>, <audio>.
 * GET /api/shares/public/{token}/preview
 */
export { getPublicPreviewUrl };