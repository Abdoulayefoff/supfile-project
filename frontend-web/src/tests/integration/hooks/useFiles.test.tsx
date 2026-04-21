import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
    useFileList,
    useUploadFile,
    useDeleteFile,
    useRenameFile,
    useMoveFile,
    useDownloadFile,
    getPreviewUrl,
} from '@/hooks/useFiles';
import * as fileService from '@/services/fileService';
import type { FileItem } from '@/types';

jest.mock('@/services/fileService', () => ({
    listFiles: jest.fn(),
    uploadFile: jest.fn(),
    renameFile: jest.fn(),
    moveFile: jest.fn(),
    deleteFile: jest.fn(),
    downloadFile: jest.fn(),
    getPreviewUrl: jest.fn(),
}));

const mockedListFiles  = fileService.listFiles  as jest.MockedFunction<typeof fileService.listFiles>;
const mockedUploadFile = fileService.uploadFile as jest.MockedFunction<typeof fileService.uploadFile>;
const mockedDeleteFile = fileService.deleteFile as jest.MockedFunction<typeof fileService.deleteFile>;
const mockedRenameFile = fileService.renameFile as jest.MockedFunction<typeof fileService.renameFile>;
const mockedMoveFile   = fileService.moveFile   as jest.MockedFunction<typeof fileService.moveFile>;
const mockedDownloadFile = fileService.downloadFile as jest.MockedFunction<typeof fileService.downloadFile>;

const makeFile = (overrides: Partial<FileItem> = {}): FileItem => ({
    id: 1,
    name: 'document.pdf',
    size: 2048,
    mimeType: 'application/pdf',
    folderId: null,
    isDeleted: false,
    deletedAt: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    humanReadableSize: '2 Ko',
    extension: 'pdf',
    isImage: false,
    isVideo: false,
    isAudio: false,
    isPdf: true,
    ...overrides,
});

// QueryClient isolé par test
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

// ─── useFileList 

