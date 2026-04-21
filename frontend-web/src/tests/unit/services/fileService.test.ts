import {
    listFiles,
    uploadFile,
    renameFile,
    moveFile,
    deleteFile,
    downloadFile,
    getPreviewUrl,
} from '@/services/fileService';
import apiClient from '@/lib/axios';
import type { FileItem } from '@/types';

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

// Mock pour window.URL et DOM pour downloadFile
const mockCreateObjectURL = jest.fn(() => 'blob:http://localhost/test');
const mockRevokeObjectURL = jest.fn();

beforeEach(() => {
    jest.clearAllMocks();
    window.URL.createObjectURL = mockCreateObjectURL;
    window.URL.revokeObjectURL = mockRevokeObjectURL;
});

// ─── listFiles

describe('listFiles()', () => {
    it('appelle GET /files sans paramètre quand aucun filtre', async () => {
        mockedGet.mockResolvedValueOnce({ data: [] });
        await listFiles();
        expect(mockedGet).toHaveBeenCalledWith('/files', { params: {} });
    });

    it('passe folderId en paramètre quand fourni', async () => {
        mockedGet.mockResolvedValueOnce({ data: [] });
        await listFiles({ folderId: 5 });
        expect(mockedGet).toHaveBeenCalledWith('/files', { params: { folderId: '5' } });
    });

    it('passe search en paramètre quand fourni', async () => {
        mockedGet.mockResolvedValueOnce({ data: [] });
        await listFiles({ search: 'rapport' });
        expect(mockedGet).toHaveBeenCalledWith('/files', { params: { search: 'rapport' } });
    });

    it('ne passe pas folderId quand il est null', async () => {
        mockedGet.mockResolvedValueOnce({ data: [] });
        await listFiles({ folderId: null });
        expect(mockedGet).toHaveBeenCalledWith('/files', { params: {} });
    });

    it('ne passe pas search quand il est vide', async () => {
        mockedGet.mockResolvedValueOnce({ data: [] });
        await listFiles({ search: '' });
        expect(mockedGet).toHaveBeenCalledWith('/files', { params: {} });
    });

    it('retourne le tableau de fichiers', async () => {
        const files = [makeFile(), makeFile({ id: 2, name: 'image.png' })];
        mockedGet.mockResolvedValueOnce({ data: files });

        const result = await listFiles();
        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('document.pdf');
    });

    it('retourne un tableau vide si data est undefined', async () => {
        mockedGet.mockResolvedValueOnce({ data: undefined });
        const result = await listFiles();
        expect(result).toEqual([]);
    });
});

// ─── uploadFile 

describe('uploadFile()', () => {
    it('appelle POST /files avec multipart/form-data', async () => {
        const file = new File(['content'], 'test.txt', { type: 'text/plain' });
        const created = makeFile({ name: 'test.txt' });
        mockedPost.mockResolvedValueOnce({ data: created });

        await uploadFile({ file });

        expect(mockedPost).toHaveBeenCalledWith(
            '/files',
            expect.any(FormData),
            expect.objectContaining({
                headers: { 'Content-Type': 'multipart/form-data' },
            })
        );
    });

    it('inclut folderId dans le FormData quand fourni', async () => {
        const file = new File(['content'], 'test.txt', { type: 'text/plain' });
        mockedPost.mockResolvedValueOnce({ data: makeFile() });

        await uploadFile({ file, folderId: 3 });

        const formData = mockedPost.mock.calls[0][1] as FormData;
        expect(formData.get('folderId')).toBe('3');
    });

    it('retourne le FileItem créé', async () => {
        const created = makeFile({ id: 42, name: 'nouveau.pdf' });
        const file = new File(['content'], 'nouveau.pdf', { type: 'application/pdf' });
        mockedPost.mockResolvedValueOnce({ data: created });

        const result = await uploadFile({ file });
        expect(result.id).toBe(42);
    });

    it('appelle onUploadProgress avec un pourcentage calculé', async () => {
        const file = new File(['content'], 'test.txt', { type: 'text/plain' });
        mockedPost.mockImplementationOnce((_url, _data, config) => {
            config?.onUploadProgress?.({ loaded: 50, total: 100 } as import('axios').AxiosProgressEvent);
            return Promise.resolve({ data: makeFile() });
        });

        const progressCallback = jest.fn();
        await uploadFile({ file, onUploadProgress: progressCallback });

        expect(progressCallback).toHaveBeenCalledWith(50);
    });
});

