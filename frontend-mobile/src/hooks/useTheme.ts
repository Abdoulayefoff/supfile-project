import { useThemeStore } from '../store/themeStore';
import { lightTheme, darkTheme, AppTheme } from '../constants/theme';

export function useTheme(): { colors: AppTheme; isDark: boolean } {
  const { theme } = useThemeStore();
  return {
    colors: theme === 'dark' ? darkTheme : lightTheme,
    isDark: theme === 'dark',
  };
}