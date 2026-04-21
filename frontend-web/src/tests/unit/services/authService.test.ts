import { authService } from '@/services/authService';
import apiClient from '@/lib/axios';
import type { User } from '@/types';

// Mock de l'instance axios de l'application (pas le global axios)
jest.mock('@/lib/axios', () => ({
    __esModule: true,
    default: {
        post: jest.fn(),
        get: jest.fn(),
    },
}));

const mockedPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;
const mockedGet  = apiClient.get  as jest.MockedFunction<typeof apiClient.get>;

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

beforeEach(() => {
    jest.clearAllMocks();
});

// ─── login

describe('authService.login()', () => {
    it('appelle POST /auth/login avec email et password', async () => {
        const user = makeUser();
        mockedPost.mockResolvedValueOnce({ data: { token: 'jwt-token' } });
        mockedGet.mockResolvedValueOnce({ data: { user } });

        await authService.login({ email: 'abdoulaye@example.com', password: 'secret' });

        expect(mockedPost).toHaveBeenCalledWith('/auth/login', {
            email: 'abdoulaye@example.com',
            password: 'secret',
        });
    });

    it('enchaîne avec GET /user/me pour récupérer le profil', async () => {
        const user = makeUser();
        mockedPost.mockResolvedValueOnce({ data: { token: 'jwt-token' } });
        mockedGet.mockResolvedValueOnce({ data: { user } });

        await authService.login({ email: 'abdoulaye@example.com', password: 'secret' });

        expect(mockedGet).toHaveBeenCalledWith('/user/me', {
            headers: { Authorization: 'Bearer jwt-token' },
        });
    });

    it('retourne { token, user } en cas de succès', async () => {
        const user = makeUser();
        mockedPost.mockResolvedValueOnce({ data: { token: 'jwt-token' } });
        mockedGet.mockResolvedValueOnce({ data: { user } });

        const result = await authService.login({ email: 'abdoulaye@example.com', password: 'secret' });

        expect(result.token).toBe('jwt-token');
        expect(result.user).toEqual(user);
    });

    it('propage l\'erreur si POST /auth/login échoue', async () => {
        mockedPost.mockRejectedValueOnce({ response: { status: 401 } });

        await expect(
            authService.login({ email: 'bad@example.com', password: 'wrong' })
        ).rejects.toMatchObject({ response: { status: 401 } });
    });

    it('propage l\'erreur si GET /user/me échoue', async () => {
        mockedPost.mockResolvedValueOnce({ data: { token: 'jwt-token' } });
        mockedGet.mockRejectedValueOnce(new Error('Network error'));

        await expect(
            authService.login({ email: 'abdoulaye@example.com', password: 'secret' })
        ).rejects.toThrow('Network error');
    });
});

// ─── register 

describe('authService.register()', () => {
    it('appelle POST /auth/register avec les données complètes', async () => {
        const user = makeUser();
        mockedPost.mockResolvedValueOnce({ data: { token: 'jwt-new', user } });

        await authService.register({
            email: 'abdoulaye@example.com',
            password: 'Secret@123',
            firstName: 'Abdoulaye',
            lastName: 'FOFANA',
        });

        expect(mockedPost).toHaveBeenCalledWith('/auth/register', {
            email: 'abdoulaye@example.com',
            password: 'Secret@123',
            firstName: 'Abdoulaye',
            lastName: 'FOFANA',
        });
    });

    it('retourne { token, user } en cas de succès', async () => {
        const user = makeUser();
        mockedPost.mockResolvedValueOnce({ data: { token: 'jwt-new', user } });

        const result = await authService.register({
            email: 'abdoulaye@example.com',
            password: 'Secret@123',
            firstName: 'Abdoulaye',
            lastName: 'FOFANA',
        });

        expect(result.token).toBe('jwt-new');
        expect(result.user).toEqual(user);
    });

    it('propage l\'erreur si le serveur retourne 409 (email déjà utilisé)', async () => {
        mockedPost.mockRejectedValueOnce({ response: { status: 409 } });

        await expect(
            authService.register({
                email: 'existing@example.com',
                password: 'Secret@123',
                firstName: 'Abdou',
                lastName: 'FOF',
            })
        ).rejects.toMatchObject({ response: { status: 409 } });
    });
});

// ─── getOAuthUrl 

describe('authService.getOAuthUrl()', () => {
    it('retourne une URL contenant le provider "google"', () => {
        const url = authService.getOAuthUrl('google');
        expect(url).toContain('/auth/oauth/google');
    });

    it('retourne une URL contenant le provider "github"', () => {
        const url = authService.getOAuthUrl('github');
        expect(url).toContain('/auth/oauth/github');
    });

    it('retourne une URL contenant le provider "microsoft"', () => {
        const url = authService.getOAuthUrl('microsoft');
        expect(url).toContain('/auth/oauth/microsoft');
    });

    it('retourne une chaîne de type URL (commence par http)', () => {
        const url = authService.getOAuthUrl('google');
        expect(url).toMatch(/^https?:\/\//);
    });
});
