import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import { Platform } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { useThemeStore } from './src/store/themeStore';

export default function App() {
  const { loadTheme, theme } = useThemeStore();

  useEffect(() => {
    loadTheme();
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('hidden');
      //NavigationBar.setBehaviorAsync('overlay-swipe');
    }
  }, []);

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <AppNavigator />
    </>
  );
}