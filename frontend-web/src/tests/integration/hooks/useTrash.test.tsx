import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
    useTrashList,
    useRestoreFile,
    useRestoreFolder,
    usePermanentDeleteFile,
    usePermanentDeleteFolder,
} from '@/hooks/useTrash';
import * as trashService from '@/services/trashService';

jest.mock('@/services/trashService', () => ({
    listTrash:             jest.fn(),
    restoreFile:           jest.fn(),
    restoreFolder:         jest.fn(),
    permanentDeleteFile:   jest.fn(),
    permanentDeleteFolder: jest.fn(),
}));

const mockedListTrash             = trashService.listTrash             as jest.MockedFunction<typeof trashService.listTrash>;
const mockedRestoreFile           = trashService.restoreFile           as jest.MockedFunction<typeof trashService.restoreFile>;
const mockedRestoreFolder         = trashService.restoreFolder         as jest.MockedFunction<typeof trashService.restoreFolder>;
const mockedPermanentDeleteFile   = trashService.permanentDeleteFile   as jest.MockedFunction<typeof trashService.permanentDeleteFile>;
const mockedPermanentDeleteFolder = trashService.permanentDeleteFolder as jest.MockedFunction<typeof trashService.permanentDeleteFolder>;

const makeTrashResponse = () => ({
    files: [
        { id: 1, name: 'old.pdf', deletedAt: '2026-01-10T00:00:00Z', size: 1024, mimeType: 'application/pdf' },
    ],
    folders: [
        { id: 2, name: 'archives', deletedAt: '2026-01-09T00:00:00Z' },
    ],
});

let queryClient: QueryClient;
const createWrapper = () => {
    queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

beforeEach(() => {
    jest.clearAllMocks();
});

// ─── useTrashList 

describe('useTrashList()', () => {
    it('appelle listTrash et retourne les fichiers et dossiers supprimés', async () => {
        mockedListTrash.mockResolvedValueOnce(makeTrashResponse());

        const { result } = renderHook(() => useTrashList(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data?.files).toHaveLength(1);
        expect(result.current.data?.folders).toHaveLength(1);
        expect(mockedListTrash).toHaveBeenCalledTimes(1);
    });

    it('expose isError si listTrash échoue', async () => {
        mockedListTrash.mockRejectedValueOnce(new Error('Network error'));

        const { result } = renderHook(() => useTrashList(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isError).toBe(true));
    });
});

// ─── useRestoreFile 

describe('useRestoreFile()', () => {
    it('appelle restoreFile avec l\'id du fichier', async () => {
        mockedRestoreFile.mockResolvedValueOnce(undefined);

        const { result } = renderHook(() => useRestoreFile(), { wrapper: createWrapper() });

        await act(async () => {
            await result.current.mutateAsync(1);
        });

        expect(mockedRestoreFile).toHaveBeenCalledWith(1);
    });

    it('invalide le cache corbeille et fichiers après restauration', async () => {
        mockedRestoreFile.mockResolvedValueOnce(undefined);

        const wrapper = createWrapper();
        const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

        const { result } = renderHook(() => useRestoreFile(), { wrapper });

        await act(async () => {
            await result.current.mutateAsync(1);
        });

        expect(invalidateSpy).toHaveBeenCalled();
    });

    it('expose isError si restoreFile échoue', async () => {
        mockedRestoreFile.mockRejectedValueOnce({ response: { status: 404 } });

        const { result } = renderHook(() => useRestoreFile(), { wrapper: createWrapper() });

        await act(async () => {
            result.current.mutate(999);
        });

        await waitFor(() => expect(result.current.isError).toBe(true));
    });
});

// ─── useRestoreFolder 

describe('useRestoreFolder()', () => {
    it('appelle restoreFolder avec l\'id du dossier', async () => {
        mockedRestoreFolder.mockResolvedValueOnce(undefined);

        const { result } = renderHook(() => useRestoreFolder(), { wrapper: createWrapper() });

        await act(async () => {
            await result.current.mutateAsync(2);
        });

        expect(mockedRestoreFolder).toHaveBeenCalledWith(2);
    });

    it('expose isError si restoreFolder échoue', async () => {
        mockedRestoreFolder.mockRejectedValueOnce({ response: { status: 404 } });

        const { result } = renderHook(() => useRestoreFolder(), { wrapper: createWrapper() });

        await act(async () => {
            result.current.mutate(999);
        });

        await waitFor(() => expect(result.current.isError).toBe(true));
    });
});

// ─── usePermanentDeleteFile 

describe('usePermanentDeleteFile()', () => {
    it('appelle permanentDeleteFile avec l\'id du fichier', async () => {
        mockedPermanentDeleteFile.mockResolvedValueOnce(undefined);

        const { result } = renderHook(() => usePermanentDeleteFile(), { wrapper: createWrapper() });

        await act(async () => {
            await result.current.mutateAsync(1);
        });

        expect(mockedPermanentDeleteFile).toHaveBeenCalledWith(1);
    });

    it('invalide le cache corbeille après suppression définitive', async () => {
        mockedPermanentDeleteFile.mockResolvedValueOnce(undefined);

        const wrapper = createWrapper();
        const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

        const { result } = renderHook(() => usePermanentDeleteFile(), { wrapper });

        await act(async () => {
            await result.current.mutateAsync(1);
        });

        expect(invalidateSpy).toHaveBeenCalled();
    });

    it('expose isError si permanentDeleteFile échoue', async () => {
        mockedPermanentDeleteFile.mockRejectedValueOnce({ response: { status: 403 } });

        const { result } = renderHook(() => usePermanentDeleteFile(), { wrapper: createWrapper() });

        await act(async () => {
            result.current.mutate(999);
        });

        await waitFor(() => expect(result.current.isError).toBe(true));
    });
});

// ─── usePermanentDeleteFolder 

describe('usePermanentDeleteFolder()', () => {
    it('appelle permanentDeleteFolder avec l\'id du dossier', async () => {
        mockedPermanentDeleteFolder.mockResolvedValueOnce(undefined);

        const { result } = renderHook(() => usePermanentDeleteFolder(), { wrapper: createWrapper() });

        await act(async () => {
            await result.current.mutateAsync(2);
        });

        expect(mockedPermanentDeleteFolder).toHaveBeenCalledWith(2);
    });

    it('expose isError si permanentDeleteFolder échoue', async () => {
        mockedPermanentDeleteFolder.mockRejectedValueOnce({ response: { status: 404 } });

        const { result } = renderHook(() => usePermanentDeleteFolder(), { wrapper: createWrapper() });

        await act(async () => {
            result.current.mutate(999);
        });

        await waitFor(() => expect(result.current.isError).toBe(true));
    });
});