// ─── renameFile 

describe('renameFile()', () => {
    it('appelle PATCH /files/:id avec le nouveau nom', async () => {
        const updated = makeFile({ name: 'nouveau-nom.pdf' });
        mockedPatch.mockResolvedValueOnce({ data: updated });

        await renameFile(1, { name: 'nouveau-nom.pdf' });

        expect(mockedPatch).toHaveBeenCalledWith('/files/1', { name: 'nouveau-nom.pdf' });
    });

    it('retourne le FileItem mis à jour', async () => {
        const updated = makeFile({ name: 'renommé.pdf' });
        mockedPatch.mockResolvedValueOnce({ data: updated });

        const result = await renameFile(1, { name: 'renommé.pdf' });
        expect(result.name).toBe('renommé.pdf');
    });
});

// ─── moveFile 

describe('moveFile()', () => {
    it('appelle PATCH /files/:id/move avec le dossier cible', async () => {
        mockedPatch.mockResolvedValueOnce({ data: makeFile({ folderId: 7 }) });

        await moveFile(1, { targetFolderId: 7 });

        expect(mockedPatch).toHaveBeenCalledWith('/files/1/move', { targetFolderId: 7 });
    });

    it('accepte targetFolderId null (déplacement vers la racine)', async () => {
        mockedPatch.mockResolvedValueOnce({ data: makeFile({ folderId: null }) });

        await moveFile(1, { targetFolderId: null });

        expect(mockedPatch).toHaveBeenCalledWith('/files/1/move', { targetFolderId: null });
    });
});

// ─── deleteFile 

describe('deleteFile()', () => {
    it('appelle DELETE /files/:id', async () => {
        mockedDelete.mockResolvedValueOnce({});

        await deleteFile(1);

        expect(mockedDelete).toHaveBeenCalledWith('/files/1');
    });

    it('résout avec void', async () => {
        mockedDelete.mockResolvedValueOnce({});
        const result = await deleteFile(1);
        expect(result).toBeUndefined();
    });

    it('propage l\'erreur si le serveur retourne 404', async () => {
        mockedDelete.mockRejectedValueOnce({ response: { status: 404 } });
        await expect(deleteFile(999)).rejects.toMatchObject({ response: { status: 404 } });
    });
});

// ─── downloadFile 

describe('downloadFile()', () => {
    it('appelle GET /files/:id avec responseType blob', async () => {
        mockedGet.mockResolvedValueOnce({ data: new Blob(['content']) });

        await downloadFile(1, 'document.pdf');

        expect(mockedGet).toHaveBeenCalledWith('/files/1', { responseType: 'blob' });
    });

    it('crée et révoque une URL objet', async () => {
        mockedGet.mockResolvedValueOnce({ data: new Blob(['content']) });

        await downloadFile(1, 'doc.pdf');

        expect(mockCreateObjectURL).toHaveBeenCalled();
        expect(mockRevokeObjectURL).toHaveBeenCalled();
    });
});

// ─── getPreviewUrl

describe('getPreviewUrl()', () => {
    it('construit une URL avec l\'id et le token encodé', () => {
        const url = getPreviewUrl(42, 'my.jwt.token');
        expect(url).toContain('/files/42/preview');
        expect(url).toContain('token=');
        expect(url).toContain(encodeURIComponent('my.jwt.token'));
    });

    it('encode correctement les caractères spéciaux du token', () => {
        const tokenWithSpecialChars = 'abc+def/ghi=';
        const url = getPreviewUrl(1, tokenWithSpecialChars);
        expect(url).toContain(encodeURIComponent(tokenWithSpecialChars));
    });
});
