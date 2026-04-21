import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
    useFolderList,
    useFolderBrowse,
    useFolderBreadcrumbs,
    useCreateFolder,
    useRenameFolder,
    useMoveFolder,
    useDeleteFolder,
    useDownloadFolder,
} from '@/hooks/useFolders';
import * as folderService from '@/services/folderService';
import type { Folder } from '@/types';

jest.mock('@/services/folderService', () => ({
    listFolders:          jest.fn(),
    createFolder:         jest.fn(),
    renameFolder:         jest.fn(),
    moveFolder:           jest.fn(),
    deleteFolder:         jest.fn(),
    downloadFolder:       jest.fn(),
    getFolderBreadcrumbs: jest.fn(),
}));

const mockedListFolders          = folderService.listFolders          as jest.MockedFunction<typeof folderService.listFolders>;
const mockedCreateFolder         = folderService.createFolder         as jest.MockedFunction<typeof folderService.createFolder>;
const mockedRenameFolder         = folderService.renameFolder         as jest.MockedFunction<typeof folderService.renameFolder>;
const mockedMoveFolder           = folderService.moveFolder           as jest.MockedFunction<typeof folderService.moveFolder>;
const mockedDeleteFolder         = folderService.deleteFolder         as jest.MockedFunction<typeof folderService.deleteFolder>;
const mockedDownloadFolder       = folderService.downloadFolder       as jest.MockedFunction<typeof folderService.downloadFolder>;
const mockedGetFolderBreadcrumbs = folderService.getFolderBreadcrumbs as jest.MockedFunction<typeof folderService.getFolderBreadcrumbs>;

