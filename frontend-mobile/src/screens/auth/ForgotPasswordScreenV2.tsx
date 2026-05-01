import { useState } from 'react';
import {
  StyleSheet, Text, TextInput, TouchableOpacity, View, Image,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Dimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { FontAwesome } from '@expo/vector-icons';
import React from 'react';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList> };

const { height } = Dimensions.get('window');
const BLUE = '#1A56DB';

export default function ForgotPasswordScreenV2({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = () => {
    if (!email) { Alert.alert('Erreur', 'Entre ton adresse email'); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); setSent(true); }, 1200);
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      {/* Panneau bleu */}
      <View style={styles.bluePanel}>
        <View style={styles.lockCircle}>
          <FontAwesome name="lock" size={32} color={BLUE} />
        </View>
        <Text style={styles.bluePanelTitle}>Mot de passe{'\n'}oublié ?</Text>
        <Text style={styles.bluePanelSub}>Récupérez l'accès à vos fichiers en quelques instants.</Text>
      </View>

      {/* Formulaire */}
      <View style={styles.formPanel}>

        {/* Contenu principal */}
        <View>
          {!sent ? (
            <>
              <Text style={styles.formTitle}>Réinitialisation</Text>
              <Text style={styles.formSub}>
                Entrez l'adresse e-mail associée à votre compte. Nous vous enverrons un lien pour réinitialiser votre mot de passe.
              </Text>

              <Text style={styles.label}>ADRESSE E-MAIL</Text>
              <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused]}>
                <FontAwesome name="envelope-o" size={14} color="#94a3b8" style={styles.inputIcon} />
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
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, loading && { opacity: 0.7 }]}
                onPress={handleReset}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <>
                      <Text style={styles.submitText}>Réinitialiser</Text>
                      <FontAwesome name="arrow-right" size={13} color="#fff" style={{ marginLeft: 8 }} />
                    </>
                }
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.successBox}>
              <View style={styles.successIcon}>
                <FontAwesome name="check" size={32} color={BLUE} />
              </View>
              <Text style={styles.successTitle}>Email envoyé !</Text>
              <Text style={styles.successSub}>
                Vérifiez votre boîte mail et suivez les instructions pour réinitialiser votre mot de passe.
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.backLink} onPress={() => navigation.navigate('Login')}>
            <FontAwesome name="arrow-left" size={12} color={BLUE} style={{ marginRight: 6 }} />
            <Text style={styles.backLinkText}>Retour à la connexion</Text>
          </TouchableOpacity>

          <View style={styles.dividerSimple} />

          <View style={styles.bottomLink}>
            <Text style={styles.bottomLinkText}>Pas de compte ? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.bottomLinkAction}>S'inscrire gratuitement</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer collé en bas */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>CONFIDENTIALITÉ</Text>
          <Text style={styles.footerDot}>·</Text>
          <Text style={styles.footerText}>CONDITIONS</Text>
          <Text style={styles.footerDot}>·</Text>
          <Text style={styles.footerText}>AIDE</Text>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BLUE },

  bluePanel: {
    height: height * 0.32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 10,
  },
  lockCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgb(255, 255, 255)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  bluePanelTitle: {
    fontSize: 24, fontWeight: '800', color: '#fff',
    textAlign: 'center', lineHeight: 30,
  },
  bluePanelSub: {
    fontSize: 13, color: 'rgba(255,255,255,0.75)',
    textAlign: 'center', lineHeight: 18,
  },

  formPanel: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },

  formTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 8 , },
  formSub: { fontSize: 13, color: '#64748b', lineHeight: 20, marginBottom: 24 },

  label: { fontSize: 10, fontWeight: '700', color: '#475569', letterSpacing: 1, marginBottom: 8 },

  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f8fafc', borderRadius: 12,
    borderWidth: 1.5, borderColor: '#e2e8f0',
    paddingHorizontal: 14, marginBottom: 30,
  },
  inputWrapperFocused: { borderColor: BLUE },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 14, color: '#0f172a' },

  submitButton: {
    backgroundColor: BLUE, borderRadius: 50,
    paddingVertical: 16, alignItems: 'center',
    justifyContent: 'center', flexDirection: 'row',
    marginBottom: 40,
    shadowColor: BLUE, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  successBox: { alignItems: 'center', paddingVertical: 20, marginBottom: 20 },
  successIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#eff6ff', alignItems: 'center',
    justifyContent: 'center', marginBottom: 16,
  },
  successTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 10 },
  successSub: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20 },

  backLink: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', marginBottom: 20,
  },
  backLinkText: { color: BLUE, fontWeight: '600', fontSize: 13 },

  dividerSimple: { height: 1, backgroundColor: '#e2e8f0', marginBottom: 20 },

  bottomLink: { flexDirection: 'row', justifyContent: 'center' },
  bottomLinkText: { fontSize: 13, color: '#64748b' },
  bottomLinkAction: { fontSize: 13, color: BLUE, fontWeight: '700' },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  footerText: { fontSize: 10, color: '#94a3b8', fontWeight: '700', letterSpacing: 0.8 },
  footerDot: { fontSize: 10, color: '#cbd5e1' },
});