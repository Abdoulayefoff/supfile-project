// Suite de tests unitaires pour le module useToast
import { renderHook, act } from '@testing-library/react-native';
import { useToast } from '../../hooks/useToast';

// Groupe de tests couvrant le hook useToast (affichage, masquage, minuteur)
describe('useToast', () => {
  // Active les minuteurs simulés pour tester le masquage automatique
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // Vérifie que le toast démarre invisible avec un message et un type par défaut
  it('l\'état initial est correct', () => {
    const { result } = renderHook(() => useToast());
    
    expect(result.current.toast).toEqual({
      visible: false,
      message: '',
      type: 'info',
    });
  });

  // Vérifie que showToast rend le toast visible et programme sa disparition
  it('showToast updates state and sets timeout to hide', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showToast('Test message', 'success');
    });
    
    expect(result.current.toast).toEqual({
      visible: true,
      message: 'Test message',
      type: 'success',
    });
    
    // Avancer le temps
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    
    expect(result.current.toast.visible).toBe(false);
  });

  // Vérifie que hideToast masque immédiatement le toast
  it('hideToast updates state', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showToast('Test message');
    });
    
    act(() => {
      result.current.hideToast();
    });
    
    expect(result.current.toast.visible).toBe(false);
  });
});
