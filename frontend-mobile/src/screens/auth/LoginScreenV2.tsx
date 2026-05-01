import { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { useAuthStore } from "../../store/authStore";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import React from "react";
import { useWindowDimensions, Keyboard } from "react-native";
import * as WebBrowser from "expo-web-browser";

type Props = { navigation: NativeStackNavigationProp<RootStackParamList> };

const { height } = Dimensions.get("window");
const BLUE = "#1A56DB";

export default function LoginScreenV2({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const { login, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const passwordRef = useRef<TextInput>(null);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erreur", "Remplis tous les champs");
      return;
    }
    try {
      await login(email, password);
    } catch (err: any) {
      Alert.alert(
        "Erreur",
        err.response?.data?.error ?? "Identifiants incorrects",
      );
    }
  };

  const API_URL =
    process.env.EXPO_PUBLIC_API_URL ?? "http://192.168.0.15:8000/api";
  const BACKEND_URL = API_URL.replace("/api", "");

  const handleOAuth = async (provider: "google" | "github" | "microsoft") => {
    try {
      const url = `${BACKEND_URL}/api/auth/oauth/${provider}`;
      console.log("OAuth URL:", url);

      const result = await WebBrowser.openAuthSessionAsync(
        url,
        "supfile://auth/callback",
      );

      console.log("OAuth result:", JSON.stringify(result));

      if (result.type === "success") {
        // Extraire le token de l'URL de callback
        const urlParams = new URL(result.url);
        const token = urlParams.searchParams.get("token");

        if (token) {
          console.log("Token received:", token.substring(0, 20) + "...");
          await useAuthStore.getState().loginWithToken(token);
        }
      }
    } catch (err: any) {
      console.log("OAuth error:", err.message);
      Alert.alert("Erreur", "Connexion OAuth échouée");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Panneau bleu */}
      <View
        style={[
          styles.bluePanel,
          keyboardHeight > 0 && { height: height * 0.15 },
        ]}
      >
        <Image
          source={require("../../../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.bluePanelTitle}>Bienvenue</Text>
        <Text style={styles.bluePanelSub}>
          Gérez vos fichiers avec précision.
        </Text>
      </View>

      {/* Formulaire blanc */}
      <View style={styles.formPanel}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 16 }}
        >
          <Text style={styles.label}>ADRESSE EMAIL</Text>
          <View
            style={[
              styles.inputWrapper,
              emailFocused && styles.inputWrapperFocused,
            ]}
          >
            <FontAwesome
              name="envelope-o"
              size={14}
              color="#94a3b8"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="nom@exemple.com"
              placeholderTextColor="#94a3b8"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
            />
          </View>

          <View style={styles.labelRow}>
            <Text style={styles.label}>MOT DE PASSE</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("ForgotPassword")}
            >
              <Text style={styles.forgotLink}>Oublié ?</Text>
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.inputWrapper,
              passwordFocused && styles.inputWrapperFocused,
            ]}
          >
            <FontAwesome
              name="lock"
              size={15}
              color="#94a3b8"
              style={styles.inputIcon}
            />
            <TextInput
              ref={passwordRef}
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity
              onPress={() => setShowPassword((v) => !v)}
              style={{ marginRight: 4 }}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={18}
                color="#94a3b8"
              />
            </TouchableOpacity>
          </View>

          {/* Bouton connexion */}
          <TouchableOpacity
            style={[styles.submitButton, isLoading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.submitText}>Se connecter</Text>
                <FontAwesome
                  name="arrow-right"
                  size={13}
                  color="#fff"
                  style={{ marginLeft: 8 }}
                />
              </>
            )}
          </TouchableOpacity>

          {/* S'inscrire juste sous le bouton */}
          <View style={[styles.bottomLink, { marginBottom: 28 }]}>
            <Text style={styles.bottomLinkText}>Pas encore de compte ? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.bottomLinkAction}>S'inscrire</Text>
            </TouchableOpacity>
          </View>

          {/* Séparateur */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OU CONTINUER AVEC</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Boutons OAuth */}
          <View style={styles.oauthRow}>
            <TouchableOpacity
              style={styles.oauthBtn}
              onPress={() => handleOAuth("google")}
              activeOpacity={0.8}
            >
              <FontAwesome name="google" size={16} color="#EA4335" />
              <Text style={[styles.oauthLabel, { color: "#EA4335" }]}>
                Google
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.oauthBtn}
              onPress={() => handleOAuth("github")}
              activeOpacity={0.8}
            >
              <FontAwesome name="github" size={16} color="#24292e" />
              <Text style={[styles.oauthLabel, { color: "#24292e" }]}>
                GitHub
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.oauthBtn}
              onPress={() => handleOAuth("microsoft")}
              activeOpacity={0.8}
            >
              <FontAwesome name="windows" size={16} color="#00A4EF" />
              <Text style={[styles.oauthLabel, { color: "#00A4EF" }]}>
                Microsoft
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={[styles.footer, { marginTop: 45, marginBottom: 15 }]}>
            <Text style={styles.footerText}>CONFIDENTIALITÉ</Text>
            <Text style={styles.footerDot}>·</Text>
            <Text style={styles.footerText}>CONDITIONS</Text>
            <Text style={styles.footerDot}>·</Text>
            <Text style={styles.footerText}>AIDE</Text>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BLUE },

  bluePanel: {
    height: height * 0.3,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    backgroundColor: BLUE,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 12,
    // Fond blanc derrière le logo pour le faire ressortir
    backgroundColor: "rgb(255, 255, 255)",
    borderRadius: 24,
    padding: 8,
  },
  bluePanelTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    marginBottom: 6,
  },
  bluePanelSub: {
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
  },

  formPanel: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 32,
  },

  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 30,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#e2e8f0" },
  dividerText: {
    fontSize: 10,
    color: "#94a3b8",
    fontWeight: "700",
    letterSpacing: 1,
  },

  label: {
    fontSize: 10,
    fontWeight: "700",
    color: "#475569",
    letterSpacing: 1,
    marginBottom: 8,
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    paddingHorizontal: 14,
    marginBottom: 26,
  },
  inputWrapperFocused: { borderColor: BLUE },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 14, color: "#0f172a" },
  forgotInline: { fontSize: 12, color: BLUE, fontWeight: "600" },

  submitButton: {
    backgroundColor: BLUE,
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginBottom: 20,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 10,
  },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  bottomLink: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  bottomLinkText: { fontSize: 13, color: "#64748b" },
  bottomLinkAction: { fontSize: 13, color: BLUE, fontWeight: "700" },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  footerText: {
    fontSize: 10,
    color: "#94a3b8",
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  footerDot: { fontSize: 10, color: "#cbd5e1" },

  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  forgotLink: {
    fontSize: 12,
    color: BLUE,
    fontWeight: "600",
  },

  oauthRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 20,
  },
  oauthBtn: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    backgroundColor: "#fafafa",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  oauthLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
