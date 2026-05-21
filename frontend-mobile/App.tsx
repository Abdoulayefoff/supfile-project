import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useTheme } from './src/hooks/useTheme';
import { View } from 'react-native';

export default function App() {
  const { isDark, colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AppNavigator />
    </View>
  );
}
