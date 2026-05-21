// Suite de tests d'intégration pour le composant LoginScreen
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../../../screens/auth/LoginScreen';
import { useAuthStore } from '../../../store/authStore';
import { Alert } from 'react-native';

// Simuler les dépendances
// Remplace le store d'authentification par un mock pour isoler le composant
jest.mock('../../../store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

jest.spyOn(Alert, 'alert');

// Groupe de tests couvrant le formulaire de connexion
describe('EcranConnexion', () => {
  const mockLogin = jest.fn();
  const mockNavigation = {
    navigate: jest.fn(),
    replace: jest.fn(),
  };

  // Réinitialise les mocks et configure le store avant chaque test
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      login: mockLogin,
      isLoading: false,
    });
  });

  // Vérifie que tous les champs du formulaire et le bouton sont présents
  it('rend le formulaire de connexion correctement', () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen navigation={mockNavigation} />);
    
    expect(getByPlaceholderText('Adresse email')).toBeTruthy();
    expect(getByPlaceholderText('Mot de passe')).toBeTruthy();
    expect(getByText('Se connecter')).toBeTruthy();
  });

  // Vérifie que la validation bloque la soumission si les champs sont vides
  it('affiche une erreur si les champs sont vides', () => {
    const { getByText } = render(<LoginScreen navigation={mockNavigation} />);
    
    fireEvent.press(getByText('Se connecter'));
    
    expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Veuillez remplir tous les champs');
    expect(mockLogin).not.toHaveBeenCalled();
  });

  // Vérifie que login() est appelé avec les bonnes credentials
  it('appelle la connexion lors de la soumission avec des données valides', async () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen navigation={mockNavigation} />);
    
    fireEvent.changeText(getByPlaceholderText('Adresse email'), 'test@test.com');
    fireEvent.changeText(getByPlaceholderText('Mot de passe'), 'password123');
    fireEvent.press(getByText('Se connecter'));
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@test.com', 'password123');
    });
  });

  // Vérifie que la navigation vers Register est déclenchée
  it('navigue vers l\'écran d\'inscription quand S\'inscrire est appuyé', () => {
    const { getByText } = render(<LoginScreen navigation={mockNavigation} />);
    
    fireEvent.press(getByText('S\'inscrire'));
    
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Register');
  });
});
