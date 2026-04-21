import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDashboardStats, useRecentFiles } from '@/hooks/useDashboard';
import * as dashboardService from '@/services/dashboardService';
import type { FileItem } from '@/types';
import type { DashboardStatsResponse } from '@/services/dashboardService';

jest.mock('@/services/dashboardService', () => ({
    getDashboardStats: jest.fn(),
    getRecentFiles: jest.fn(),
}));

const mockedGetDashboardStats = dashboardService.getDashboardStats as jest.MockedFunction<
    typeof dashboardService.getDashboardStats
>;
const mockedGetRecentFiles = dashboardService.getRecentFiles as jest.MockedFunction<
    typeof dashboardService.getRecentFiles
>;

const makeStats = (overrides: Partial<DashboardStatsResponse> = {}): DashboardStatsResponse => ({
    totalFiles: 10,
    totalFolders: 3,
    quotaUsed: 5_000_000,
    quotaLimit: 10_737_418_240,
    quotaPercentage: 0.05,
    statsByType: [],
    ...overrides,
});

const makeFile = (overrides: Partial<FileItem> = {}): FileItem => ({
    id: 1,
    name: 'recent.pdf',
    size: 1024,
    mimeType: 'application/pdf',
    folderId: null,
    isDeleted: false,
    deletedAt: null,
    createdAt: '2026-04-20T10:00:00Z',
    updatedAt: '2026-04-20T10:00:00Z',
    humanReadableSize: '1 Ko',
    extension: 'pdf',
    isImage: false,
    isVideo: false,
    isAudio: false,
    isPdf: true,
    ...overrides,
});

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

beforeEach(() => {
    jest.clearAllMocks();
    // Éviter les timers réels (refetchInterval) dans les tests
    jest.useFakeTimers();
});

afterEach(() => {
    jest.useRealTimers();
});

// ─── useDashboardStats 

describe('useDashboardStats()', () => {
    it('appelle getDashboardStats et retourne les stats', async () => {
        const stats = makeStats();
        mockedGetDashboardStats.mockResolvedValueOnce(stats);

        const { result } = renderHook(() => useDashboardStats(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(mockedGetDashboardStats).toHaveBeenCalledTimes(1);
        expect(result.current.data?.totalFiles).toBe(10);
        expect(result.current.data?.totalFolders).toBe(3);
    });

    it('retourne les données de quota correctement', async () => {
        const stats = makeStats({ quotaUsed: 1_000_000, quotaLimit: 10_737_418_240, quotaPercentage: 0.01 });
        mockedGetDashboardStats.mockResolvedValueOnce(stats);

        const { result } = renderHook(() => useDashboardStats(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data?.quotaUsed).toBe(1_000_000);
        expect(result.current.data?.quotaPercentage).toBe(0.01);
    });

    it('configure refetchInterval à 30 secondes', async () => {
        mockedGetDashboardStats.mockResolvedValue(makeStats());

        const { result } = renderHook(() => useDashboardStats(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        const initialCallCount = mockedGetDashboardStats.mock.calls.length;

        // Avancer de 30s pour déclencher le refetch
        jest.advanceTimersByTime(30_000);

        await waitFor(() => {
            expect(mockedGetDashboardStats.mock.calls.length).toBeGreaterThan(initialCallCount);
        });
    });

    it('expose l\'erreur si le service échoue', async () => {
        mockedGetDashboardStats.mockRejectedValueOnce(new Error('Erreur serveur'));

        const { result } = renderHook(() => useDashboardStats(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isError).toBe(true));
    });
});

// ─── useRecentFiles 

describe('useRecentFiles()', () => {
    it('appelle getRecentFiles et retourne les fichiers récents', async () => {
        const files = [makeFile(), makeFile({ id: 2, name: 'photo.jpg' })];
        mockedGetRecentFiles.mockResolvedValueOnce(files);

        const { result } = renderHook(() => useRecentFiles(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toHaveLength(2);
        expect(mockedGetRecentFiles).toHaveBeenCalledTimes(1);
    });

    it('configure refetchInterval à 30 secondes', async () => {
        mockedGetRecentFiles.mockResolvedValue([]);

        const { result } = renderHook(() => useRecentFiles(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        const initialCallCount = mockedGetRecentFiles.mock.calls.length;

        jest.advanceTimersByTime(30_000);

        await waitFor(() => {
            expect(mockedGetRecentFiles.mock.calls.length).toBeGreaterThan(initialCallCount);
        });
    });

    it('retourne un tableau vide si aucun fichier récent', async () => {
        mockedGetRecentFiles.mockResolvedValueOnce([]);

        const { result } = renderHook(() => useRecentFiles(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual([]);
    });

    it('expose l\'erreur si le service échoue', async () => {
        mockedGetRecentFiles.mockRejectedValueOnce(new Error('Erreur réseau'));

        const { result } = renderHook(() => useRecentFiles(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isError).toBe(true));
    });
});
