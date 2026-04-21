import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
    useMe,
    useUpdateProfile,
    useChangeEmail,
    useChangePassword,
    useUploadAvatar,
} from '@/hooks/useUser';
import * as userService from '@/services/userService';
import { useAuthStore } from '@/stores/authStore';
import type { User } from '@/types';

jest.mock('@/services/userService', () => ({
    getMe:          jest.fn(),
    updateProfile:  jest.fn(),
    changePassword: jest.fn(),
    uploadAvatar:   jest.fn(),
}));

const mockedGetMe          = userService.getMe          as jest.MockedFunction<typeof userService.getMe>;
const mockedUpdateProfile  = userService.updateProfile  as jest.MockedFunction<typeof userService.updateProfile>;
const mockedChangePassword = userService.changePassword as jest.MockedFunction<typeof userService.changePassword>;
const mockedUploadAvatar   = userService.uploadAvatar   as jest.MockedFunction<typeof userService.uploadAvatar>;

const makeUser = (overrides: Partial<User> = {}): User => ({
    id: 1,
    email: 'abdoulaye@example.com',
    firstName: 'Abdoulaye',
    lastName: 'FOFANA',
    avatar: null,
    quotaUsed: 1024,
    quotaLimit: 10737418240,
    theme: null,
    roles: ['ROLE_USER'],
    createdAt: '2026-01-01T00:00:00Z',
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
    localStorage.clear();
    sessionStorage.clear();
    useAuthStore.setState({ token: null, user: null, isAuthenticated: false });
});

// ─── useMe 

describe('useMe()', () => {
    it('appelle getMe et retourne l\'utilisateur connecté', async () => {
        const user = makeUser();
        mockedGetMe.mockResolvedValueOnce(user);

        const { result } = renderHook(() => useMe(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toMatchObject({ email: 'abdoulaye@example.com' });
        expect(mockedGetMe).toHaveBeenCalledTimes(1);
    });

    it('expose isError si getMe échoue', async () => {
        mockedGetMe.mockRejectedValueOnce({ response: { status: 401 } });

        const { result } = renderHook(() => useMe(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isError).toBe(true));
    });
});

// ─── useUpdateProfile 

describe('useUpdateProfile()', () => {
    it('appelle updateProfile avec les params', async () => {
        const user = makeUser({ firstName: 'Bob' });
        mockedUpdateProfile.mockResolvedValueOnce({ user });

        const { result } = renderHook(() => useUpdateProfile(), { wrapper: createWrapper() });

        await act(async () => {
            await result.current.mutateAsync({ firstName: 'Bob' });
        });

        expect(mockedUpdateProfile).toHaveBeenCalledWith({ firstName: 'Bob' });
    });

    it('met à jour le store Zustand si un nouveau token est fourni', async () => {
        const user = makeUser({ email: 'new@example.com' });
        mockedUpdateProfile.mockResolvedValueOnce({ user, token: 'new-jwt-token' });
        useAuthStore.setState({ token: null, user: null, isAuthenticated: false });

        const { result } = renderHook(() => useUpdateProfile(), { wrapper: createWrapper() });

        await act(async () => {
            await result.current.mutateAsync({ email: 'new@example.com' });
        });

        const storeUser = useAuthStore.getState().user;
        expect(storeUser?.email).toBe('new@example.com');
    });

    it('expose isError si updateProfile échoue', async () => {
        mockedUpdateProfile.mockRejectedValueOnce({ response: { status: 422 } });

        const { result } = renderHook(() => useUpdateProfile(), { wrapper: createWrapper() });

        await act(async () => {
            result.current.mutate({ firstName: '' });
        });

        await waitFor(() => expect(result.current.isError).toBe(true));
    });
});

// ─── useChangeEmail 

describe('useChangeEmail()', () => {
    it('appelle updateProfile avec le nouvel email', async () => {
        const user = makeUser({ email: 'new@example.com' });
        mockedUpdateProfile.mockResolvedValueOnce({ user, token: 'new-jwt' });

        const { result } = renderHook(() => useChangeEmail(), { wrapper: createWrapper() });

        await act(async () => {
            await result.current.mutateAsync('new@example.com');
        });

        expect(mockedUpdateProfile).toHaveBeenCalledWith({ email: 'new@example.com' });
    });

    it('expose isError si la mise à jour de l\'email échoue', async () => {
        mockedUpdateProfile.mockRejectedValueOnce({ response: { status: 409 } });

        const { result } = renderHook(() => useChangeEmail(), { wrapper: createWrapper() });

        await act(async () => {
            result.current.mutate('already-used@example.com');
        });

        await waitFor(() => expect(result.current.isError).toBe(true));
    });
});

// ─── useChangePassword 

describe('useChangePassword()', () => {
    it('appelle changePassword avec currentPassword et newPassword', async () => {
        mockedChangePassword.mockResolvedValueOnce(undefined);

        const { result } = renderHook(() => useChangePassword(), { wrapper: createWrapper() });

        await act(async () => {
            await result.current.mutateAsync({
                currentPassword: 'ancien',
                newPassword:     'nouveau123',
            });
        });

        expect(mockedChangePassword).toHaveBeenCalledWith({
            currentPassword: 'ancien',
            newPassword:     'nouveau123',
        });
    });

    it('expose isError si le mot de passe actuel est incorrect', async () => {
        mockedChangePassword.mockRejectedValueOnce({ response: { status: 400 } });

        const { result } = renderHook(() => useChangePassword(), { wrapper: createWrapper() });

        await act(async () => {
            result.current.mutate({ currentPassword: 'mauvais', newPassword: 'nouveau' });
        });

        await waitFor(() => expect(result.current.isError).toBe(true));
    });
});

// ─── useUploadAvatar 

describe('useUploadAvatar()', () => {
    it('appelle uploadAvatar avec le fichier', async () => {
        const user = makeUser({ avatar: '/avatars/new.jpg' });
        mockedUploadAvatar.mockResolvedValueOnce(user);

        const { result } = renderHook(() => useUploadAvatar(), { wrapper: createWrapper() });

        const file = new File(['image'], 'avatar.jpg', { type: 'image/jpeg' });

        await act(async () => {
            await result.current.mutateAsync({ file });
        });

        expect(mockedUploadAvatar).toHaveBeenCalledWith(file, undefined);
    });

    it('met à jour le store Zustand avec le user retourné', async () => {
        const user = makeUser({ avatar: '/avatars/updated.jpg' });
        mockedUploadAvatar.mockResolvedValueOnce(user);

        const { result } = renderHook(() => useUploadAvatar(), { wrapper: createWrapper() });

        const file = new File(['image'], 'avatar.jpg', { type: 'image/jpeg' });

        await act(async () => {
            await result.current.mutateAsync({ file });
        });

        const storeUser = useAuthStore.getState().user;
        expect(storeUser?.avatar).toBe('/avatars/updated.jpg');
    });

    it('expose isError si l\'upload échoue', async () => {
        mockedUploadAvatar.mockRejectedValueOnce({ response: { status: 400 } });

        const { result } = renderHook(() => useUploadAvatar(), { wrapper: createWrapper() });

        const file = new File(['bad'], 'bad.exe', { type: 'application/octet-stream' });

        await act(async () => {
            result.current.mutate({ file });
        });

        await waitFor(() => expect(result.current.isError).toBe(true));
    });
});
