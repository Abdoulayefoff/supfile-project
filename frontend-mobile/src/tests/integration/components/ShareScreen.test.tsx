// Suite de tests d'intégration pour le composant ShareScreen
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import ShareScreen from '../../../screens/share/ShareScreen';
import { sharesApi } from '../../../api/shares';
import { useToast } from '../../../hooks/useToast';

// Mock de l'API des partages
jest.mock('../../../api/shares', () => ({
  sharesApi: {
    getShares: jest.fn(),
    getReceivedShares: jest.fn(),
  },
}));

// Mock du hook useToast
jest.mock('../../../hooks/useToast', () => ({
  useToast: jest.fn(),
}));

// Simule useFocusEffect avec useEffect pour déclencher le chargement en test
jest.mock('@react-navigation/native', () => {
  const React = require('react');
  return {
    useFocusEffect: jest.fn((callback) => {
      React.useEffect(callback, [callback]);
    }),
  };
});

// Groupe de tests couvrant l'écran des partages
describe('EcranPartage', () => {
  const mockNavigation = {
    navigate: jest.fn(),
  };

  // Réinitialise les mocks et configure les listes de partages à vide
  beforeEach(() => {
    jest.clearAllMocks();
    
    (sharesApi.getShares as jest.Mock).mockResolvedValue([]);
    (sharesApi.getReceivedShares as jest.Mock).mockResolvedValue([]);

    (useToast as jest.Mock).mockReturnValue({
      showToast: jest.fn(),
      toast: { visible: false },
    });
  });

  // Vérifie le rendu initial avec les onglets et l'appel API de chargement
  it('se rend correctement', async () => {
    const { getByText } = render(<ShareScreen />);
    
    await waitFor(() => {
      expect(getByText('Mes partages')).toBeTruthy();
      expect(sharesApi.getShares).toHaveBeenCalled();
    });
  });
});
