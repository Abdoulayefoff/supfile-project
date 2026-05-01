import { useState, useRef, useCallback } from 'react';
import {
  StyleSheet, Text, TextInput, TouchableOpacity, View, Image,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  Alert, Animated, Easing,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useAuthStore } from '../../store/authStore';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import React from 'react';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export default function LoginScreenV1({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const [toggled, setToggled] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const { login, isLoading } = useAuthStore();

  useFocusEffect(
    useCallback(() => {
      slideAnim.setValue(0);
      setToggled(false);
    }, [])
  );

  const validateEmail = (val: string): string => {
    if (!val) return 'Email requis';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Email invalide';
    return '';
  };

  const validatePassword = (val: string): string => {
    if (!val) return 'Mot de passe requis';
    if (val.length < 6) return 'Au moins 6 caractères';
    return '';
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

  const handleSignIn = async () => {
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailError(eErr);
    setPasswordError(pErr);
    setEmailTouched(true);
    setPasswordTouched(true);
    if (eErr || pErr) return;

    try {
      await login(email, password);
    } catch (err: any) {
      Alert.alert('Erreur', err.response?.data?.error ?? 'Identifiants incorrects');
    }
  };

  const handleOAuthSignIn = (provider: string) => {
    Alert.alert('Bientôt disponible', `Connexion ${provider} en cours d'intégration`);
  };

  const handleArrowPress = () => {
    const toValue = toggled ? 0 : 1;
    Animated.timing(slideAnim, {
      toValue, duration: 400,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setToggled(!toggled);
      navigation.navigate('Register');
    });
  };

  const containerTranslateX = slideAnim.interpolate({
    inputRange: [0, 1], outputRange: [0, 150],
  });
  const containerOpacity = slideAnim.interpolate({
    inputRange: [0, 1], outputRange: [1, 0.6],
  });

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.backgroundContainer}>
        <View style={styles.topHalf} />
        <View style={styles.bottomHalf} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <View style={styles.card}>
            <Text style={styles.title}>Connexion</Text>

            {/* Email */}
            <TextInput
              placeholder="Email"
              placeholderTextColor={colors.placeholder}
              value={email}
              onChangeText={val => {
                setEmail(val);
                if (emailTouched) setEmailError(validateEmail(val));
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              style={[
                styles.input,
                emailFocused && styles.inputFocused,
                emailTouched && emailError ? { borderColor: '#ef4444' } : null,
              ]}
              onFocus={() => setEmailFocused(true)}
              onBlur={handleEmailBlur}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
            />
            {emailTouched && (
              <View style={[styles.validationBadge, {
                backgroundColor: emailError ? '#fef2f2' : '#f0fdf4',
              }]}>
                <Ionicons
                  name={emailError ? 'close-circle' : 'checkmark-circle'}
                  size={13}
                  color={emailError ? '#ef4444' : '#16a34a'}
                  style={{ marginRight: 5 }}
                />
                <Text style={[styles.validationText, {
                  color: emailError ? '#ef4444' : '#16a34a',
                }]}>
                  {emailError || 'Email valide'}
                </Text>
              </View>
            )}

            {/* Mot de passe + œil */}
            <View style={[
              styles.inputWrapper,
              passwordFocused && styles.inputWrapperFocused,
              passwordTouched && passwordError ? { borderColor: '#ef4444' } : null,
            ]}>
              <TextInput
                ref={passwordRef}
                placeholder="Mot de passe"
                placeholderTextColor={colors.placeholder}
                value={password}
                onChangeText={val => {
                  setPassword(val);
                  if (passwordTouched) setPasswordError(validatePassword(val));
                }}
                secureTextEntry={!showPassword}
                style={styles.inputInner}
                onFocus={() => setPasswordFocused(true)}
                onBlur={handlePasswordBlur}
                returnKeyType="done"
                onSubmitEditing={handleSignIn}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(v => !v)}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.placeholder}
                />
              </TouchableOpacity>
            </View>
            {passwordTouched && (
              <View style={[styles.validationBadge, {
                backgroundColor: passwordError ? '#fef2f2' : '#f0fdf4',
              }]}>
                <Ionicons
                  name={passwordError ? 'close-circle' : 'checkmark-circle'}
                  size={13}
                  color={passwordError ? '#ef4444' : '#16a34a'}
                  style={{ marginRight: 5 }}
                />
                <Text style={[styles.validationText, {
                  color: passwordError ? '#ef4444' : '#16a34a',
                }]}>
                  {passwordError || 'Mot de passe valide'}
                </Text>
              </View>
            )}

            {/* Mot de passe oublié */}
            <TouchableOpacity
              style={styles.forgotPasswordContainer}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>

            {/* Bouton connexion */}
            <TouchableOpacity
              style={styles.button}
              onPress={handleSignIn}
              disabled={isLoading}
            >
              {isLoading
                ? <ActivityIndicator color="white" />
                : <Text style={styles.buttonText}>Se connecter</Text>
              }
            </TouchableOpacity>

            {/* OAuth */}
            <Text style={styles.orText}>Se connecter avec</Text>
            <View style={styles.oauthRow}>
              {(['Google', 'GitHub', 'Microsoft'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.oauthButton, {
                    backgroundColor: p === 'Google' ? '#DB4437' : p === 'GitHub' ? '#333' : '#0078D4',
                  }]}
                  onPress={() => handleOAuthSignIn(p)}
                  disabled={isLoading}
                >
                  <FontAwesome
                    name={p === 'Google' ? 'google' : p === 'GitHub' ? 'github' : 'windows'}
                    size={20}
                    color="white"
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Box flottante droite */}
      <View style={styles.floatingBoxContainer}>
        <Animated.View style={[styles.floatingBoxWrapper, {
          transform: [{ translateX: containerTranslateX }],
          opacity: containerOpacity,
        }]}>
          <TouchableOpacity
            style={styles.floatingBox}
            onPress={handleArrowPress}
            activeOpacity={0.9}
          >
            <View style={styles.floatingBoxContent}>
              <View style={styles.arrowCircle}>
                <FontAwesome name="arrow-right" size={18} color="white" />
              </View>
              <Text style={styles.floatingBoxText}>Inscription</Text>
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
    backgroundColor: '#0078D4',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 20,
    paddingTop: 30,
  },
  logo: { width: 150, height: 150 },
  card: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },

  input: {
    paddingVertical: 17,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: colors.inputBackground,
    color: colors.text,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  inputFocused: { borderColor: colors.primary },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  inputWrapperFocused: { borderColor: colors.primary },
  inputInner: { flex: 1, paddingVertical: 17, color: colors.text, fontSize: 16 },
  eyeBtn: { padding: 4 },

  validationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 8,
  },
  validationText: { fontSize: 12, fontWeight: '600', flex: 1 },

  forgotPasswordContainer: { alignSelf: 'center', marginBottom: 15, marginTop: 4 },
  forgotPasswordText: { color: colors.primary, fontSize: 14, fontWeight: '500' },

  button: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  orText: {
    textAlign: 'center',
    color: colors.placeholder,
    marginVertical: 12,
    fontWeight: 'bold',
  },
  oauthRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
    width: '100%',
  },
  oauthButton: {
    width: 50, height: 50, borderRadius: 25,
    alignItems: 'center', justifyContent: 'center',
  },

  floatingBoxContainer: {
    position: 'absolute',
    bottom: 60,
    right: -20,
    left: 0,
    height: 80,
    zIndex: 9999,
    elevation: 9999,
  },
  floatingBoxWrapper: { flex: 1, justifyContent: 'flex-end', alignItems: 'flex-end' },
  floatingBox: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderTopLeftRadius: 30,
    borderBottomLeftRadius: 30,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 20,
    marginRight: 20,
  },
  floatingBoxContent: { flexDirection: 'row', alignItems: 'center' },
  floatingBoxText: { color: '#0078D4', fontWeight: 'bold', fontSize: 14 },
  arrowCircle: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#0078D4',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 10,
  },
});