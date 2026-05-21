// Suite de tests unitaires pour le module files
import { filesApi } from '../../api/files';
import { apiClient } from '../../api/client';

jest.mock('../../api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

// Groupe de tests vérifiant que chaque méthode de filesApi appelle le bon endpoint avec les bons params
describe('filesApi', () => {
  // Réinitialise les appels mockés avant chaque test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getFiles appelle le bon point de terminaison sans paramètres', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: [] });
    await filesApi.getFiles();
    expect(apiClient.get).toHaveBeenCalledWith('/files?');
  });

  it('getFiles appelle le bon point de terminaison avec paramètres', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: [] });
    await filesApi.getFiles(1, 'test');
    expect(apiClient.get).toHaveBeenCalledWith('/files?folderId=1&search=test');
  });

  it('getFolders appelle le bon point de terminaison', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: [] });
    await filesApi.getFolders(2);
    expect(apiClient.get).toHaveBeenCalledWith('/folders?parentId=2');
  });

  it('getBreadcrumbs appelle le bon point de terminaison', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: [] });
    await filesApi.getBreadcrumbs(3);
    expect(apiClient.get).toHaveBeenCalledWith('/folders/3/breadcrumbs');
  });

  it('createFolder appelle le bon point de terminaison', async () => {
    (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: { id: 1 } });
    await filesApi.createFolder('New Folder', 2);
    expect(apiClient.post).toHaveBeenCalledWith('/folders', { name: 'New Folder', parentId: 2 });
  });

  it('renameFile appelle le bon point de terminaison', async () => {
    (apiClient.patch as jest.Mock).mockResolvedValueOnce({ data: {} });
    await filesApi.renameFile(1, 'New Name.txt');
    expect(apiClient.patch).toHaveBeenCalledWith('/files/1', { name: 'New Name.txt' });
  });

  it('renameFolder appelle le bon point de terminaison', async () => {
    (apiClient.patch as jest.Mock).mockResolvedValueOnce({ data: {} });
    await filesApi.renameFolder(1, 'New Name');
    expect(apiClient.patch).toHaveBeenCalledWith('/folders/1', { name: 'New Name' });
  });

  it('deleteFile appelle le bon point de terminaison', async () => {
    (apiClient.delete as jest.Mock).mockResolvedValueOnce({ data: {} });
    await filesApi.deleteFile(1);
    expect(apiClient.delete).toHaveBeenCalledWith('/files/1');
  });

  it('deleteFolder appelle le bon point de terminaison', async () => {
    (apiClient.delete as jest.Mock).mockResolvedValueOnce({ data: {} });
    await filesApi.deleteFolder(1);
    expect(apiClient.delete).toHaveBeenCalledWith('/folders/1');
  });

  it('moveFile appelle le bon point de terminaison', async () => {
    (apiClient.patch as jest.Mock).mockResolvedValueOnce({ data: {} });
    await filesApi.moveFile(1, 2);
    expect(apiClient.patch).toHaveBeenCalledWith('/files/1/move', { targetFolderId: 2 });
  });

  it('moveFolder appelle le bon point de terminaison', async () => {
    (apiClient.patch as jest.Mock).mockResolvedValueOnce({ data: {} });
    await filesApi.moveFolder(1, 2);
    expect(apiClient.patch).toHaveBeenCalledWith('/folders/1/move', { targetParentId: 2 });
  });

  it('downloadFolder appelle le bon point de terminaison', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: new Blob() });
    await filesApi.downloadFolder(1);
    expect(apiClient.get).toHaveBeenCalledWith('/folders/1/download', { responseType: 'blob' });
  });

  // Vérifie que l'upload utilise FormData et un callback de progression
  it('uploadFile appelle le bon point de terminaison', async () => {
    (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: {} });
    const onProgress = jest.fn();
    
    await filesApi.uploadFile('file://test.jpg', 'image/jpeg', 'test.jpg', 1, onProgress);
    
    expect(apiClient.post).toHaveBeenCalledWith('/files', expect.any(FormData), expect.objectContaining({
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: expect.any(Function),
    }));
  });
});
