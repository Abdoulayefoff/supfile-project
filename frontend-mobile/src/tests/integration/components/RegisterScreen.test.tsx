// Suite de tests d'intégration pour le composant RegisterScreen
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RegisterScreen from '../../../screens/auth/RegisterScreen';
import { useAuthStore } from '../../../store/authStore';
import { Alert } from 'react-native';

// Simuler les dépendances
// Remplace le store d'authentification par un mock pour isoler le composant
jest.mock('../../../store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

jest.spyOn(Alert, 'alert');

// Groupe de tests couvrant le formulaire d'inscription
describe('EcranInscription', () => {
  const mockRegister = jest.fn();
  const mockNavigation = {
    navigate: jest.fn(),
    replace: jest.fn(),
  };

  // Réinitialise les mocks et configure le store avant chaque test
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      register: mockRegister,
      isLoading: false,
    });
  });

  // Vérifie que tous les champs requis sont affichés
  it('rend le formulaire d\'inscription correctement', () => {
    const { getByPlaceholderText, getByText } = render(<RegisterScreen navigation={mockNavigation} />);
    
    expect(getByPlaceholderText('Prénom')).toBeTruthy();
    expect(getByPlaceholderText('Nom')).toBeTruthy();
    expect(getByPlaceholderText('Adresse email')).toBeTruthy();
    expect(getByPlaceholderText('Mot de passe (min. 8 caractères)')).toBeTruthy();
    expect(getByText('S\'inscrire')).toBeTruthy();
  });

  // Vérifie que la soumission avec des champs vides affiche une erreur
  it('affiche une erreur si des champs manquent', () => {
    const { getByText } = render(<RegisterScreen navigation={mockNavigation} />);
    
    fireEvent.press(getByText('S\'inscrire'));
    
    expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Veuillez remplir tous les champs');
    expect(mockRegister).not.toHaveBeenCalled();
  });

  // Vérifie que le consentement aux CGU est obligatoire
  it('affiche une erreur si le consentement n\'est pas coché', () => {
    const { getByPlaceholderText, getByText } = render(<RegisterScreen navigation={mockNavigation} />);
    
    fireEvent.changeText(getByPlaceholderText('Prénom'), 'Test');
    fireEvent.changeText(getByPlaceholderText('Nom'), 'User');
    fireEvent.changeText(getByPlaceholderText('Adresse email'), 'test@test.com');
    fireEvent.changeText(getByPlaceholderText('Mot de passe (min. 8 caractères)'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirmer le mot de passe'), 'password123');
    
    fireEvent.press(getByText('S\'inscrire'));
    
    expect(Alert.alert).toHaveBeenCalledWith('Erreur', "Vous devez accepter les conditions d'utilisation");
    expect(mockRegister).not.toHaveBeenCalled();
  });

  // Vérifie que register() est appelé avec les bonnes données
  it('appelle l\'inscription lors de la soumission avec des données valides', async () => {
    const { getByPlaceholderText, getByText, getByTestId } = render(<RegisterScreen navigation={mockNavigation} />);
    
    fireEvent.changeText(getByPlaceholderText('Prénom'), 'Test');
    fireEvent.changeText(getByPlaceholderText('Nom'), 'User');
    fireEvent.changeText(getByPlaceholderText('Adresse email'), 'test@test.com');
    fireEvent.changeText(getByPlaceholderText('Mot de passe (min. 8 caractères)'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirmer le mot de passe'), 'password123');
    
    // Simuler de cocher la case de consentement
    // L'écran d'inscription utilise un composant pour la case à cocher
    // Pour simplifier, nous trouvons le texte ou simulons l'action
    fireEvent.press(getByText('conditions d\'utilisation'));
    
    fireEvent.press(getByText('S\'inscrire'));
    
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@test.com',
        password: 'password123',
        consent: true
      });
    });
  });

  // Vérifie que la navigation vers Login est déclenchée
  it('navigue vers l\'écran de connexion quand Se connecter est appuyé', () => {
    const { getByText } = render(<RegisterScreen navigation={mockNavigation} />);
    
    fireEvent.press(getByText('Se connecter'));
    
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Login');
  });
});
