import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useTheme } from '../hooks/useTheme';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Importation des écrans liés à l'authentification
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';

// Importation des écrans principaux de l'application
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import FilesScreen from '../screens/files/FilesScreen';
import ShareScreen from '../screens/share/ShareScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import TrashScreen from '../screens/trash/TrashScreen';

// Initialisation des navigateurs (Pile et Onglets)
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Navigateur dédié aux écrans de connexion et d'inscription (Non authentifié)
const AuthNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
};

// Navigateur principal avec la barre d'onglets en bas de l'écran (Authentifié)
const MainTabNavigator = () => {
  const { colors } = useTheme(); // Récupère le thème actuel pour styliser la barre

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true, // Affiche l'en-tête (le nom de l'écran) en haut
        headerStyle: {
          backgroundColor: colors.header,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerTintColor: colors.textPrimary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.primary, // Couleur de l'onglet actif
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarIcon: ({ focused, color, size }) => {
          // Détermine quelle icône afficher selon l'onglet et son état (sélectionné ou non)
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'Dashboard') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Fichiers') iconName = focused ? 'folder' : 'folder-outline';
          else if (route.name === 'Partages') iconName = focused ? 'share-social' : 'share-social-outline';
          else if (route.name === 'Corbeille') iconName = focused ? 'trash' : 'trash-outline';
          else if (route.name === 'Profil') iconName = focused ? 'person' : 'person-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Fichiers" component={FilesScreen} />
      <Tab.Screen name="Partages" component={ShareScreen} />
      <Tab.Screen name="Corbeille" component={TrashScreen} />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

// Composant de navigation racine. Affiche un loader au démarrage puis le bon navigateur selon l'état d'authentification.
export const AppNavigator = () => {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const { loadTheme } = useThemeStore();

  // Au montage de l'application, on charge le thème sauvegardé et on vérifie la session utilisateur
  useEffect(() => {
    loadTheme();
    checkAuth();
  }, []);

  // Écran de chargement affiché pendant la vérification du JWT
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1A56DB" />
      </View>
    );
  }

  // Affiche le MainTabNavigator si connecté, sinon le AuthNavigator
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainTabNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
