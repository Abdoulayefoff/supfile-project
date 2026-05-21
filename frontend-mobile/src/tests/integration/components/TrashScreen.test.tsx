// Suite de tests d'intégration pour le composant TrashScreen
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import TrashScreen from '../../../screens/trash/TrashScreen';
import { trashApi } from '../../../api/trash';
import { useToast } from '../../../hooks/useToast';

// Mock de l'API corbeille
jest.mock('../../../api/trash', () => ({
  trashApi: {
    getTrash: jest.fn(),
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

// Groupe de tests couvrant l'écran de la corbeille
describe('EcranCorbeille', () => {
  const mockNavigation = {
    navigate: jest.fn(),
  };

  // Configure la corbeille comme vide avant chaque test
  beforeEach(() => {
    jest.clearAllMocks();
    
    (trashApi.getTrash as jest.Mock).mockResolvedValue({ files: [], folders: [] });

    (useToast as jest.Mock).mockReturnValue({
      showToast: jest.fn(),
      toast: { visible: false },
    });
  });

  // Vérifie que le message de corbeille vide s'affiche et que l'API est appelée
  it('se rend correctement', async () => {
    const { getByText } = render(<TrashScreen />);
    
    await waitFor(() => {
      expect(getByText('La corbeille est vide')).toBeTruthy();
      expect(trashApi.getTrash).toHaveBeenCalled();
    });
  });
});
