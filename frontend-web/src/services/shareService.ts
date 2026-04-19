// Service HTTP pour la gestion des partages — appels API purs, sans logique UI

import apiClient from '@/lib/axios';
import type { Share } from '@/types';

// Types

/**
 * Paramètres de création d'un partage.
 * Le backend attend `type` (file|folder) + `resourceId`.
 * - Partage public  : isPublic=true, password optionnel
 * - Partage privé   : sharedWithEmail requis
 */
export interface CreateShareParams {
    type:             'file' | 'folder';
    resourceId:       number;
    isPublic?:        boolean;
    sharedWithEmail?: string;
    password?:        string;
    expiresAt?:       string;           // format ISO 8601
}

/**
 * Ressource associée à un partage public.
 * mimeType et size sont absents si c'est un dossier.
 */
export interface PublicShareResource {
    id:       number;
    name:     string;
    mimeType?: string;
    size?:    number;
}

/**
 * Réponse quand le partage est protégé par mot de passe
 * et qu'aucun mot de passe n'a encore été fourni.
 */
export interface ProtectedShareResponse {
    protected:    true;
    token:        string;
    resourceType: 'file' | 'folder';
}

/**
 * Réponse complète de GET /api/shares/public/{token} (sans protection)
 * ou de POST /api/shares/public/{token}/validate (après validation).
 */
export interface PublicShareResponse {
    id:           number;
    token:        string;
    isPublic:     boolean;
    hasPassword:  boolean;
    expiresAt:    string | null;
    createdAt:    string;
    resourceType: 'file' | 'folder';
    resource:     PublicShareResource | null;
    sharedWith:   null;
}

/**
 * Union des deux réponses possibles de GET /api/shares/public/{token}.
 */
export type PublicAccessResponse = ProtectedShareResponse | PublicShareResponse;

/**
 * Partage reçu (partagé avec moi).
 */
export interface ReceivedShare {
    id:           number;
    token:        string;
    isPublic:     boolean;
    hasPassword:  boolean;
    expiresAt:    string | null;
    createdAt:    string;
    resourceType: 'file' | 'folder';
    resource:     PublicShareResource | null;
    /** Personne qui a créé le partage (l'expéditeur). */
    createdBy: {
        id:       number;
        email:    string;
        fullName: string;
    };
    sharedWith: {
        id:       number;
        email:    string;
        fullName: string;
    } | null;
}

// Partages authentifiés

/**
 * Crée un partage (public ou privé)
 * POST /api/shares
 */
export const createShare = async (params: CreateShareParams): Promise<Share> => {
    const response = await apiClient.post<Share>('/shares', params);
    return response.data;
};

/**
 * Liste tous les partages créés par l'utilisateur connecté
 * GET /api/shares
 */
export const listShares = async (): Promise<Share[]> => {
    const response = await apiClient.get<Share[]>('/shares');
    return response.data ?? [];
};

/**
 * Liste les partages reçus (partagés avec l'utilisateur connecté)
 * GET /api/shares/received
 */
export const listReceivedShares = async (): Promise<ReceivedShare[]> => {
    const response = await apiClient.get<ReceivedShare[]>('/shares/received');
    return response.data ?? [];
};

/**
 * Révoque (supprime) un partage
 * DELETE /api/shares/{id}
 */
export const deleteShare = async (shareId: number): Promise<void> => {
    await apiClient.delete(`/shares/${shareId}`);
};

// Partage public — sans authentification

/**
 * Accède à un partage public.
 * Retourne soit les données complètes, soit { protected: true }
 * si le partage est protégé par mot de passe.
 * GET /api/shares/public/{token}
 */
export const getPublicShare = async (
    token: string,
): Promise<PublicAccessResponse> => {
    const baseURL = (import.meta.env.VITE_API_URL as string | undefined)
        ?? 'http://localhost:8000/api';

    const url = new URL(
        `${baseURL}/shares/public/${encodeURIComponent(token)}`,
    );

    const response = await fetch(url.toString(), {
        method:  'GET',
        headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
        const error = new Error(`HTTP ${response.status}`);
        (error as Error & { status: number }).status = response.status;
        throw error;
    }

    return response.json() as Promise<PublicAccessResponse>;
};

/**
 * Valide le mot de passe d'un partage public protégé
 * Retourne les données complètes du partage si le mot de passe est correct
 * POST /api/shares/public/{token}/validate
 */
export const validateSharePassword = async (
    token:    string,
    password: string,
): Promise<PublicShareResponse> => {
    const baseURL = (import.meta.env.VITE_API_URL as string | undefined)
        ?? 'http://localhost:8000/api';

    const response = await fetch(
        `${baseURL}/shares/public/${encodeURIComponent(token)}/validate`,
        {
            method:  'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept':       'application/json',
            },
            body: JSON.stringify({ password }),
        },
    );

    if (!response.ok) {
        const error = new Error(`HTTP ${response.status}`);
        (error as Error & { status: number }).status = response.status;
        throw error;
    }

    return response.json() as Promise<PublicShareResponse>;
};

/**
 * Déclenche le téléchargement d'une ressource partagée publiquement
 * POST /api/shares/public/{token}/download
 */
export const downloadPublicShare = async (
    token:     string,
    fileName:  string,
    password?: string,
): Promise<void> => {
    const baseURL = (import.meta.env.VITE_API_URL as string | undefined)
        ?? 'http://localhost:8000/api';

    const url = `${baseURL}/shares/public/${encodeURIComponent(token)}/download`;

    const body: Record<string, string> = {};
    if (password && password.trim().length > 0) {
        body.password = password.trim();
    }

    const response = await fetch(url, {
        method:  'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept':       '*/*',
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const error = new Error(`Erreur téléchargement HTTP ${response.status}`);
        (error as Error & { status: number }).status = response.status;
        throw error;
    }

    const blob   = await response.blob();
    const href   = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href     = href;
    anchor.download = fileName;

    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    // Libération mémoire après traitement par le navigateur
    setTimeout(() => URL.revokeObjectURL(href), 10_000);
};

/**
 * Retourne l'URL de prévisualisation publique d'un partage
 * Utilisée directement dans les balises <img>, <video>, <audio>
 * GET /api/shares/public/{token}/preview
 */
export const getPublicPreviewUrl = (
    token:     string,
    password?: string,
): string => {
    const baseURL = (import.meta.env.VITE_API_URL as string | undefined)
        ?? 'http://localhost:8000/api';

    const url = new URL(
        `${baseURL}/shares/public/${encodeURIComponent(token)}/preview`,
    );

    if (password && password.trim().length > 0) {
        url.searchParams.set('password', password.trim());
    }

    return url.toString();
};