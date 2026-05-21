// Suite de tests unitaires pour le module dashboard
import { dashboardApi } from '../../api/dashboard';
import { apiClient } from '../../api/client';

jest.mock('../../api/client', () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

// Groupe de tests vérifiant que chaque méthode de dashboardApi appelle le bon endpoint
describe('dashboardApi', () => {
  // Réinitialise les appels mockés avant chaque test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Vérifie l'endpoint des statistiques globales
  it('getStats appelle le bon point de terminaison', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: {} });
    await dashboardApi.getStats();
    expect(apiClient.get).toHaveBeenCalledWith('/dashboard/stats');
  });

  // Vérifie l'endpoint des statistiques par type de fichier
  it('getStatsByType appelle le bon point de terminaison', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: [] });
    await dashboardApi.getStatsByType();
    expect(apiClient.get).toHaveBeenCalledWith('/dashboard/stats/type');
  });

  // Vérifie l'endpoint des fichiers récents
  it('getRecentFiles appelle le bon point de terminaison', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: [] });
    await dashboardApi.getRecentFiles();
    expect(apiClient.get).toHaveBeenCalledWith('/dashboard/recent');
  });
});
