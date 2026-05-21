// Suite de tests d'intégration pour le composant FilesScreen
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import FilesScreen from '../../../screens/files/FilesScreen';
import { useFilesStore } from '../../../store/filesStore';
import { useAuthStore } from '../../../store/authStore';
import { filesApi } from '../../../api/files';
import { useToast } from '../../../hooks/useToast';

// Mock du store des fichiers
jest.mock('../../../store/filesStore', () => ({
  useFilesStore: jest.fn(),
}));

// Mock du store d'authentification
jest.mock('../../../store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

// Mock de l'API fichiers avec les endpoints de base
jest.mock('../../../api/files', () => ({
  filesApi: {
    getFiles: jest.fn(),
    getFolders: jest.fn(),
    getBreadcrumbs: jest.fn(),
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

// Groupe de tests couvrant le rendu initial de l'écran des fichiers
describe('EcranFichiers', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    setOptions: jest.fn(),
  };

  const mockRoute = {
    params: { folderId: null, folderName: null },
  };

  // Réinitialise les mocks et pré-configure les réponses API à des listes vides
  beforeEach(() => {
    jest.clearAllMocks();
    
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: { id: 1, firstName: 'Test', lastName: 'User' },
    });

    (useFilesStore as unknown as jest.Mock).mockReturnValue({
      files: [],
      folders: [],
      breadcrumbs: [],
      setFiles: jest.fn(),
      setFolders: jest.fn(),
      setBreadcrumbs: jest.fn(),
    });

    (filesApi.getFiles as jest.Mock).mockResolvedValue([]);
    (filesApi.getFolders as jest.Mock).mockResolvedValue([]);
    (filesApi.getBreadcrumbs as jest.Mock).mockResolvedValue([]);

    (useToast as jest.Mock).mockReturnValue({
      showToast: jest.fn(),
      toast: { visible: false },
    });
  });

  // Vérifie que les appels API sont bien exécutés au montage du composant
  it('se rend correctement', async () => {
    const { getByText } = render(<FilesScreen navigation={mockNavigation} route={mockRoute} />);
    
    await waitFor(() => {
      expect(filesApi.getFiles).toHaveBeenCalled();
      expect(filesApi.getFolders).toHaveBeenCalled();
    });
  });
});
