import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';
import { authApi } from '../../api/auth';
import { Ionicons } from '@expo/vector-icons';
import OAuthWebViewModal from '../../components/OAuthWebViewModal';
import ForgotPasswordModal from './ForgotPasswordModal';

// URL de l'API (locale ou distante selon la variable d'environnement)
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.0.22:8000/api';

// Écran principal de connexion (Formulaire + Boutons OAuth)
export default function LoginScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { login, setOAuthSession } = useAuthStore();

  // État local pour le formulaire
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  // État pour gérer l'ouverture du WebView OAuth et le provider sélectionné
  const [oauthProvider, setOauthProvider] = useState<'google' | 'github' | 'microsoft' | null>(null);

  // Gère la soumission du formulaire classique (Email/Mot de passe)
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
    } catch (e: any) {
      Alert.alert('Erreur', e.response?.data?.error || e.response?.data?.message || 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  // Callback appelé quand l'authentification OAuth est un succès dans la WebView
  const handleOAuthSuccess = async (token: string, user: any) => {
    setOauthProvider(null); // Ferme la modal
    try {
      if (user) {
        await setOAuthSession(token, user);
      } else {
        await authApi.saveToken(token);
        const me = await authApi.getMe();
        await setOAuthSession(token, me.user);
      }
    } catch (e: any) {
      const detail = e?.response?.data?.error
        || e?.response?.data?.message
        || e?.message
        || 'Erreur inconnue';
      console.error('[OAuth] finalise error:', detail, e);
      Alert.alert('Erreur connexion', detail);
    }
  };

  // Callback appelé en cas d'erreur OAuth (ex: annulation ou erreur réseau)
  const handleOAuthError = (message: string) => {
    setOauthProvider(null);
    Alert.alert('Erreur OAuth', message);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.primary }]}>SUPFile</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Connectez-vous à votre espace</Text>
        </View>

        <View style={styles.form}>
          <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Ionicons name="mail-outline" size={20} color={colors.textTertiary} style={styles.icon} />
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder="Adresse email"
              placeholderTextColor={colors.textTertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.textTertiary} style={styles.icon} />
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder="Mot de passe"
              placeholderTextColor={colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.forgotPassword} onPress={() => setForgotPasswordOpen(true)}>
            <Text style={{ color: colors.primary }}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Se connecter</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.dividerContainer}>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.textSecondary }]}>Ou continuer avec</Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
        </View>

        <View style={styles.oauthContainer}>
          <TouchableOpacity
            style={[styles.oauthButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setOauthProvider('google')}
          >
            <Ionicons name="logo-google" size={24} color={colors.oauthGoogle} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.oauthButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setOauthProvider('microsoft')}
          >
            <Ionicons name="logo-windows" size={24} color={colors.oauthMicrosoft} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.oauthButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setOauthProvider('github')}
          >
            <Ionicons name="logo-github" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={{ color: colors.textSecondary }}>Pas encore de compte ? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={{ color: colors.primary, fontWeight: 'bold' }}>S'inscrire</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ForgotPasswordModal
        visible={forgotPasswordOpen}
        onClose={() => setForgotPasswordOpen(false)}
      />

      {/* Modal OAuth WebView — s'ouvre uniquement quand un provider est sélectionné */}
      {oauthProvider && (
        <OAuthWebViewModal
          visible={!!oauthProvider}
          provider={oauthProvider}
          apiBaseUrl={API_BASE}
          onSuccess={handleOAuthSuccess}
          onError={handleOAuthError}
          onClose={() => setOauthProvider(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  header: { marginBottom: 40, alignItems: 'center' },
  title: { fontSize: 36, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16 },
  form: { marginBottom: 30 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 16, height: 56, marginBottom: 16,
  },
  icon: { marginRight: 12 },
  input: { flex: 1, height: '100%', fontSize: 16 },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 24 },
  button: { height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  divider: { flex: 1, height: 1 },
  dividerText: { paddingHorizontal: 16, fontSize: 14 },
  oauthContainer: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 40 },
  oauthButton: { width: 60, height: 60, borderRadius: 30, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  footer: { flexDirection: 'row', justifyContent: 'center' },
});
