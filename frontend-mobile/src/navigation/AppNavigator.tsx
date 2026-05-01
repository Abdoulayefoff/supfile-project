import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";
import { lightTheme, darkTheme } from "../constants/theme";


// Auth screens
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";
import { useFilesStore } from "../store/filesStore";

// Main screens
import FilesScreen from "../screens/files/FilesScreen";
import DashboardScreen from "../screens/dashboard/DashboardScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import TrashScreen from "../screens/trash/TrashScreen";
import ShareScreen from "../screens/share/ShareScreen";
import UploadModal from "../screens/upload/UploadScreen";

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Main: undefined;
  FilePreview: { fileId: number; fileName: string; mimeType: string };
  FolderView: { folderId: number; folderName: string };
  SharePublic: { token: string };
};

export type TabParamList = {
  Home: undefined;
  Files: undefined;
  Upload: undefined;
  Shared: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TabNavigator() {
  const { theme } = useThemeStore();
  const colors = theme === "dark" ? darkTheme : lightTheme;
  const [showUpload, setShowUpload] = useState(false);
  const { currentFolderId } = useFilesStore();
  
useEffect(() => {
  const preload = async () => {
    try {
      const { filesApi } = await import('../api/files');
      const { setGlobalCache } = await import('../store/filesStore');

      const [filesData, foldersData] = await Promise.all([
        filesApi.getFiles(undefined),
        filesApi.getFolders(undefined),
      ]);

      setGlobalCache('root', {
        files: filesData.files ?? [],
        folders: Array.isArray(foldersData) ? foldersData : [],
      });
      console.log('Preload done — files:', filesData.files?.length, 'folders:', foldersData?.length);
    } catch (e) {
      console.log('Preload error:', e);
    }
  };
  preload();
}, []);

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarShowLabel: true,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
            marginBottom: 4,
          },
          tabBarIcon: ({ color, focused }) => {
            let iconName: keyof typeof Ionicons.glyphMap = "home";
            switch (route.name) {
              case "Home":
                iconName = focused ? "home" : "home-outline";
                break;
              case "Files":
                iconName = focused ? "grid" : "grid-outline";
                break;
              case "Shared":
                iconName = focused ? "people" : "people-outline";
                break;
              case "Profile":
                iconName = focused ? "person" : "person-outline";
                break;
            }
            return <Ionicons name={iconName} size={22} color={color} />;
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textTertiary,
          tabBarStyle: {
            height: 65,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            backgroundColor: colors.tabBar,
            borderTopWidth: 0,
            paddingHorizontal: 8,
            paddingBottom: 10,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: theme === "dark" ? 0.4 : 0.08,
            shadowRadius: 16,
            elevation: 16,
          },
        })}
      >
        <Tab.Screen
          name="Home"
          component={DashboardScreen}
          options={{ title: "Accueil" }}
        />
        <Tab.Screen
          name="Files"
          component={FilesScreen}
          options={{ title: "Fichiers" }}
        />
        <Tab.Screen
          name="Upload"
          component={FilesScreen}
          options={{
            title: "Upload",
            tabBarLabel: () => null,
            tabBarButton: (props) => {
              const { onPress, ...rest } = props as any;
              return (
                <TouchableOpacity
                  onPress={() => setShowUpload(true)}
                  style={styles.uploadBtnWrapper}
                >
                  <View
                    style={[
                      styles.uploadBtn,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Ionicons name="add" size={32} color="#fff" />
                  </View>
                </TouchableOpacity>
              );
            },
          }}
        />
        <Tab.Screen
          name="Shared"
          component={ShareScreen}
          options={{ title: "Partagés" }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: "Profil" }}
        />
      </Tab.Navigator>

      <UploadModal
        visible={showUpload}
        onClose={() => setShowUpload(false)}
        onUploadSuccess={() => {
          setShowUpload(false);
        }}
        currentFolderId={currentFolderId}
      />
    </>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, loadUser } = useAuthStore(); // ← ajoute loadUser
  const { loadTheme, theme } = useThemeStore();
  const colors = theme === 'dark' ? darkTheme : lightTheme;
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await loadTheme();
        await loadUser();
      } catch (e) {
        console.log('Init error:', e);
      } finally {
        setAppReady(true);
      }
    };
    init();
  }, []);

  if (!appReady) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <Ionicons name="cloud-outline" size={48} color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={TabNavigator} />
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  uploadBtnWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -20,
    shadowColor: "#1A56DB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
