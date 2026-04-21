import {
    getDashboardStats,
    getRecentFiles,
} from '@/services/dashboardService';
import apiClient from '@/lib/axios';
import type { FileItem } from '@/types';

jest.mock('@/lib/axios', () => ({
    __esModule: true,
    default: {
        get:    jest.fn(),
        post:   jest.fn(),
        delete: jest.fn(),
        patch:  jest.fn(),
    },
}));

const mockedGet = apiClient.get as jest.MockedFunction<typeof apiClient.get>;

const makeFile = (overrides: Partial<FileItem> = {}): FileItem => ({
    id: 1,
    name: 'document.pdf',
    size: 1024,
    mimeType: 'application/pdf',
    folderId: null,
    isDeleted: false,
    deletedAt: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    humanReadableSize: '1 Ko',
    extension: 'pdf',
    isImage: false,
    isVideo: false,
    isAudio: false,
    isPdf: true,
    ...overrides,
});

const makeRawStats = () => ({
    quota: {
        used:       '2048',
        limit:      '10737418240',
        percentage: 0.02,
    },
    files:   5,
    folders: 3,
});

beforeEach(() => {
    jest.clearAllMocks();
});

// ─── getDashboardStats

describe('getDashboardStats()', () => {
    it('effectue deux requêtes GET en parallèle (stats + type)', async () => {
        mockedGet
            .mockResolvedValueOnce({ data: makeRawStats() })
            .mockResolvedValueOnce({ data: [] });

        await getDashboardStats();

        expect(mockedGet).toHaveBeenCalledTimes(2);
        expect(mockedGet).toHaveBeenCalledWith('/dashboard/stats');
        expect(mockedGet).toHaveBeenCalledWith('/dashboard/stats/type');
    });

    it('normalise les valeurs quota string en nombres', async () => {
        mockedGet
            .mockResolvedValueOnce({ data: makeRawStats() })
            .mockResolvedValueOnce({ data: [] });

        const result = await getDashboardStats();

        expect(result.quotaUsed).toBe(2048);
        expect(result.quotaLimit).toBe(10737418240);
        expect(result.quotaPercentage).toBe(0.02);
        expect(result.totalFiles).toBe(5);
        expect(result.totalFolders).toBe(3);
    });

    it('normalise totalSize string en nombre dans statsByType', async () => {
        mockedGet
            .mockResolvedValueOnce({ data: makeRawStats() })
            .mockResolvedValueOnce({
                data: [{ category: 'images', count: 3, totalSize: '3072' }],
            });

        const result = await getDashboardStats();

        expect(result.statsByType).toHaveLength(1);
        expect(result.statsByType[0].totalSize).toBe(3072);
    });

    it('conserve totalSize number quand déjà un nombre', async () => {
        mockedGet
            .mockResolvedValueOnce({ data: makeRawStats() })
            .mockResolvedValueOnce({
                data: [{ category: 'pdf', count: 2, totalSize: 2048 }],
            });

        const result = await getDashboardStats();

        expect(result.statsByType[0].totalSize).toBe(2048);
    });

    it('retourne statsByType vide si la réponse type est null', async () => {
        mockedGet
            .mockResolvedValueOnce({ data: makeRawStats() })
            .mockResolvedValueOnce({ data: null });

        const result = await getDashboardStats();

        expect(result.statsByType).toEqual([]);
    });

    it('propage l\'erreur si la requête stats échoue', async () => {
        mockedGet.mockRejectedValueOnce({ response: { status: 401 } });

        await expect(getDashboardStats()).rejects.toMatchObject({
            response: { status: 401 },
        });
    });
});

// ─── getRecentFiles

describe('getRecentFiles()', () => {
    it('appelle GET /dashboard/recent', async () => {
        mockedGet.mockResolvedValueOnce({ data: [] });

        await getRecentFiles();

        expect(mockedGet).toHaveBeenCalledWith('/dashboard/recent');
    });

    it('retourne le tableau de fichiers reçu', async () => {
        const files = [makeFile(), makeFile({ id: 2, name: 'photo.jpg' })];
        mockedGet.mockResolvedValueOnce({ data: files });

        const result = await getRecentFiles();

        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('document.pdf');
    });

    it('retourne un tableau vide si la réponse n\'est pas un tableau', async () => {
        mockedGet.mockResolvedValueOnce({ data: null });

        const result = await getRecentFiles();

        expect(result).toEqual([]);
    });

    it('propage l\'erreur si le serveur retourne 500', async () => {
        mockedGet.mockRejectedValueOnce({ response: { status: 500 } });

        await expect(getRecentFiles()).rejects.toMatchObject({
            response: { status: 500 },
        });
    });
});
