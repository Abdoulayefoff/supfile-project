import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLogin, useRegister, useLogout } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/authService';
import type { User } from '@/types';

// Mock du service d'authentification
jest.mock('@/services/authService', () => ({
    authService: {
        login: jest.fn(),
        register: jest.fn(),
        getOAuthUrl: jest.fn((provider: string) => `http://localhost:8000/api/auth/oauth/${provider}`),
    },
}));

const mockedLogin    = authService.login    as jest.MockedFunction<typeof authService.login>;
const mockedRegister = authService.register as jest.MockedFunction<typeof authService.register>;

const makeUser = (overrides: Partial<User> = {}): User => ({
    id: 1,
    email: 'abdoulaye@example.com',
    firstName: 'Abdoulaye',
    lastName: 'FOFANA',
    avatar: null,
    quotaUsed: 0,
    quotaLimit: 10_737_418_240,
    theme: null,
    roles: ['ROLE_USER'],
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
});

// Wrapper avec QueryClientProvider fraîche pour chaque test
const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
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

// ─── useLogin 

describe('useLogin()', () => {
    it('appelle authService.login avec email et password', async () => {
        const user = makeUser();
        mockedLogin.mockResolvedValueOnce({ token: 'jwt', user });

        const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() });

        await act(async () => {
            await result.current.mutateAsync({
                email: 'abdoulaye@example.com',
                password: 'secret',
            });
        });

        expect(mockedLogin).toHaveBeenCalledWith({
            email: 'abdoulaye@example.com',
            password: 'secret',
        });
    });

    it('met à jour le store auth après un login réussi', async () => {
        const user = makeUser();
        mockedLogin.mockResolvedValueOnce({ token: 'jwt-success', user });

        const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() });

        await act(async () => {
            await result.current.mutateAsync({
                email: 'abdoulaye@example.com',
                password: 'secret',
            });
        });

        expect(useAuthStore.getState().isAuthenticated).toBe(true);
        expect(useAuthStore.getState().token).toBe('jwt-success');
        expect(useAuthStore.getState().user).toEqual(user);
    });

    it('passe rememberMe au store (true par défaut)', async () => {
        const user = makeUser();
        mockedLogin.mockResolvedValueOnce({ token: 'jwt', user });

        const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() });

        await act(async () => {
            await result.current.mutateAsync({ email: 'abdoulaye@example.com', password: 'secret' });
        });

        expect(localStorage.getItem('jwt_token')).toBe('jwt');
    });

    it('utilise sessionStorage quand rememberMe=false', async () => {
        const user = makeUser();
        mockedLogin.mockResolvedValueOnce({ token: 'jwt', user });

        const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() });

        await act(async () => {
            await result.current.mutateAsync({
                email: 'abdoulaye@example.com',
                password: 'secret',
                rememberMe: false,
            });
        });

        expect(sessionStorage.getItem('jwt_token')).toBe('jwt');
        expect(localStorage.getItem('jwt_token')).toBeNull();
    });

    it('expose l\'erreur en cas d\'échec', async () => {
        mockedLogin.mockRejectedValueOnce(new Error('Identifiants incorrects'));

        const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() });

        await act(async () => {
            result.current.mutate({
                email: 'bad@example.com',
                password: 'wrong',
            });
        });

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('ne met pas à jour le store en cas d\'erreur', async () => {
        mockedLogin.mockRejectedValueOnce({ response: { status: 401 } });

        const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() });

        await act(async () => {
            result.current.mutate({ email: 'bad@example.com', password: 'wrong' });
        });

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(useAuthStore.getState().token).toBeNull();
    });
});

// ─── useRegister 

describe('useRegister()', () => {
    it('appelle authService.register avec les données complètes', async () => {
        const user = makeUser();
        mockedRegister.mockResolvedValueOnce({ token: 'jwt', user });

        const { result } = renderHook(() => useRegister(), { wrapper: createWrapper() });

        await act(async () => {
            await result.current.mutateAsync({
                email: 'new@example.com',
                password: 'Secret@123',
                firstName: 'Abdoulaye',
                lastName: 'FOFANA',
            });
        });

        expect(mockedRegister).toHaveBeenCalledWith({
            email: 'new@example.com',
            password: 'Secret@123',
            firstName: 'Abdoulaye',
            lastName: 'FOFANA',
        });
    });

    it('met à jour le store après un register réussi', async () => {
        const user = makeUser();
        mockedRegister.mockResolvedValueOnce({ token: 'jwt-reg', user });

        const { result } = renderHook(() => useRegister(), { wrapper: createWrapper() });

        await act(async () => {
            await result.current.mutateAsync({
                email: 'new@example.com',
                password: 'Secret@123',
                firstName: 'Abdoulaye',
                lastName: 'FOFANA',
            });
        });

        expect(useAuthStore.getState().isAuthenticated).toBe(true);
        expect(useAuthStore.getState().token).toBe('jwt-reg');
    });

    it('expose l\'erreur si l\'email existe déjà', async () => {
        mockedRegister.mockRejectedValueOnce({ response: { status: 409 } });

        const { result } = renderHook(() => useRegister(), { wrapper: createWrapper() });

        await act(async () => {
            result.current.mutate({
                email: 'existing@example.com',
                password: 'Secret@123',
                firstName: 'Abdoulaye',
                lastName: 'FOFANA',
            });
        });

        await waitFor(() => expect(result.current.isError).toBe(true));
    });
});

// ─── useLogout 

describe('useLogout()', () => {
    it('expose une fonction logout', () => {
        const { result } = renderHook(() => useLogout(), { wrapper: createWrapper() });
        expect(typeof result.current.logout).toBe('function');
    });

    it('vide le store auth quand logout() est appelé', () => {
        useAuthStore.setState({
            token: 'existing-token',
            user: makeUser(),
            isAuthenticated: true,
        });

        const { result } = renderHook(() => useLogout(), { wrapper: createWrapper() });

        act(() => {
            result.current.logout();
        });

        expect(useAuthStore.getState().isAuthenticated).toBe(false);
        expect(useAuthStore.getState().token).toBeNull();
        expect(useAuthStore.getState().user).toBeNull();
    });

    it('nettoie localStorage quand logout() est appelé', () => {
        localStorage.setItem('jwt_token', 'tok');
        localStorage.setItem('sf_user', JSON.stringify(makeUser()));

        const { result } = renderHook(() => useLogout(), { wrapper: createWrapper() });

        act(() => {
            result.current.logout();
        });

        expect(localStorage.getItem('jwt_token')).toBeNull();
        expect(localStorage.getItem('sf_user')).toBeNull();
    });
});
