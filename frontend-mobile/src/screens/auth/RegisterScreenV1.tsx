import { useState, useRef, useCallback } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Animated,
  Easing,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { useAuthStore } from "../../store/authStore";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import colors from "../../constants/colors";
import React from "react";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export default function RegisterScreenV1({ navigation }: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const [toggled, setToggled] = useState(false);

  const { register, isLoading } = useAuthStore();

  useFocusEffect(
    useCallback(() => {
      slideAnim.setValue(0);
      setToggled(false);
    }, []),
  );

  const validateEmail = (val: string): string => {
    if (!val) return "Email requis";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return "Email invalide";
    return "";
  };

  const validatePassword = (val: string): string => {
    if (!val) return "Mot de passe requis";
    if (val.length < 8) return `${val.length}/8 caractères minimum`;
    if (!/[A-Z]/.test(val)) return "Au moins une majuscule requise";
    if (!/[0-9]/.test(val)) return "Au moins un chiffre requis";
    return "";
  };

  const getPasswordStrength = (val: string): number => {
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    return score;
  };

  const getStrengthColor = (score: number): string => {
    if (score <= 1) return "#ef4444";
    if (score === 2) return "#f59e0b";
    if (score === 3) return "#3b82f6";
    return "#16a34a";
  };

  const getStrengthLabel = (score: number): string => {
    if (score <= 1) return "Faible";
    if (score === 2) return "Moyen";
    if (score === 3) return "Bon";
    return "Fort";
  };

  const handleEmailBlur = () => {
    setEmailFocused(false);
    setEmailTouched(true);
    setEmailError(validateEmail(email));
  };

  const handlePasswordBlur = () => {
    setPasswordFocused(false);
    setPasswordTouched(true);
    setPasswordError(validatePassword(password));
  };

  const handleSignUp = async () => {
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailError(eErr);
    setPasswordError(pErr);
    setEmailTouched(true);
    setPasswordTouched(true);
    if (eErr || pErr) return;

    const parts = fullName.trim().split(" ");
    try {
      await register({
        email,
        password,
        firstName: parts[0] ?? "",
        lastName: parts.slice(1).join(" ") ?? "",
      });
      Alert.alert(
        "✅ Compte créé !",
        "Ton compte a été créé avec succès. Connecte-toi maintenant.",
        [{ text: "Se connecter", onPress: () => navigation.navigate("Login") }],
      );
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 409) {
        setEmailError("Cette adresse email est déjà utilisée");
        setEmailTouched(true);
      } else {
        Alert.alert(
          "Erreur",
          err.response?.data?.error ?? "Erreur lors de l'inscription",
        );
      }
    }
  };

  const handleOAuthSignUp = (provider: string) => {
    Alert.alert(
      "Bientôt disponible",
      `Connexion ${provider} en cours d'intégration`,
    );
  };

  const handleArrowPress = () => {
    const toValue = toggled ? 0 : 1;
    Animated.timing(slideAnim, {
      toValue,
      duration: 400,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setToggled(!toggled);
      navigation.navigate("Login");
    });
  };

  const containerTranslateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -150],
  });
  const containerOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.6],
  });

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.backgroundContainer}>
        <View style={styles.topHalf} />
        <View style={styles.bottomHalf} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Image
            source={require("../../../assets/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <View style={styles.card}>
            <Text style={styles.title}>Créer un compte</Text>

            {/* Nom complet */}
            <TextInput
              placeholder="Nom complet"
              placeholderTextColor={colors.placeholder}
              value={fullName}
              onChangeText={setFullName}
              style={[styles.input, nameFocused && styles.inputFocused]}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              blurOnSubmit={false}
            />

            {/* Email */}
            <TextInput
              ref={emailRef}
              placeholder="Email"
              placeholderTextColor={colors.placeholder}
              value={email}
              onChangeText={(val) => {
                setEmail(val);
                if (emailTouched) setEmailError(validateEmail(val));
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              style={[
                styles.input,
                emailFocused && styles.inputFocused,
                emailTouched && emailError ? { borderColor: "#ef4444" } : null,
              ]}
              onFocus={() => setEmailFocused(true)}
              onBlur={handleEmailBlur}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
            />
            {emailTouched && (
              <View
                style={[
                  styles.validationBadge,
                  {
                    backgroundColor: emailError ? "#fef2f2" : "#f0fdf4",
                  },
                ]}
              >
                <Ionicons
                  name={emailError ? "close-circle" : "checkmark-circle"}
                  size={13}
                  color={emailError ? "#ef4444" : "#16a34a"}
                  style={{ marginRight: 5 }}
                />
                <Text
                  style={[
                    styles.validationText,
                    {
                      color: emailError ? "#ef4444" : "#16a34a",
                    },
                  ]}
                >
                  {emailError || "Email valide"}
                </Text>
              </View>
            )}

            {/* Mot de passe + œil */}
            <View
              style={[
                styles.inputWrapper,
                passwordFocused && styles.inputWrapperFocused,
                passwordTouched && passwordError
                  ? { borderColor: "#ef4444" }
                  : null,
              ]}
            >
              <TextInput
                ref={passwordRef}
                placeholder="Mot de passe"
                placeholderTextColor={colors.placeholder}
                value={password}
                onChangeText={(val) => {
                  setPassword(val);
                  if (passwordTouched) setPasswordError(validatePassword(val));
                }}
                secureTextEntry={!showPassword}
                style={styles.inputInner}
                onFocus={() => setPasswordFocused(true)}
                onBlur={handlePasswordBlur}
                returnKeyType="done"
                onSubmitEditing={handleSignUp}
              />
              <TouchableOpacity
                onPress={() => setShowPassword((v) => !v)}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.placeholder}
                />
              </TouchableOpacity>
            </View>

            {/* Indicateur force mot de passe */}
            {password.length > 0 && (
              <View style={styles.strengthRow}>
                {[...Array(4)].map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.strengthBar,
                      {
                        backgroundColor:
                          i < getPasswordStrength(password)
                            ? getStrengthColor(getPasswordStrength(password))
                            : "#e2e8f0",
                      },
                    ]}
                  />
                ))}
                <Text
                  style={[
                    styles.strengthLabel,
                    {
                      color: getStrengthColor(getPasswordStrength(password)),
                    },
                  ]}
                >
                  {getStrengthLabel(getPasswordStrength(password))}
                </Text>
              </View>
            )}
            {passwordTouched && (
              <View
                style={[
                  styles.validationBadge,
                  {
                    backgroundColor: passwordError ? "#fef2f2" : "#f0fdf4",
                  },
                ]}
              >
                <Ionicons
                  name={passwordError ? "close-circle" : "checkmark-circle"}
                  size={13}
                  color={passwordError ? "#ef4444" : "#16a34a"}
                  style={{ marginRight: 5 }}
                />
                <Text
                  style={[
                    styles.validationText,
                    {
                      color: passwordError ? "#ef4444" : "#16a34a",
                    },
                  ]}
                >
                  {passwordError || "Mot de passe valide"}
                </Text>
              </View>
            )}

            {/* Bouton S'inscrire */}
            <TouchableOpacity
              style={styles.button}
              onPress={handleSignUp}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>S'inscrire</Text>
              )}
            </TouchableOpacity>

            {/* OAuth */}
            <Text style={styles.orText}>Ou créer un compte avec</Text>
            <View style={styles.oauthRow}>
              {(["Google", "GitHub", "Microsoft"] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.oauthButton,
                    {
                      backgroundColor:
                        p === "Google"
                          ? "#DB4437"
                          : p === "GitHub"
                            ? "#333"
                            : "#0078D4",
                    },
                  ]}
                  onPress={() => handleOAuthSignUp(p)}
                >
                  <FontAwesome
                    name={
                      p === "Google"
                        ? "google"
                        : p === "GitHub"
                          ? "github"
                          : "windows"
                    }
                    size={20}
                    color="white"
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Box flottante gauche */}
      <View style={styles.floatingBoxContainer}>
        <Animated.View
          style={[
            styles.floatingBoxWrapper,
            {
              transform: [{ translateX: containerTranslateX }],
              opacity: containerOpacity,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.floatingBox}
            onPress={handleArrowPress}
            activeOpacity={0.9}
          >
            <View style={styles.floatingBoxContent}>
              <Text style={styles.floatingBoxText}>Connexion</Text>
              <View style={styles.arrowCircle}>
                <FontAwesome name="arrow-left" size={18} color="white" />
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundContainer: { ...StyleSheet.absoluteFillObject, zIndex: -1 },
  topHalf: { flex: 4, backgroundColor: colors.background },
  bottomHalf: {
    flex: 6,
    backgroundColor: "#0078D4",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  container: {
    flexGrow: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    padding: 20,
    paddingTop: 30,
  },
  logo: { width: 150, height: 150 },
  card: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 30,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    paddingVertical: 17,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 15,
    backgroundColor: colors.inputBackground,
    color: colors.text,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  inputFocused: { borderColor: colors.primary },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  inputWrapperFocused: { borderColor: colors.primary },
  inputInner: {
    flex: 1,
    paddingVertical: 17,
    color: colors.text,
    fontSize: 16,
  },
  eyeBtn: { padding: 4 },

  validationBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 10,
  },
  validationText: { fontSize: 12, fontWeight: "600", flex: 1 },

  strengthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  strengthBar: { flex: 1, height: 3, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: "700", marginLeft: 4 },

  button: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 15,
    marginTop: 8,
  },
  buttonText: { color: "white", fontWeight: "bold", fontSize: 16 },
  orText: {
    textAlign: "center",
    color: colors.placeholder,
    marginVertical: 12,
    fontWeight: "bold",
  },
  oauthRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
    width: "100%",
  },
  oauthButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },

  floatingBoxContainer: {
    position: "absolute",
    bottom: 60,
    right: 0,
    left: -20,
    height: 80,
    zIndex: 9999,
    elevation: 9999,
  },
  floatingBoxWrapper: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "flex-start",
  },
  floatingBox: {
    backgroundColor: "white",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderTopRightRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 20,
    marginLeft: 20,
  },
  floatingBoxContent: { flexDirection: "row", alignItems: "center" },
  floatingBoxText: { color: "#0078D4", fontWeight: "bold", fontSize: 14 },
  arrowCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#0078D4",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
});
