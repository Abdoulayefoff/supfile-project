import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { authApi } from '../../api/auth';

// Propriétés du composant modal
interface ForgotPasswordModalProps {
  visible: boolean; // État de visibilité de la modal
  onClose: () => void; // Fonction pour fermer la modal
}

// Modal permettant à l'utilisateur de demander une réinitialisation de mot de passe via son email
export default function ForgotPasswordModal({ visible, onClose }: ForgotPasswordModalProps) {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Réinitialise l'état local avant de fermer la modal
  const handleClose = () => {
    setEmail('');
    setSubmitted(false);
    setLoading(false);
    onClose();
  };

  // Envoi de l'email au backend
  const handleSubmit = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSubmitted(true);
    } catch {
      // Toujours afficher le succès même si l'email n'existe pas (anti-énumération)
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>

                {/* Icône */}
                <View style={[styles.iconWrapper, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="lock-open-outline" size={26} color={colors.primary} />
                </View>

                {!submitted ? (
                  <>
                    <Text style={[styles.title, { color: colors.textPrimary }]}>
                      Mot de passe oublié ?
                    </Text>
                    <Text style={[styles.description, { color: colors.textSecondary }]}>
                      Entrez l'adresse email associée à votre compte. Vous recevrez un lien pour créer un nouveau mot de passe.
                    </Text>

                    <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.surfaceSecondary }]}>
                      <Ionicons name="mail-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, { color: colors.textPrimary }]}
                        placeholder="votre@email.com"
                        placeholderTextColor={colors.textTertiary}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoFocus
                      />
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.button,
                        { backgroundColor: email.trim() && !loading ? colors.primary : colors.textTertiary },
                      ]}
                      onPress={handleSubmit}
                      disabled={!email.trim() || loading}
                    >
                      {loading
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={styles.buttonText}>Envoyer le lien</Text>
                      }
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleClose} style={styles.cancelButton}>
                      <Text style={[styles.cancelText, { color: colors.textTertiary }]}>Annuler</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={[styles.title, { color: colors.textPrimary }]}>
                      Email envoyé ✓
                    </Text>
                    <Text style={[styles.description, { color: colors.textSecondary }]}>
                      Si <Text style={{ fontWeight: 'bold', color: colors.textPrimary }}>{email}</Text> est associé à un compte SUPFile, vous recevrez un email dans quelques instants. Pensez à vérifier vos spams.
                    </Text>

                    <TouchableOpacity
                      style={[styles.button, { backgroundColor: colors.primary }]}
                      onPress={handleClose}
                    >
                      <Text style={styles.buttonText}>Retour à la connexion</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 22,
    borderWidth: 1,
    padding: 28,
    gap: 16,
  },
  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  button: {
    height: 52,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  cancelText: {
    fontSize: 13,
  },
});
