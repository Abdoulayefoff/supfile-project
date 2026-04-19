// Service HTTP pour le dashboard — stats et fichiers récents.
// GET /api/dashboard/stats  |  GET /api/dashboard/recent

import apiClient        from '@/lib/axios';
import type { FileItem } from '@/types';

// Types réels renvoyés par le backend

/** Réponse brute de GET /api/dashboard/stats (structure réelle backend) */
interface RawStatsResponse {
    quota: {
        used:       string; // BIGINT Doctrine → string PHP → string JSON
        limit:      string;
        percentage: number;
    };
    files:   number;
    folders: number;
}

// Types normalisés exposés au reste du frontend

/** Répartition du stockage par catégorie — renvoyée par /api/dashboard/stats/type */
export interface StatsByType {
    category:  string;        // 'images' | 'videos' | 'audio' | 'pdf' | 'documents' | etc.
    count:     number;
    totalSize: number;
}

/** Stats normalisées utilisées par DashboardPage et Sidebar */
export interface DashboardStatsResponse {
    totalFiles:      number;
    totalFolders:    number;
    quotaUsed:       number;
    quotaLimit:      number;
    quotaPercentage: number;
    statsByType:     StatsByType[];
}

// Fonctions du service

/**
 * Récupère les statistiques globales du tableau de bord.
 * GET /api/dashboard/stats
 *
 * Le backend retourne { quota: { used, limit, percentage }, files, folders }.
 * On normalise ici pour que le reste du frontend n'ait pas à connaître
 * la structure interne de la réponse API.
 */
/** Réponse brute de GET /api/dashboard/stats/type */
interface RawStatsByType {
    category:  string;
    count:     number;
    totalSize: number | string; // Doctrine SUM peut renvoyer un string
}

export const getDashboardStats = async (): Promise<DashboardStatsResponse> => {
    // Deux requêtes en parallèle pour éviter la latence en série
    const [statsRes, typeRes] = await Promise.all([
        apiClient.get<RawStatsResponse>('/dashboard/stats'),
        apiClient.get<RawStatsByType[]>('/dashboard/stats/type'),
    ]);

    const d = statsRes.data;

    const statsByType: StatsByType[] = (typeRes.data ?? []).map((row) => ({
        category:  row.category,
        count:     row.count,
        totalSize: typeof row.totalSize === 'string' ? parseInt(row.totalSize, 10) : row.totalSize,
    }));

    return {
        quotaUsed:       parseInt(d.quota.used,  10),
        quotaLimit:      parseInt(d.quota.limit, 10),
        quotaPercentage: d.quota.percentage,
        totalFiles:      d.files,
        totalFolders:    d.folders,
        statsByType,
    };
};

/**
 * Récupère les fichiers récemment ajoutés/modifiés.
 * GET /api/dashboard/recent
 *
 * Le backend retourne un tableau plat FileItem[] (pas { files: [] }).
 */
export const getRecentFiles = async (): Promise<FileItem[]> => {
    const response = await apiClient.get<FileItem[]>('/dashboard/recent');
    return Array.isArray(response.data) ? response.data : [];
};
