// Suite de tests d'intégration pour le composant DashboardScreen
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import DashboardScreen from '../../../screens/dashboard/DashboardScreen';
import { useAuthStore } from '../../../store/authStore';
import { dashboardApi } from '../../../api/dashboard';
import { useToast } from '../../../hooks/useToast';

// Mock du store d'authentification
jest.mock('../../../store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

// Mock de l'API du tableau de bord avec les trois endpoints nécessaires
jest.mock('../../../api/dashboard', () => ({
  dashboardApi: {
    getStats: jest.fn(),
    getStatsByType: jest.fn(),
    getRecentFiles: jest.fn(),
  },
}));

// Mock du hook useToast pour éviter les dépendances d'animation
jest.mock('../../../hooks/useToast', () => ({
  useToast: jest.fn(),
}));

// Simule useFocusEffect avec useEffect pour déclencher le chargement automatiquement en test
jest.mock('@react-navigation/native', () => {
  const React = require('react');
  return {
    useFocusEffect: jest.fn((callback) => {
      React.useEffect(callback, [callback]);
    }),
  };
});

describe('EcranTableauDeBord', () => {
  const mockNavigation = {
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: { firstName: 'Test', lastName: 'User' },
    });
    
    (dashboardApi.getStats as jest.Mock).mockResolvedValue({
      totalSize: 1024,
      fileCount: 10,
      folderCount: 2,
      usagePercent: 50,
    });
    
    (dashboardApi.getStatsByType as jest.Mock).mockResolvedValue([
      { mimeType: 'image/jpeg', count: 5, size: 500 },
    ]);
    
    (dashboardApi.getRecentFiles as jest.Mock).mockResolvedValue([
      { id: 1, name: 'test.jpg', size: 500, mimeType: 'image/jpeg', updatedAt: new Date().toISOString() },
    ]);

    (useToast as jest.Mock).mockReturnValue({
      showToast: jest.fn(),
      toast: { visible: false },
    });
  });

  it('se rend correctement et récupère les données', async () => {
    const { getByText } = render(<DashboardScreen navigation={mockNavigation} />);
    
    await waitFor(() => {
      expect(getByText('Bonjour,')).toBeTruthy();
      expect(getByText('Test User')).toBeTruthy();
      expect(dashboardApi.getStats).toHaveBeenCalled();
    });
  });
});
