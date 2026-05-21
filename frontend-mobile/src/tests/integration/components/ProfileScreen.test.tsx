// Suite de tests d'intégration pour le composant ProfileScreen
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import ProfileScreen from '../../../screens/profile/ProfileScreen';
import { useAuthStore } from '../../../store/authStore';
import { profileApi } from '../../../api/profile';
import { useToast } from '../../../hooks/useToast';

// Mock du store d'authentification
jest.mock('../../../store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

// Mock de l'API profil avec les opérations CRUD utilisateur
jest.mock('../../../api/profile', () => ({
  profileApi: {
    updateProfile: jest.fn(),
    changePassword: jest.fn(),
    deleteAccount: jest.fn(),
    uploadAvatar: jest.fn(),
  },
}));

// Mock du hook useToast
jest.mock('../../../hooks/useToast', () => ({
  useToast: jest.fn(),
}));

// Groupe de tests couvrant l'écran de profil utilisateur
describe('EcranProfil', () => {
  const mockNavigation = {
    navigate: jest.fn(),
  };
  const mockLogout = jest.fn();
  const mockUpdateUser = jest.fn();

  // Réinitialise les mocks et configure un utilisateur fictif dans le store
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: { id: 1, firstName: 'Test', lastName: 'User', email: 'test@test.com', storageUsed: 0, storageLimit: 1024 },
      logout: mockLogout,
      updateUser: mockUpdateUser,
    });

    (useToast as jest.Mock).mockReturnValue({
      showToast: jest.fn(),
      toast: { visible: false },
    });
  });

  // Vérifie que le nom et l'email de l'utilisateur sont bien affichés
  it('se rend correctement', async () => {
    const { getByText } = render(<ProfileScreen />);
    
    expect(getByText('Test User')).toBeTruthy();
    expect(getByText('test@test.com')).toBeTruthy();
  });
});
