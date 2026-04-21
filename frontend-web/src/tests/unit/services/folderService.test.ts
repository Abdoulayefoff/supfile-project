import {
    listFolders,
    createFolder,
    renameFolder,
    moveFolder,
    deleteFolder,
    downloadFolder,
    getFolderBreadcrumbs,
} from '@/services/folderService';
import apiClient from '@/lib/axios';
import type { Folder } from '@/types';

jest.mock('@/lib/axios', () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        post: jest.fn(),
        patch: jest.fn(),
        delete: jest.fn(),
    },
}));

const mockedGet    = apiClient.get    as jest.MockedFunction<typeof apiClient.get>;
const mockedPost   = apiClient.post   as jest.MockedFunction<typeof apiClient.post>;
const mockedPatch  = apiClient.patch  as jest.MockedFunction<typeof apiClient.patch>;
const mockedDelete = apiClient.delete as jest.MockedFunction<typeof apiClient.delete>;

const makeFolder = (overrides: Partial<Folder> = {}): Folder => ({
    id: 1,
    name: 'Mon Dossier',
    parentId: null,
    isDeleted: false,
    deletedAt: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
});

const mockCreateObjectURL = jest.fn(() => 'blob:http://localhost/test');
const mockRevokeObjectURL = jest.fn();

beforeEach(() => {
    jest.clearAllMocks();
    window.URL.createObjectURL = mockCreateObjectURL;
    window.URL.revokeObjectURL = mockRevokeObjectURL;
});

// ─── listFolders 

describe('listFolders()', () => {
    it('appelle GET /folders sans paramètre par défaut', async () => {
        mockedGet.mockResolvedValueOnce({ data: [] });
        await listFolders();
        expect(mockedGet).toHaveBeenCalledWith('/folders', { params: {} });
    });

    it('passe parentId en paramètre quand fourni', async () => {
        mockedGet.mockResolvedValueOnce({ data: [] });
        await listFolders({ parentId: 5 });
        expect(mockedGet).toHaveBeenCalledWith('/folders', { params: { parentId: '5' } });
    });

    it('ne passe pas parentId quand il est null', async () => {
        mockedGet.mockResolvedValueOnce({ data: [] });
        await listFolders({ parentId: null });
        expect(mockedGet).toHaveBeenCalledWith('/folders', { params: {} });
    });

    it('retourne le tableau de dossiers', async () => {
        const folders = [makeFolder(), makeFolder({ id: 2, name: 'Sous-dossier' })];
        mockedGet.mockResolvedValueOnce({ data: folders });

        const result = await listFolders();
        expect(result).toHaveLength(2);
    });

    it('retourne un tableau vide si data est undefined', async () => {
        mockedGet.mockResolvedValueOnce({ data: undefined });
        const result = await listFolders();
        expect(result).toEqual([]);
    });
});

// ─── createFolder 

describe('createFolder()', () => {
    it('appelle POST /folders avec le nom et sans parentId si null', async () => {
        mockedPost.mockResolvedValueOnce({ data: makeFolder() });

        await createFolder({ name: 'Nouveau Dossier' });

        expect(mockedPost).toHaveBeenCalledWith('/folders', { name: 'Nouveau Dossier' });
    });

    it('inclut parentId dans le payload quand fourni', async () => {
        mockedPost.mockResolvedValueOnce({ data: makeFolder({ parentId: 3 }) });

        await createFolder({ name: 'Enfant', parentId: 3 });

        expect(mockedPost).toHaveBeenCalledWith('/folders', { name: 'Enfant', parentId: 3 });
    });

    it('trimme le nom du dossier', async () => {
        mockedPost.mockResolvedValueOnce({ data: makeFolder({ name: 'Projet' }) });

        await createFolder({ name: '  Projet  ' });

        const payload = mockedPost.mock.calls[0][1] as { name: string };
        expect(payload.name).toBe('Projet');
    });

    it('retourne le Folder créé', async () => {
        const created = makeFolder({ id: 99, name: 'Test' });
        mockedPost.mockResolvedValueOnce({ data: created });

        const result = await createFolder({ name: 'Test' });
        expect(result.id).toBe(99);
    });
});

