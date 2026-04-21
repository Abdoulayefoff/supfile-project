import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
    useShareList,
    useReceivedShares,
    useCreateShare,
    useDeleteShare,
    usePublicShare,
    useValidateSharePassword,
    useDownloadPublicShare,
} from '@/hooks/useShares';
import * as shareService from '@/services/shareService';
import type { Share } from '@/types';
import type { ReceivedShare, PublicShareResponse } from '@/services/shareService';

jest.mock('@/services/shareService', () => ({
    createShare:           jest.fn(),
    listShares:            jest.fn(),
    listReceivedShares:    jest.fn(),
    deleteShare:           jest.fn(),
    getPublicShare:        jest.fn(),
    validateSharePassword: jest.fn(),
    downloadPublicShare:   jest.fn(),
    getPublicPreviewUrl:   jest.fn(),
}));

const mockedListShares            = shareService.listShares            as jest.MockedFunction<typeof shareService.listShares>;
const mockedListReceivedShares    = shareService.listReceivedShares    as jest.MockedFunction<typeof shareService.listReceivedShares>;
const mockedCreateShare           = shareService.createShare           as jest.MockedFunction<typeof shareService.createShare>;
const mockedDeleteShare           = shareService.deleteShare           as jest.MockedFunction<typeof shareService.deleteShare>;
const mockedGetPublicShare        = shareService.getPublicShare        as jest.MockedFunction<typeof shareService.getPublicShare>;
const mockedValidateSharePassword = shareService.validateSharePassword as jest.MockedFunction<typeof shareService.validateSharePassword>;
const mockedDownloadPublicShare   = shareService.downloadPublicShare   as jest.MockedFunction<typeof shareService.downloadPublicShare>;

const makeShare = (overrides: Partial<Share> = {}): Share => ({
    id: 1,
    token: 'abc123token',
    isPublic: true,
    hasPassword: false,
    expiresAt: null,
    createdAt: '2026-01-01T00:00:00Z',
    file: null,
    folder: null,
    sharedWith: null,
    ...overrides,
});

const makePublicShareResponse = (overrides: Partial<PublicShareResponse> = {}): PublicShareResponse => ({
    id: 1,
    token: 'abc123token',
    isPublic: true,
    hasPassword: false,
    expiresAt: null,
    createdAt: '2026-01-01T00:00:00Z',
    resourceType: 'file',
    resource: { id: 10, name: 'document.pdf', mimeType: 'application/pdf', size: 1024 },
    sharedWith: null,
    ...overrides,
});