const makeFolder = (overrides: Partial<Folder> = {}): Folder => ({
    id: 1,
    name: 'Mon dossier',
    parentId: null,
    isDeleted: false,
    deletedAt: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
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

// ─── useFolderList

describe('useFolderList()', () => {
    it('appelle listFolders et retourne les données', async () => {
        const folders = [makeFolder(), makeFolder({ id: 2, name: 'Autre' })];
        mockedListFolders.mockResolvedValueOnce(folders);

        const { result } = renderHook(() => useFolderList(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toHaveLength(2);
        expect(mockedListFolders).toHaveBeenCalledWith({});
    });

    it('passe parentId à listFolders', async () => {
        mockedListFolders.mockResolvedValueOnce([]);

        const { result } = renderHook(() => useFolderList({ parentId: 5 }), {
            wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(mockedListFolders).toHaveBeenCalledWith({ parentId: 5 });
    });

    it('expose isError si listFolders échoue', async () => {
        mockedListFolders.mockRejectedValueOnce(new Error('Network error'));

        const { result } = renderHook(() => useFolderList(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isError).toBe(true));
    });
});

// ─── useFolderBrowse 

describe('useFolderBrowse()', () => {
    it('appelle listFolders avec parentId', async () => {
        mockedListFolders.mockResolvedValueOnce([makeFolder({ id: 3, parentId: 2 })]);

        const { result } = renderHook(() => useFolderBrowse(2), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(mockedListFolders).toHaveBeenCalledWith({ parentId: 2 });
    });

    it('appelle listFolders avec parentId null pour la racine', async () => {
        mockedListFolders.mockResolvedValueOnce([]);

        const { result } = renderHook(() => useFolderBrowse(null), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(mockedListFolders).toHaveBeenCalledWith({ parentId: null });
    });
});

// ─── useFolderBreadcrumbs 

describe('useFolderBreadcrumbs()', () => {
    it('appelle getFolderBreadcrumbs avec le folderId', async () => {
        mockedGetFolderBreadcrumbs.mockResolvedValueOnce([makeFolder()]);

        const { result } = renderHook(() => useFolderBreadcrumbs(1), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(mockedGetFolderBreadcrumbs).toHaveBeenCalledWith(1);
    });

    it('ne déclenche pas la requête si folderId est undefined', () => {
        const { result } = renderHook(() => useFolderBreadcrumbs(undefined), {
            wrapper: createWrapper(),
        });

        expect(result.current.fetchStatus).toBe('idle');
        expect(mockedGetFolderBreadcrumbs).not.toHaveBeenCalled();
    });
});

// ─── useCreateFolder 

describe('useCreateFolder()', () => {
    it('appelle createFolder avec les params', async () => {
        const created = makeFolder({ id: 10, name: 'Nouveau' });
        mockedCreateFolder.mockResolvedValueOnce(created);

        const { result } = renderHook(() => useCreateFolder(), { wrapper: createWrapper() });

        await act(async () => {
            await result.current.mutateAsync({ name: 'Nouveau' });
        });

        expect(mockedCreateFolder).toHaveBeenCalledWith({ name: 'Nouveau' });
    });

    it('invalide le cache des dossiers après création', async () => {
        mockedCreateFolder.mockResolvedValueOnce(makeFolder());

        const wrapper = createWrapper();
        const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

        const { result } = renderHook(() => useCreateFolder(), { wrapper });

        await act(async () => {
            await result.current.mutateAsync({ name: 'Test' });
        });

        expect(invalidateSpy).toHaveBeenCalled();
    });

    it('expose isError si createFolder échoue', async () => {
        mockedCreateFolder.mockRejectedValueOnce({ response: { status: 422 } });

        const { result } = renderHook(() => useCreateFolder(), { wrapper: createWrapper() });

        await act(async () => {
            result.current.mutate({ name: 'Invalide' });
        });

        await waitFor(() => expect(result.current.isError).toBe(true));
    });
});

// ─── useRenameFolder 

describe('useRenameFolder()', () => {
    it('appelle renameFolder avec folderId et params', async () => {
        const renamed = makeFolder({ name: 'Renommé' });
        mockedRenameFolder.mockResolvedValueOnce(renamed);

        const { result } = renderHook(() => useRenameFolder(), { wrapper: createWrapper() });

        await act(async () => {
            await result.current.mutateAsync({ folderId: 1, params: { name: 'Renommé' } });
        });

        expect(mockedRenameFolder).toHaveBeenCalledWith(1, { name: 'Renommé' });
    });
});

// ─── useMoveFolder 

describe('useMoveFolder()', () => {
    it('appelle moveFolder avec folderId et params', async () => {
        const moved = makeFolder({ parentId: 5 });
        mockedMoveFolder.mockResolvedValueOnce(moved);

        const { result } = renderHook(() => useMoveFolder(), { wrapper: createWrapper() });

        await act(async () => {
            await result.current.mutateAsync({ folderId: 1, params: { targetParentId: 5 } });
        });

        expect(mockedMoveFolder).toHaveBeenCalledWith(1, { targetParentId: 5 });
    });
});

// ─── useDeleteFolder 

describe('useDeleteFolder()', () => {
    it('appelle deleteFolder avec l\'id du dossier', async () => {
        mockedDeleteFolder.mockResolvedValueOnce(undefined);

        const { result } = renderHook(() => useDeleteFolder(), { wrapper: createWrapper() });

        await act(async () => {
            await result.current.mutateAsync(1);
        });

        expect(mockedDeleteFolder).toHaveBeenCalledWith(1);
    });

    it('expose isError si deleteFolder échoue', async () => {
        mockedDeleteFolder.mockRejectedValueOnce({ response: { status: 404 } });

        const { result } = renderHook(() => useDeleteFolder(), { wrapper: createWrapper() });

        await act(async () => {
            result.current.mutate(999);
        });

        await waitFor(() => expect(result.current.isError).toBe(true));
    });
});

// ─── useDownloadFolder 

describe('useDownloadFolder()', () => {
    it('appelle downloadFolder avec folderId et folderName', async () => {
        mockedDownloadFolder.mockResolvedValueOnce(undefined);

        const { result } = renderHook(() => useDownloadFolder(), { wrapper: createWrapper() });

        await act(async () => {
            await result.current.mutateAsync({ folderId: 1, folderName: 'Mon dossier' });
        });

        expect(mockedDownloadFolder).toHaveBeenCalledWith(1, 'Mon dossier');
    });
});
