// Hooks React Query pour le tableau de bord

import { useQuery } from '@tanstack/react-query';
import { getDashboardStats, getRecentFiles } from '@/services/dashboardService';

export const dashboardKeys = {
    stats:  ['dashboard', 'stats'] as const,
    recent: ['dashboard', 'recent'] as const,
};

/** Statistiques de stockage et quota. */
export const useDashboardStats = () =>
    useQuery({
        queryKey:        dashboardKeys.stats,
        queryFn:         getDashboardStats,
        staleTime:       0,
        refetchInterval: 30_000,
    });

/** Fichiers récemment modifiés. */
export const useRecentFiles = () =>
    useQuery({
        queryKey:        dashboardKeys.recent,
        queryFn:         getRecentFiles,
        refetchInterval: 30_000,
    });
