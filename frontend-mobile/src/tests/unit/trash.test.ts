// Suite de tests unitaires pour le module trash
import { trashApi } from '../../api/trash';
import { apiClient } from '../../api/client';

jest.mock('../../api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

// Groupe de tests vérifiant que chaque méthode de trashApi appelle le bon endpoint
describe('trashApi', () => {
  // Réinitialise les appels mockés avant chaque test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getTrash appelle le bon point de terminaison', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: [] });
    await trashApi.getTrash();
    expect(apiClient.get).toHaveBeenCalledWith('/trash');
  });

  it('restoreFile appelle le bon point de terminaison', async () => {
    (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: {} });
    await trashApi.restoreFile(1);
    expect(apiClient.post).toHaveBeenCalledWith('/trash/files/1/restore');
  });

  it('restoreFolder appelle le bon point de terminaison', async () => {
    (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: {} });
    await trashApi.restoreFolder(1);
    expect(apiClient.post).toHaveBeenCalledWith('/trash/folders/1/restore');
  });

  it('deleteFile appelle le bon point de terminaison', async () => {
    (apiClient.delete as jest.Mock).mockResolvedValueOnce({ data: {} });
    await trashApi.deleteFile(1);
    expect(apiClient.delete).toHaveBeenCalledWith('/trash/files/1');
  });

  it('deleteFolder appelle le bon point de terminaison', async () => {
    (apiClient.delete as jest.Mock).mockResolvedValueOnce({ data: {} });
    await trashApi.deleteFolder(1);
    expect(apiClient.delete).toHaveBeenCalledWith('/trash/folders/1');
  });
});