describe('useFileList()', () => {
    it('appelle listFiles et retourne les données', async () => {
        const files = [makeFile(), makeFile({ id: 2, name: 'image.png' })];
        mockedListFiles.mockResolvedValueOnce(files);

        const { result } = renderHook(() => useFileList(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toHaveLength(2);
        expect(mockedListFiles).toHaveBeenCalledWith({});
    });

    it('passe les params à listFiles', async () => {
        mockedListFiles.mockResolvedValueOnce([]);

        const { result } = renderHook(() => useFileList({ folderId: 5 }), {
            wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(mockedListFiles).toHaveBeenCalledWith({ folderId: 5 });
    });

    it('expose isLoading true pendant le chargement', () => {
        mockedListFiles.mockImplementationOnce(
            () => new Promise((resolve) => setTimeout(() => resolve([]), 5000))
        );

        const { result } = renderHook(() => useFileList(), { wrapper: createWrapper() });

        expect(result.current.isLoading).toBe(true);
    });

    it('expose l\'erreur si listFiles échoue', async () => {
        mockedListFiles.mockRejectedValueOnce(new Error('Network error'));

        const { result } = renderHook(() => useFileList(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isError).toBe(true));
    });
});

// ─── useUploadFile 

describe('useUploadFile()', () => {
    it('appelle uploadFile avec les params', async () => {
        const created = makeFile({ id: 42, name: 'new.pdf' });
        mockedUploadFile.mockResolvedValueOnce(created);

        const { result } = renderHook(() => useUploadFile(), { wrapper: createWrapper() });

        const file = new File(['content'], 'new.pdf', { type: 'application/pdf' });

        await act(async () => {
            await result.current.mutateAsync({ file });
        });

        expect(mockedUploadFile).toHaveBeenCalledWith({ file });
    });

    it('invalide le cache des fichiers après un upload réussi', async () => {
        const created = makeFile();
        mockedUploadFile.mockResolvedValueOnce(created);

        const qc = new QueryClient({
            defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
        });
        const refetchSpy = jest.spyOn(qc, 'refetchQueries');
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <QueryClientProvider client={qc}>{children}</QueryClientProvider>
        );

        const { result } = renderHook(() => useUploadFile(), { wrapper });

        const file = new File(['content'], 'test.txt', { type: 'text/plain' });

        await act(async () => {
            await result.current.mutateAsync({ file });
        });

        expect(refetchSpy).toHaveBeenCalled();
    });

    it('expose l\'erreur si uploadFile échoue', async () => {
        mockedUploadFile.mockRejectedValueOnce({ response: { status: 413 } });

        const { result } = renderHook(() => useUploadFile(), { wrapper: createWrapper() });

        const file = new File(['content'], 'toobig.pdf', { type: 'application/pdf' });

        await act(async () => {
            result.current.mutate({ file });
        });

        await waitFor(() => expect(result.current.isError).toBe(true));
    });
});

// ─── useDeleteFile 

describe('useDeleteFile()', () => {
    it('appelle deleteFile avec l\'id du fichier', async () => {
        mockedDeleteFile.mockResolvedValueOnce(undefined);

        const { result } = renderHook(() => useDeleteFile(), { wrapper: createWrapper() });

        await act(async () => {
            await result.current.mutateAsync(5);
        });

        expect(mockedDeleteFile).toHaveBeenCalledWith(5);
    });

    it('invalide le cache des fichiers après suppression', async () => {
        mockedDeleteFile.mockResolvedValueOnce(undefined);

        const wrapper = createWrapper();
        const invalidateSpy = jest.spyOn(queryClient!, 'invalidateQueries');

        const { result } = renderHook(() => useDeleteFile(), { wrapper });

        await act(async () => {
            await result.current.mutateAsync(5);
        });

        expect(invalidateSpy).toHaveBeenCalled();
    });

    it('expose l\'erreur si deleteFile échoue', async () => {
        mockedDeleteFile.mockRejectedValueOnce({ response: { status: 404 } });

        const { result } = renderHook(() => useDeleteFile(), { wrapper: createWrapper() });

        await act(async () => {
            result.current.mutate(999);
        });

        await waitFor(() => expect(result.current.isError).toBe(true));
    });
});

// ─── useRenameFile 

describe('useRenameFile()', () => {
    it('appelle renameFile avec fileId et params', async () => {
        const updated = makeFile({ name: 'renommé.pdf' });
        mockedRenameFile.mockResolvedValueOnce(updated);

        const { result } = renderHook(() => useRenameFile(), { wrapper: createWrapper() });

        await act(async () => {
            await result.current.mutateAsync({ fileId: 1, params: { name: 'renommé.pdf' } });
        });

        expect(mockedRenameFile).toHaveBeenCalledWith(1, { name: 'renommé.pdf' });
    });
});

// ─── useMoveFile 

describe('useMoveFile()', () => {
    it('appelle moveFile avec fileId et params', async () => {
        const moved = makeFile({ folderId: 7 });
        mockedMoveFile.mockResolvedValueOnce(moved);

        const { result } = renderHook(() => useMoveFile(), { wrapper: createWrapper() });

        await act(async () => {
            await result.current.mutateAsync({ fileId: 1, params: { targetFolderId: 7 } });
        });

        expect(mockedMoveFile).toHaveBeenCalledWith(1, { targetFolderId: 7 });
    });
});

// ─── useDownloadFile 

describe('useDownloadFile()', () => {
    it('appelle downloadFile avec fileId et fileName', async () => {
        mockedDownloadFile.mockResolvedValueOnce(undefined);

        const { result } = renderHook(() => useDownloadFile(), { wrapper: createWrapper() });

        await act(async () => {
            await result.current.mutateAsync({ fileId: 1, fileName: 'test.pdf' });
        });

        expect(mockedDownloadFile).toHaveBeenCalledWith(1, 'test.pdf');
    });
});

// ─── getPreviewUrl 

describe('getPreviewUrl', () => {
    it('est exporté depuis useFiles', () => {
        expect(getPreviewUrl).toBeDefined();
    });
});