// ─── renameFolder 

describe('renameFolder()', () => {
    it('appelle PATCH /folders/:id avec le nouveau nom', async () => {
        mockedPatch.mockResolvedValueOnce({ data: makeFolder({ name: 'Renommé' }) });

        await renameFolder(1, { name: 'Renommé' });

        expect(mockedPatch).toHaveBeenCalledWith('/folders/1', { name: 'Renommé' });
    });

    it('retourne le Folder mis à jour', async () => {
        const updated = makeFolder({ name: 'Nouveau Nom' });
        mockedPatch.mockResolvedValueOnce({ data: updated });

        const result = await renameFolder(1, { name: 'Nouveau Nom' });
        expect(result.name).toBe('Nouveau Nom');
    });
});

// ─── moveFolder 

describe('moveFolder()', () => {
    it('appelle PATCH /folders/:id/move avec le parent cible', async () => {
        mockedPatch.mockResolvedValueOnce({ data: makeFolder({ parentId: 10 }) });

        await moveFolder(1, { targetParentId: 10 });

        expect(mockedPatch).toHaveBeenCalledWith('/folders/1/move', { targetParentId: 10 });
    });

    it('accepte targetParentId null (déplacer à la racine)', async () => {
        mockedPatch.mockResolvedValueOnce({ data: makeFolder({ parentId: null }) });

        await moveFolder(1, { targetParentId: null });

        expect(mockedPatch).toHaveBeenCalledWith('/folders/1/move', { targetParentId: null });
    });
});

// ─── deleteFolder 

describe('deleteFolder()', () => {
    it('appelle DELETE /folders/:id', async () => {
        mockedDelete.mockResolvedValueOnce({});

        await deleteFolder(1);

        expect(mockedDelete).toHaveBeenCalledWith('/folders/1');
    });

    it('résout avec void', async () => {
        mockedDelete.mockResolvedValueOnce({});
        const result = await deleteFolder(1);
        expect(result).toBeUndefined();
    });

    it('propage l\'erreur si le dossier n\'existe pas (404)', async () => {
        mockedDelete.mockRejectedValueOnce({ response: { status: 404 } });
        await expect(deleteFolder(999)).rejects.toMatchObject({ response: { status: 404 } });
    });
});

// ─── downloadFolder 

describe('downloadFolder()', () => {
    it('appelle GET /folders/:id/download avec responseType blob', async () => {
        mockedGet.mockResolvedValueOnce({ data: new Blob(['content']) });

        await downloadFolder(1, 'Mon Dossier');

        expect(mockedGet).toHaveBeenCalledWith('/folders/1/download', { responseType: 'blob' });
    });

    it('crée et révoque une URL objet', async () => {
        mockedGet.mockResolvedValueOnce({ data: new Blob(['content']) });

        await downloadFolder(1, 'dossier');

        expect(mockCreateObjectURL).toHaveBeenCalled();
        expect(mockRevokeObjectURL).toHaveBeenCalled();
    });
});

// ─── getFolderBreadcrumbs 

describe('getFolderBreadcrumbs()', () => {
    it('appelle GET /folders/:id/breadcrumbs', async () => {
        mockedGet.mockResolvedValueOnce({ data: [] });

        await getFolderBreadcrumbs(5);

        expect(mockedGet).toHaveBeenCalledWith('/folders/5/breadcrumbs');
    });

    it('retourne le fil d\'Ariane', async () => {
        const breadcrumbs = [
            { id: 1, name: 'Racine' },
            { id: 5, name: 'Sous-dossier' },
        ];
        mockedGet.mockResolvedValueOnce({ data: breadcrumbs });

        const result = await getFolderBreadcrumbs(5);
        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('Racine');
    });

    it('retourne un tableau vide si data est undefined', async () => {
        mockedGet.mockResolvedValueOnce({ data: undefined });
        const result = await getFolderBreadcrumbs(5);
        expect(result).toEqual([]);
    });
});
