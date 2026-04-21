import { getMe, updateProfile, changePassword, uploadAvatar } from '@/services/userService';
import apiClient from '@/lib/axios';
import type { User } from '@/types';

jest.mock('@/lib/axios', () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        patch: jest.fn(),
        post: jest.fn(),
    },
}));

const mockedGet   = apiClient.get   as jest.MockedFunction<typeof apiClient.get>;
const mockedPatch = apiClient.patch as jest.MockedFunction<typeof apiClient.patch>;
const mockedPost  = apiClient.post  as jest.MockedFunction<typeof apiClient.post>;

const makeUser = (overrides: Partial<User> = {}): User => ({
    id: 1,
    email: 'abdoulaye@example.com',
    firstName: 'Abdoulaye',
    lastName: 'FOFANA',
    avatar: null,
    quotaUsed: 1000,
    quotaLimit: 10_737_418_240,
    theme: null,
    roles: ['ROLE_USER'],
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
});

beforeEach(() => {
    jest.clearAllMocks();
});

// ─── getMe 

describe('getMe()', () => {
    it('appelle GET /user/me', async () => {
        mockedGet.mockResolvedValueOnce({ data: { user: makeUser() } });

        await getMe();

        expect(mockedGet).toHaveBeenCalledWith('/user/me');
    });

    it('retourne l\'utilisateur extrait de la réponse', async () => {
        const user = makeUser({ email: 'abdoulaye@example.com' });
        mockedGet.mockResolvedValueOnce({ data: { user } });

        const result = await getMe();
        expect(result).toEqual(user);
    });

    it('propage l\'erreur si non authentifié (401)', async () => {
        mockedGet.mockRejectedValueOnce({ response: { status: 401 } });
        await expect(getMe()).rejects.toMatchObject({ response: { status: 401 } });
    });
});

// ─── updateProfile 

describe('updateProfile()', () => {
    it('appelle PATCH /user/me avec les paramètres fournis', async () => {
        const updated = makeUser({ firstName: 'Bob' });
        mockedPatch.mockResolvedValueOnce({ data: { user: updated } });

        await updateProfile({ firstName: 'Bob' });

        expect(mockedPatch).toHaveBeenCalledWith('/user/me', { firstName: 'Bob' });
    });

    it('retourne { user, token } quand l\'email change (nouveau token)', async () => {
        const updated = makeUser({ email: 'new@example.com' });
        mockedPatch.mockResolvedValueOnce({ data: { user: updated, token: 'new-jwt' } });

        const result = await updateProfile({ email: 'new@example.com' });

        expect(result.user.email).toBe('new@example.com');
        expect(result.token).toBe('new-jwt');
    });

    it('retourne { user } sans token quand l\'email ne change pas', async () => {
        const updated = makeUser({ firstName: 'Charlie' });
        mockedPatch.mockResolvedValueOnce({ data: { user: updated } });

        const result = await updateProfile({ firstName: 'Charlie' });

        expect(result.token).toBeUndefined();
    });

    it('accepte une mise à jour partielle du thème', async () => {
        const updated = makeUser({ theme: 'dark' });
        mockedPatch.mockResolvedValueOnce({ data: { user: updated } });

        await updateProfile({ theme: 'dark' });

        expect(mockedPatch).toHaveBeenCalledWith('/user/me', { theme: 'dark' });
    });
});

// ─── changePassword 

describe('changePassword()', () => {
    it('appelle POST /user/me/password avec les mots de passe', async () => {
        mockedPost.mockResolvedValueOnce({});

        await changePassword({
            currentPassword: 'OldPass@123',
            newPassword: 'NewPass@456',
        });

        expect(mockedPost).toHaveBeenCalledWith('/user/me/password', {
            currentPassword: 'OldPass@123',
            newPassword: 'NewPass@456',
        });
    });

    it('résout avec void en cas de succès', async () => {
        mockedPost.mockResolvedValueOnce({});
        const result = await changePassword({
            currentPassword: 'OldPass@123',
            newPassword: 'NewPass@456',
        });
        expect(result).toBeUndefined();
    });

    it('propage l\'erreur si le mot de passe actuel est incorrect (400)', async () => {
        mockedPost.mockRejectedValueOnce({ response: { status: 400 } });

        await expect(
            changePassword({ currentPassword: 'Wrong', newPassword: 'New@123' })
        ).rejects.toMatchObject({ response: { status: 400 } });
    });
});

// ─── uploadAvatar 

describe('uploadAvatar()', () => {
    it('appelle POST /user/me/avatar avec multipart/form-data', async () => {
        const file = new File(['img'], 'avatar.jpg', { type: 'image/jpeg' });
        const updated = makeUser({ avatar: '/avatars/new.jpg' });
        mockedPost.mockResolvedValueOnce({ data: { user: updated } });

        await uploadAvatar(file);

        expect(mockedPost).toHaveBeenCalledWith(
            '/user/me/avatar',
            expect.any(FormData),
            expect.objectContaining({
                headers: { 'Content-Type': 'multipart/form-data' },
            })
        );
    });

    it('inclut le fichier avec la clé "avatar" dans le FormData', async () => {
        const file = new File(['img'], 'avatar.jpg', { type: 'image/jpeg' });
        mockedPost.mockResolvedValueOnce({ data: { user: makeUser() } });

        await uploadAvatar(file);

        const formData = mockedPost.mock.calls[0][1] as FormData;
        expect(formData.get('avatar')).toBe(file);
    });

    it('retourne l\'utilisateur mis à jour', async () => {
        const file = new File(['img'], 'avatar.jpg', { type: 'image/jpeg' });
        const updated = makeUser({ avatar: '/avatars/new.jpg' });
        mockedPost.mockResolvedValueOnce({ data: { user: updated } });

        const result = await uploadAvatar(file);
        expect(result.avatar).toBe('/avatars/new.jpg');
    });

    it('appelle onUploadProgress avec le pourcentage calculé', async () => {
        const file = new File(['img'], 'avatar.jpg', { type: 'image/jpeg' });
        mockedPost.mockImplementationOnce((_url, _data, config) => {
            config?.onUploadProgress?.({ loaded: 75, total: 100 } as import('axios').AxiosProgressEvent);
            return Promise.resolve({ data: { user: makeUser() } });
        });

        const progressCallback = jest.fn();
        await uploadAvatar(file, progressCallback);

        expect(progressCallback).toHaveBeenCalledWith(75);
    });

    it('ne rejète pas si onUploadProgress n\'est pas fourni', async () => {
        const file = new File(['img'], 'avatar.jpg', { type: 'image/jpeg' });
        mockedPost.mockImplementationOnce((_url, _data, config) => {
            config?.onUploadProgress?.({ loaded: 50, total: 100 } as import('axios').AxiosProgressEvent);
            return Promise.resolve({ data: { user: makeUser() } });
        });

        await expect(uploadAvatar(file)).resolves.not.toThrow();
    });
});
