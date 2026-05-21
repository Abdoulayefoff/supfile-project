// Suite de tests d'intégration pour le composant Toast
import React from 'react';
import { render } from '@testing-library/react-native';
import { Toast } from '../../../components/Toast';

// Groupe de tests couvrant le rendu du composant Toast selon son type et sa visibilité
describe('Toast Component', () => {
  // Vérifie que le message s'affiche correctement en mode succès
  it('se rend correctement quand il est visible', () => {
    const { getByText } = render(
      <Toast visible={true} message="Success message" type="success" />
    );
    
    expect(getByText('Success message')).toBeTruthy();
  });

  // Vérifie que le message s'affiche correctement en mode erreur
  it('se rend correctement avec le type erreur', () => {
    const { getByText } = render(
      <Toast visible={true} message="Error message" type="error" />
    );
    
    expect(getByText('Error message')).toBeTruthy();
  });

  // Vérifie que le message s'affiche correctement en mode information
  it('se rend correctement avec le type info', () => {
    const { getByText } = render(
      <Toast visible={true} message="Info message" type="info" />
    );
    
    expect(getByText('Info message')).toBeTruthy();
  });
});
