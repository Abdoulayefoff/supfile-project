import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';

// Écran d'inscription utilisateur
export default function RegisterScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { register, login } = useAuthStore();

  // Champs du formulaire d'inscription
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [consent, setConsent] = useState(false); // Case à cocher des CGU
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Validation et envoi des données d'inscription
  const handleRegister = async () => {
    if (!email || !password || !firstName || !lastName || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Erreur', 'Le mot de passe doit comporter au moins 8 caractères');
      return;
    }
    if (!consent) {
      Alert.alert('Erreur', "Vous devez accepter les conditions d'utilisation");
      return;
    }

    setLoading(true);
    try {
      await register({ firstName, lastName, email, password, consent });
      // Connexion automatique après inscription
      await login(email, password);
    } catch (e: any) {
      Alert.alert('Erreur', e.response?.data?.error || e.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.primary }]}>Rejoignez-nous</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Créez votre compte SUPFile</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfInput, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder="Prénom"
                placeholderTextColor={colors.textTertiary}
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>
            <View style={[styles.inputContainer, styles.halfInput, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder="Nom"
                placeholderTextColor={colors.textTertiary}
                value={lastName}
                onChangeText={setLastName}
              />
            </View>
          </View>

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
              placeholder="Mot de passe (min. 8 caractères)"
              placeholderTextColor={colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>

          <View style={[styles.inputContainer, { borderColor: confirmPassword && confirmPassword !== password ? '#ef4444' : colors.border, backgroundColor: colors.surface }]}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.textTertiary} style={styles.icon} />
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder="Confirmer le mot de passe"
              placeholderTextColor={colors.textTertiary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirm}
            />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
              <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>
          {confirmPassword.length > 0 && confirmPassword !== password && (
            <Text style={styles.errorText}>Les mots de passe ne correspondent pas</Text>
          )}

          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setConsent(!consent)}
          >
            <View style={[styles.checkbox, { borderColor: colors.primary, backgroundColor: consent ? colors.primary : 'transparent' }]}>
              {consent && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <Text style={[styles.checkboxLabel, { color: colors.textSecondary }]}>
              J'accepte les{' '}
              <Text style={{ color: colors.primary }}>conditions d'utilisation</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>S'inscrire</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={{ color: colors.textSecondary }}>Déjà un compte ? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, justifyContent: 'center', flexGrow: 1 },
  header: { marginBottom: 32, alignItems: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16 },
  form: { marginBottom: 24 },
  row: { flexDirection: 'row', gap: 16 },
  halfInput: { flex: 1, paddingHorizontal: 16 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 16, height: 56, marginBottom: 16,
  },
  icon: { marginRight: 12 },
  input: { flex: 1, height: '100%', fontSize: 16 },
  errorText: { color: '#ef4444', fontSize: 13, marginTop: -12, marginBottom: 12, marginLeft: 4 },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  checkboxLabel: { flex: 1, fontSize: 14 },
  button: { height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'center' },
});
