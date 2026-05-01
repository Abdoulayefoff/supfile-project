import { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, TextInput, TouchableOpacity, View, Image,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Dimensions, Keyboard,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useAuthStore } from '../../store/authStore';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import React from 'react';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList> };

const { height } = Dimensions.get('window');
const BLUE = '#1A56DB';
const BLUE_ERROR = '#ef4444';

export default function RegisterScreenV2({ navigation }: Props) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const { register, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const validateEmail = (val: string): string => {
    if (!val) return 'Email requis';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Email invalide';
    return '';
  };

  const validatePassword = (val: string): string => {
    if (!val) return 'Mot de passe requis';
    if (val.length < 8) return `${val.length}/8 caractères minimum`;
    if (!/[A-Z]/.test(val)) return 'Au moins une majuscule requise';
    if (!/[0-9]/.test(val)) return 'Au moins un chiffre requis';
    return '';
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
    if (score <= 1) return '#ef4444';
    if (score === 2) return '#f59e0b';
    if (score === 3) return '#3b82f6';
    return '#16a34a';
  };

  const getStrengthLabel = (score: number): string => {
    if (score <= 1) return 'Faible';
    if (score === 2) return 'Moyen';
    if (score === 3) return 'Bon';
    return 'Fort';
  };

  const handleRegister = async () => {
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailError(eErr);
    setPasswordError(pErr);
    setEmailTouched(true);
    setPasswordTouched(true);
    if (eErr || pErr) return;

    const parts = fullName.trim().split(' ');
    try {
      await register({
        email,
        password,
        firstName: parts[0] ?? '',
        lastName: parts.slice(1).join(' ') ?? '',
      });
      Alert.alert(
        '✅ Compte créé !',
        'Ton compte a été créé avec succès. Connecte-toi maintenant.',
        [{ text: 'Se connecter', onPress: () => navigation.navigate('Login') }]
      );
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 409) {
        setEmailError('Cette adresse email est déjà utilisée');
        setEmailTouched(true);
      } else if (status === 400) {
        setEmailError('Email ou mot de passe invalide');
        setEmailTouched(true);
      } else {
        Alert.alert('Erreur', 'Une erreur est survenue. Vérifie ta connexion et réessaie.');
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Panneau bleu */}
      <View style={[styles.bluePanel, keyboardHeight > 0 && { height: height * 0.13 }]}>
        {keyboardHeight === 0 ? (
          <>
            <Image source={require('../../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
            <Text style={styles.bluePanelTitle}>Créez votre compte</Text>
            <Text style={styles.bluePanelSub}>Rejoignez la nouvelle ère de la gestion de fichiers.</Text>
          </>
        ) : (
          <Text style={styles.bluePanelTitleSmall}>SUPFile — Créer un compte</Text>
        )}
      </View>

      {/* Formulaire */}
      <View style={styles.formPanel}>

        {/* Contenu principal */}
        <View>
          <TouchableOpacity
            style={styles.oauthButton}
            onPress={() => Alert.alert('Bientôt', 'Google en cours')}
            activeOpacity={0.85}
          >
            <FontAwesome name="google" size={16} color="#333" style={styles.oauthIcon} />
            <Text style={styles.oauthText}>S'inscrire avec Google</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou via e-mail</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Nom complet */}
          <Text style={styles.label}>NOM COMPLET</Text>
          <View style={[styles.inputWrapper, nameFocused && styles.inputWrapperFocused]}>
            <FontAwesome name="user-o" size={14} color="#94a3b8" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Jean Dupont"
              placeholderTextColor="#94a3b8"
              value={fullName}
              onChangeText={setFullName}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              blurOnSubmit={false}
            />
          </View>

          {/* Email */}
          <Text style={styles.label}>E-MAIL</Text>
          <View style={[styles.inputWrapper, {
            borderColor: emailTouched && emailError ? BLUE_ERROR : emailFocused ? BLUE : '#e2e8f0',
          }]}>
            <FontAwesome name="envelope-o" size={14} color="#94a3b8" style={styles.inputIcon} />
            <TextInput
              ref={emailRef}
              style={styles.input}
              placeholder="nom@exemple.com"
              placeholderTextColor="#94a3b8"
              value={email}
              onChangeText={val => { setEmail(val); if (emailTouched) setEmailError(validateEmail(val)); }}
              keyboardType="email-address"
              autoCapitalize="none"
              onFocus={() => setEmailFocused(true)}
              onBlur={() => { setEmailFocused(false); setEmailTouched(true); setEmailError(validateEmail(email)); }}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
            />
          </View>
          {emailTouched && (
            <View style={[styles.validationBadge, { backgroundColor: emailError ? '#fef2f2' : '#f0fdf4' }]}>
              <Ionicons
                name={emailError ? 'close-circle' : 'checkmark-circle'}
                size={14}
                color={emailError ? '#ef4444' : '#16a34a'}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.validationText, { color: emailError ? '#ef4444' : '#16a34a' }]}>
                {emailError || 'Email valide'}
              </Text>
            </View>
          )}

          {/* Mot de passe */}
          <Text style={styles.label}>MOT DE PASSE</Text>
          <View style={[styles.inputWrapper, {
            borderColor: passwordTouched && passwordError ? BLUE_ERROR : passwordFocused ? BLUE : '#e2e8f0',
          }]}>
            <FontAwesome name="lock" size={15} color="#94a3b8" style={styles.inputIcon} />
            <TextInput
              ref={passwordRef}
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
              value={password}
              onChangeText={val => { setPassword(val); if (passwordTouched) setPasswordError(validatePassword(val)); }}
              secureTextEntry={!showPassword}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => { setPasswordFocused(false); setPasswordTouched(true); setPasswordError(validatePassword(password)); }}
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />
            <TouchableOpacity onPress={() => setShowPassword(v => !v)}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Force mot de passe */}
          {password.length > 0 && (
            <View style={styles.strengthRow}>
              {[...Array(4)].map((_, i) => (
                <View key={i} style={[styles.strengthBar, {
                  backgroundColor: i < getPasswordStrength(password)
                    ? getStrengthColor(getPasswordStrength(password))
                    : '#e2e8f0',
                }]} />
              ))}
              <Text style={[styles.strengthLabel, { color: getStrengthColor(getPasswordStrength(password)) }]}>
                {getStrengthLabel(getPasswordStrength(password))}
              </Text>
            </View>
          )}
          {passwordTouched && (
            <View style={[styles.validationBadge, { backgroundColor: passwordError ? '#fef2f2' : '#f0fdf4' }]}>
              <Ionicons
                name={passwordError ? 'close-circle' : 'checkmark-circle'}
                size={14}
                color={passwordError ? '#ef4444' : '#16a34a'}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.validationText, { color: passwordError ? '#ef4444' : '#16a34a' }]}>
                {passwordError || 'Mot de passe valide'}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitButton, isLoading && { opacity: 0.7 }]}
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitText}>S'inscrire</Text>
            }
          </TouchableOpacity>

          <View style={styles.bottomLink}>
            <Text style={styles.bottomLinkText}>Déjà un compte ? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.bottomLinkAction}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer collé en bas */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 SUPFILE</Text>
          <Text style={styles.footerDot}>·</Text>
          <Text style={styles.footerText}>AIDE</Text>
          <Text style={styles.footerDot}>·</Text>
          <Text style={styles.footerText}>SÉCURITÉ</Text>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BLUE },

  bluePanel: {
    height: height * 0.28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: BLUE,
  },
  logo: {
    width: 90, height: 90, marginBottom: 10,
    backgroundColor: '#fff', borderRadius: 22, padding: 8,
  },
  bluePanelTitle: {
    fontSize: 22, fontWeight: '800', color: '#fff',
    textAlign: 'center', marginBottom: 4,
  },
  bluePanelTitleSmall: {
    fontSize: 16, fontWeight: '700', color: '#fff', textAlign: 'center',
  },
  bluePanelSub: {
    fontSize: 12, color: 'rgba(255,255,255,0.75)', textAlign: 'center',
  },

  formPanel: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },

  oauthButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 50,
    paddingVertical: 12, marginBottom: 14, backgroundColor: '#fff',
  },
  oauthIcon: { marginRight: 10 },
  oauthText: { fontSize: 14, fontWeight: '600', color: '#0f172a' },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
  dividerText: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },

