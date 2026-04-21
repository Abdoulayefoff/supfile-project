import {
    listTrash,
    restoreFile,
    restoreFolder,
    permanentDeleteFile,
    permanentDeleteFolder,
} from '@/services/trashService';
import apiClient from '@/lib/axios';

jest.mock('@/lib/axios', () => ({
    __esModule: true,
    default: {
        get:    jest.fn(),
        post:   jest.fn(),
        delete: jest.fn(),
        patch:  jest.fn(),
    },
}));

const mockedGet    = apiClient.get    as jest.MockedFunction<typeof apiClient.get>;
const mockedPost   = apiClient.post   as jest.MockedFunction<typeof apiClient.post>;
const mockedDelete = apiClient.delete as jest.MockedFunction<typeof apiClient.delete>;

const makeTrashResponse = () => ({
    files: [
        { id: 1, name: 'old-doc.pdf', deletedAt: '2026-01-10T00:00:00Z', size: 1024, mimeType: 'application/pdf' },
    ],
    folders: [
        { id: 2, name: 'ancien-dossier', deletedAt: '2026-01-09T00:00:00Z' },
    ],
});

beforeEach(() => {
    jest.clearAllMocks();
});

// ─── listTrash 

describe('listTrash()', () => {
    it('appelle GET /trash', async () => {
        mockedGet.mockResolvedValueOnce({ data: makeTrashResponse() });

        await listTrash();

        expect(mockedGet).toHaveBeenCalledWith('/trash');
    });

    it('retourne les fichiers et dossiers de la corbeille', async () => {
        const trashData = makeTrashResponse();
        mockedGet.mockResolvedValueOnce({ data: trashData });

        const result = await listTrash();

        expect(result.files).toHaveLength(1);
        expect(result.folders).toHaveLength(1);
        expect(result.files[0].name).toBe('old-doc.pdf');
    });

    it('propage l\'erreur si le serveur retourne 401', async () => {
        mockedGet.mockRejectedValueOnce({ response: { status: 401 } });

        await expect(listTrash()).rejects.toMatchObject({ response: { status: 401 } });
    });
});

// ─── restoreFile 

describe('restoreFile()', () => {
    it('appelle POST /trash/files/:id/restore', async () => {
        mockedPost.mockResolvedValueOnce({});

        await restoreFile(1);

        expect(mockedPost).toHaveBeenCalledWith('/trash/files/1/restore');
    });

    it('résout avec void', async () => {
        mockedPost.mockResolvedValueOnce({});

        const result = await restoreFile(1);

        expect(result).toBeUndefined();
    });

    it('propage l\'erreur si la restauration échoue', async () => {
        mockedPost.mockRejectedValueOnce({ response: { status: 404 } });

        await expect(restoreFile(999)).rejects.toMatchObject({ response: { status: 404 } });
    });
});

// ─── restoreFolder 

describe('restoreFolder()', () => {
    it('appelle POST /trash/folders/:id/restore', async () => {
        mockedPost.mockResolvedValueOnce({});

        await restoreFolder(2);

        expect(mockedPost).toHaveBeenCalledWith('/trash/folders/2/restore');
    });

    it('résout avec void', async () => {
        mockedPost.mockResolvedValueOnce({});

        const result = await restoreFolder(2);

        expect(result).toBeUndefined();
    });
});

// ─── permanentDeleteFile 

describe('permanentDeleteFile()', () => {
    it('appelle DELETE /trash/files/:id', async () => {
        mockedDelete.mockResolvedValueOnce({});

        await permanentDeleteFile(1);

        expect(mockedDelete).toHaveBeenCalledWith('/trash/files/1');
    });

    it('résout avec void', async () => {
        mockedDelete.mockResolvedValueOnce({});

        const result = await permanentDeleteFile(1);

        expect(result).toBeUndefined();
    });

    it('propage l\'erreur si l\'élément est introuvable', async () => {
        mockedDelete.mockRejectedValueOnce({ response: { status: 404 } });

        await expect(permanentDeleteFile(999)).rejects.toMatchObject({ response: { status: 404 } });
    });
});

// ─── permanentDeleteFolder 

describe('permanentDeleteFolder()', () => {
    it('appelle DELETE /trash/folders/:id', async () => {
        mockedDelete.mockResolvedValueOnce({});

        await permanentDeleteFolder(2);

        expect(mockedDelete).toHaveBeenCalledWith('/trash/folders/2');
    });

    it('résout avec void', async () => {
        mockedDelete.mockResolvedValueOnce({});

        const result = await permanentDeleteFolder(2);

        expect(result).toBeUndefined();
    });

    it('propage l\'erreur si le serveur retourne 403', async () => {
        mockedDelete.mockRejectedValueOnce({ response: { status: 403 } });

        await expect(permanentDeleteFolder(5)).rejects.toMatchObject({ response: { status: 403 } });
    });
});
