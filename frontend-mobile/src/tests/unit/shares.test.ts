// Suite de tests unitaires pour le module shares
import { sharesApi } from '../../api/shares';
import { apiClient } from '../../api/client';

jest.mock('../../api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

// Groupe de tests vérifiant que chaque méthode de sharesApi appelle le bon endpoint
describe('sharesApi', () => {
  // Réinitialise les appels mockés avant chaque test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getShares appelle le bon point de terminaison', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: [] });
    await sharesApi.getShares();
    expect(apiClient.get).toHaveBeenCalledWith('/shares');
  });

  it('getReceivedShares appelle le bon point de terminaison', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: [] });
    await sharesApi.getReceivedShares();
    expect(apiClient.get).toHaveBeenCalledWith('/shares/received');
  });

  it('createShare appelle le bon point de terminaison', async () => {
    (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: {} });
    await sharesApi.createShare({ fileId: 1 });
    expect(apiClient.post).toHaveBeenCalledWith('/shares', { fileId: 1 });
  });

  it('deleteShare appelle le bon point de terminaison', async () => {
    (apiClient.delete as jest.Mock).mockResolvedValueOnce({ data: {} });
    await sharesApi.deleteShare(1);
    expect(apiClient.delete).toHaveBeenCalledWith('/shares/1');
  });

  it('getPublicShare appelle le bon point de terminaison', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: {} });
    await sharesApi.getPublicShare('token123');
    expect(apiClient.get).toHaveBeenCalledWith('/shares/public/token123');
  });

  it('validatePublicShare appelle le bon point de terminaison', async () => {
    (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: {} });
    await sharesApi.validatePublicShare('token123', 'pass');
    expect(apiClient.post).toHaveBeenCalledWith('/shares/public/token123/validate', { password: 'pass' });
  });
});
