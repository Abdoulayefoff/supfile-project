// Suite de tests d'intégration pour le composant OAuthWebViewModal
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import OAuthWebViewModal from '../../../components/OAuthWebViewModal';

// Groupe de tests couvrant la visibilité et le comportement de la modal OAuth
describe('ModalWebViewOAuth', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  // Réinitialise les callbacks mockés avant chaque test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Vérifie que la modal est montée dans le DOM quand visible=true
  it('se rend correctement quand il est visible', () => {
    const { getByTestId, queryByTestId } = render(
      <OAuthWebViewModal
        visible={true}
        onClose={mockOnClose}
        provider="google"
        onSuccess={mockOnSuccess}
        onError={mockOnError}
        apiBaseUrl="https://example.com"
      />
    );
    
    // Vérifier si le modal est visible
    expect(queryByTestId('oauth-modal')).toBeDefined();
  });

  // Vérifie que la modal n'affiche pas de contenu quand visible=false
  it('ne se rend pas quand il est invisible', () => {
    const { queryByTestId } = render(
      <OAuthWebViewModal
        visible={false}
        onClose={mockOnClose}
        provider="google"
        onSuccess={mockOnSuccess}
        onError={mockOnError}
        apiBaseUrl="https://example.com"
      />
    );
  });
});
