import { useThemeStore } from '../store/themeStore';
import { lightTheme, darkTheme } from '../constants/theme';

// Hook personnalisé pour exposer les couleurs du thème actuel
export const useTheme = () => {
  const theme = useThemeStore((state) => state.theme); // Récupère le mode depuis Zustand
  const isDark = theme === 'dark';
  const colors = isDark ? darkTheme : lightTheme; // Applique la bonne palette de couleurs

  return { colors, isDark };
};
