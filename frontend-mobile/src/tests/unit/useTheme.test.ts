// Suite de tests unitaires pour le module useTheme
import { renderHook } from '@testing-library/react-native';
import { useTheme } from '../../hooks/useTheme';
import { useThemeStore } from '../../store/themeStore';
import { lightTheme, darkTheme } from '../../constants/theme';

// Groupe de tests vérifiant que useTheme retourne la bonne palette selon le thème actif
describe('useTheme', () => {
  // Vérifie que le thème clair retourne lightTheme et isDark=false
  it('returns light theme correctly', () => {
    useThemeStore.setState({ theme: 'light' });
    const { result } = renderHook(() => useTheme());
    
    expect(result.current.isDark).toBe(false);
    expect(result.current.colors).toEqual(lightTheme);
  });

  // Vérifie que le thème sombre retourne darkTheme et isDark=true
  it('returns dark theme correctly', () => {
    useThemeStore.setState({ theme: 'dark' });
    const { result } = renderHook(() => useTheme());
    
    expect(result.current.isDark).toBe(true);
    expect(result.current.colors).toEqual(darkTheme);
  });
});