const makeReceivedShare = (): ReceivedShare => ({
    id: 2,
    token: 'xyz789token',
    isPublic: false,
    hasPassword: false,
    expiresAt: null,
    createdAt: '2026-01-05T00:00:00Z',
    resourceType: 'file',
    resource: { id: 20, name: 'shared.pdf', mimeType: 'application/pdf', size: 2048 },
    createdBy: { id: 5, email: 'abdoulaye@example.com', fullName: 'Abdoulaye FOFANA' },
    sharedWith: { id: 3, email: 'abdoul@example.com', fullName: 'Abdoul FOF' },
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

// ─── useShareList

describe('useShareList()', () => {
    it('appelle listShares et retourne les partages', async () => {
        const shares = [makeShare(), makeShare({ id: 2, token: 'def456' })];
        mockedListShares.mockResolvedValueOnce(shares);

        const { result } = renderHook(() => useShareList(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toHaveLength(2);
        expect(mockedListShares).toHaveBeenCalledTimes(1);
    });

    it('expose isError si listShares échoue', async () => {
        mockedListShares.mockRejectedValueOnce(new Error('Unauthorized'));

        const { result } = renderHook(() => useShareList(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isError).toBe(true));
    });
});

// ─── useReceivedShares

describe('useReceivedShares()', () => {
    it('appelle listReceivedShares et retourne les partages reçus', async () => {
        mockedListReceivedShares.mockResolvedValueOnce([makeReceivedShare()]);

        const { result } = renderHook(() => useReceivedShares(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toHaveLength(1);
        expect(result.current.data![0].createdBy.email).toBe('abdoulaye@example.com');
    });

    it('expose isError si listReceivedShares échoue', async () => {
        mockedListReceivedShares.mockRejectedValueOnce(new Error('Network error'));

        const { result } = renderHook(() => useReceivedShares(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isError).toBe(true));
    });
});

// ─── useCreateShare 

describe('useCreateShare()', () => {
    it('appelle createShare avec les params', async () => {
        const created = makeShare();
        mockedCreateShare.mockResolvedValueOnce(created);

        const { result } = renderHook(() => useCreateShare(), { wrapper: createWrapper() });

        await act(async () => {
            await result.current.mutateAsync({ type: 'file', resourceId: 1, isPublic: true });
        });

        expect(mockedCreateShare).toHaveBeenCalledWith({ type: 'file', resourceId: 1, isPublic: true });
    });

    it('invalide le cache des partages après création', async () => {
        mockedCreateShare.mockResolvedValueOnce(makeShare());

        const wrapper = createWrapper();
        const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

        const { result } = renderHook(() => useCreateShare(), { wrapper });

        await act(async () => {
            await result.current.mutateAsync({ type: 'file', resourceId: 1 });
        });

        expect(invalidateSpy).toHaveBeenCalled();
    });

    it('expose isError si createShare échoue', async () => {
        mockedCreateShare.mockRejectedValueOnce({ response: { status: 422 } });

        const { result } = renderHook(() => useCreateShare(), { wrapper: createWrapper() });

        await act(async () => {
            result.current.mutate({ type: 'file', resourceId: 1 });
        });

        await waitFor(() => expect(result.current.isError).toBe(true));
    });
});

// ─── useDeleteShare

describe('useDeleteShare()', () => {
    it('appelle deleteShare avec l\'id du partage', async () => {
        mockedDeleteShare.mockResolvedValueOnce(undefined);

        const { result } = renderHook(() => useDeleteShare(), { wrapper: createWrapper() });

        await act(async () => {
            await result.current.mutateAsync(1);
        });

        expect(mockedDeleteShare).toHaveBeenCalledWith(1);
    });

    it('expose isError si deleteShare échoue', async () => {
        mockedDeleteShare.mockRejectedValueOnce({ response: { status: 404 } });

        const { result } = renderHook(() => useDeleteShare(), { wrapper: createWrapper() });

        await act(async () => {
            result.current.mutate(999);
        });

        await waitFor(() => expect(result.current.isError).toBe(true));
    });
});

// ─── usePublicShare

describe('usePublicShare()', () => {
    it('appelle getPublicShare avec le token', async () => {
        const shareData = makePublicShareResponse();
        mockedGetPublicShare.mockResolvedValueOnce(shareData);

        const { result } = renderHook(() => usePublicShare('abc123token'), {
            wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(mockedGetPublicShare).toHaveBeenCalledWith('abc123token');
        expect(result.current.data).toMatchObject({ token: 'abc123token' });
    });

    it('expose isError pour un token inconnu (404)', async () => {
        const error = new Error('HTTP 404');
        (error as Error & { status: number }).status = 404;
        mockedGetPublicShare.mockRejectedValueOnce(error);

        const { result } = renderHook(() => usePublicShare('invalid-token'), {
            wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.isError).toBe(true));
    });

    it('ne déclenche pas la requête pour un token vide', () => {
        const { result } = renderHook(() => usePublicShare(''), {
            wrapper: createWrapper(),
        });

        expect(result.current.fetchStatus).toBe('idle');
        expect(mockedGetPublicShare).not.toHaveBeenCalled();
    });
});

// ─── useValidateSharePassword 

describe('useValidateSharePassword()', () => {
    it('appelle validateSharePassword avec le token et le mot de passe', async () => {
        const shareData = makePublicShareResponse();
        mockedValidateSharePassword.mockResolvedValueOnce(shareData);

        const { result } = renderHook(() => useValidateSharePassword('abc123token'), {
            wrapper: createWrapper(),
        });

        await act(async () => {
            await result.current.mutateAsync({ password: 'secret' });
        });

        expect(mockedValidateSharePassword).toHaveBeenCalledWith('abc123token', 'secret');
    });

    it('expose isError si le mot de passe est incorrect', async () => {
        const error = new Error('HTTP 401');
        (error as Error & { status: number }).status = 401;
        mockedValidateSharePassword.mockRejectedValueOnce(error);

        const { result } = renderHook(() => useValidateSharePassword('abc123token'), {
            wrapper: createWrapper(),
        });

        await act(async () => {
            result.current.mutate({ password: 'mauvais' });
        });

        await waitFor(() => expect(result.current.isError).toBe(true));
    });
});

// ─── useDownloadPublicShare 

describe('useDownloadPublicShare()', () => {
    it('appelle downloadPublicShare avec token, fileName et password optionnel', async () => {
        mockedDownloadPublicShare.mockResolvedValueOnce(undefined);

        const { result } = renderHook(() => useDownloadPublicShare(), { wrapper: createWrapper() });

        await act(async () => {
            await result.current.mutateAsync({ token: 'abc123token', fileName: 'document.pdf' });
        });

        expect(mockedDownloadPublicShare).toHaveBeenCalledWith('abc123token', 'document.pdf', undefined);
    });

    it('transmet le mot de passe à downloadPublicShare si fourni', async () => {
        mockedDownloadPublicShare.mockResolvedValueOnce(undefined);

        const { result } = renderHook(() => useDownloadPublicShare(), { wrapper: createWrapper() });

        await act(async () => {
            await result.current.mutateAsync({
                token: 'abc123token',
                fileName: 'doc.pdf',
                password: 'secret',
            });
        });

        expect(mockedDownloadPublicShare).toHaveBeenCalledWith('abc123token', 'doc.pdf', 'secret');
    });
});