label: { 
  fontSize: 10, 
  fontWeight: '700', 
  color: '#475569', 
  letterSpacing: 1, 
  marginBottom: 6,
  marginTop: 8,  // ← ajouté
},

inputWrapper: {
  flexDirection: 'row', alignItems: 'center',
  backgroundColor: '#f8fafc', borderRadius: 12,
  borderWidth: 1.5, borderColor: '#e2e8f0',
  paddingHorizontal: 14, marginBottom: 15,
},
  inputWrapperFocused: { borderColor: BLUE },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 12, fontSize: 14, color: '#0f172a' },

  validationBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 8, marginBottom: 8,
  },
  validationText: { fontSize: 12, fontWeight: '600', flex: 1 },

  strengthRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 4, marginBottom: 4,
  },
  strengthBar: { flex: 1, height: 3, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: '700', marginLeft: 4 },

  submitButton: {
    backgroundColor: BLUE, borderRadius: 50,
    paddingVertical: 14, alignItems: 'center',
    justifyContent: 'center', flexDirection: 'row',
    marginTop: 18, marginBottom: 14,
    shadowColor: BLUE, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  bottomLink: { flexDirection: 'row', justifyContent: 'center' },
  bottomLinkText: { fontSize: 13, color: '#64748b' },
  bottomLinkAction: { fontSize: 13, color: BLUE, fontWeight: '700' },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  footerText: { fontSize: 10, color: '#94a3b8', fontWeight: '700', letterSpacing: 0.8 },
  footerDot: { fontSize: 10, color: '#cbd5e1' },
});