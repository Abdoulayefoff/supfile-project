import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { authApi } from '../../api/auth';

// Écran de définition du nouveau mot de passe (ouvert depuis le Deep Link de l'email)
export default function ResetPasswordScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const token: string = route?.params?.token ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Envoi du nouveau mot de passe et du token au backend pour validation
  const handleSubmit = async () => {
    setLocalError(null);

    if (!token) {
      setLocalError('Token manquant ou invalide.');
      return;
    }
    if (password.length < 8) {
      setLocalError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== confirm) {
      setLocalError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setSuccess(true);
    } catch (e: any) {
      const message =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        'Une erreur est survenue. Le lien est peut-être expiré.';
      setLocalError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <View style={styles.logoRow}>
          <View style={[styles.logoIcon, { backgroundColor: colors.primary }]}>
            <Ionicons name="cloud" size={22} color="#fff" />
          </View>
          <Text style={[styles.logoText, { color: colors.primary }]}>SUPFile</Text>
        </View>

        {/* Carte */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>

          {!success ? (
            <>
              {/* Icône */}
              <View style={[styles.iconWrapper, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="lock-open-outline" size={26} color={colors.primary} />
              </View>

              <Text style={[styles.title, { color: colors.textPrimary }]}>
                Nouveau mot de passe
              </Text>
              <Text style={[styles.description, { color: colors.textSecondary }]}>
                Choisissez un mot de passe sécurisé d'au moins 8 caractères.
              </Text>

              {/* Champ mot de passe */}
              <View>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Nouveau mot de passe</Text>
                <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.surfaceSecondary }]}>
                  <Ionicons name="lock-closed-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.textPrimary }]}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textTertiary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoFocus
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.textTertiary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Champ confirmation */}
              <View>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Confirmer le mot de passe</Text>
                <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.surfaceSecondary }]}>
                  <Ionicons name="lock-open-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.textPrimary }]}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textTertiary}
                    value={confirm}
                    onChangeText={setConfirm}
                    secureTextEntry={!showPassword}
                  />
                </View>
              </View>

              {/* Erreur */}
              {localError && (
                <View style={[styles.errorBox, { backgroundColor: colors.dangerLight, borderColor: colors.danger }]}>
                  <Text style={[styles.errorText, { color: colors.danger }]}>{localError}</Text>
                </View>
              )}

              {/* Bouton */}
              <TouchableOpacity
                style={[styles.button, { backgroundColor: loading ? colors.textTertiary : colors.primary }]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.buttonText}>Confirmer le nouveau mot de passe</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.backButton}>
                <Text style={[styles.backText, { color: colors.textTertiary }]}>← Retour à la connexion</Text>
              </TouchableOpacity>
            </>
          ) : (
            /* ── Succès ── */
            <View style={styles.successContainer}>
              <View style={[styles.successIcon, { backgroundColor: colors.successLight }]}>
                <Ionicons name="checkmark-circle" size={40} color={colors.success} />
              </View>
              <Text style={[styles.title, { color: colors.textPrimary, textAlign: 'center' }]}>
                Mot de passe modifié !
              </Text>
              <Text style={[styles.description, { color: colors.textSecondary, textAlign: 'center' }]}>
                Votre mot de passe a été réinitialisé avec succès.{'\n'}Vous pouvez maintenant vous connecter.
              </Text>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.buttonText}>Se connecter</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, flexGrow: 1, justifyContent: 'center', gap: 24 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center' },
  logoIcon: {
    width: 40, height: 40, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center',
  },
  logoText: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 28,
    gap: 16,
  },
  iconWrapper: {
    width: 52, height: 52, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  title: { fontSize: 22, fontWeight: '800' },
  description: { fontSize: 14, lineHeight: 22 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 14, height: 52,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, height: '100%' },
  errorBox: {
    padding: 12, borderRadius: 10, borderWidth: 1,
  },
  errorText: { fontSize: 13, fontWeight: '500' },
  button: {
    height: 52, borderRadius: 9999,
    justifyContent: 'center', alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  backButton: { alignItems: 'center', paddingVertical: 4 },
  backText: { fontSize: 13 },
  successContainer: { alignItems: 'center', gap: 16 },
  successIcon: {
    width: 72, height: 72, borderRadius: 36,
    justifyContent: 'center', alignItems: 'center',
  },
});
