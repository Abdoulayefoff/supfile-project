import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
  Animated, Easing, Image, ActivityIndicator,
} from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import colors from '../../constants/colors';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export default function ForgotPasswordScreenV1({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const toggled = React.useRef(false);

  const validateEmail = (val: string): string => {
    if (!val.trim()) return 'Email requis';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Email invalide';
    return '';
  };

  const handleEmailBlur = () => {
    setEmailFocused(false);
    setEmailTouched(true);
    setEmailError(validateEmail(email));
  };

  const handleSendLink = () => {
    const err = validateEmail(email);
    setEmailError(err);
    setEmailTouched(true);
    if (err) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 1200);
  };

  const handleBackArrow = () => {
    const toValue = toggled.current ? 0 : 1;
    Animated.timing(slideAnim, {
      toValue, duration: 400,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      toggled.current = !toggled.current;
      navigation.goBack();
    });
  };

  const containerTranslateX = slideAnim.interpolate({
    inputRange: [0, 1], outputRange: [0, -150],
  });
  const containerOpacity = slideAnim.interpolate({
    inputRange: [0, 1], outputRange: [1, 0.6],
  });

  return (
    <View style={{ flex: 1 }}>
      {/* Background */}
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
            {!sent ? (
              <>
                <Text style={[styles.title, { marginBottom: 4 }]}>Mot de passe</Text>
                <Text style={styles.title}>oublié ?</Text>
                <Text style={styles.subtitle}>
                  Entre ton email, on t'envoie un lien sécurisé.
                </Text>

                {/* Email */}
                <TextInput
                  placeholder="Ton email"
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
                  returnKeyType="done"
                  onSubmitEditing={handleSendLink}
                />

                {/* Badge validation */}
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

                {/* Bouton envoyer */}
                <TouchableOpacity
                  style={[
                    styles.button,
                    (loading || !!emailError) && styles.buttonDisabled,
                  ]}
                  onPress={handleSendLink}
                  disabled={loading}
                >
                  {loading
                    ? <ActivityIndicator color="white" size="small" />
                    : <Text style={styles.buttonText}>Envoyer le lien</Text>
                  }
                </TouchableOpacity>
              </>
            ) : (
              /* Écran succès */
              <View style={styles.successContainer}>
                <View style={styles.successIconCircle}>
                  <Ionicons name="checkmark" size={40} color="#0078D4" />
                </View>

                <Text style={styles.successTitle}>Email envoyé !</Text>
                <Text style={styles.successSubtitle}>
                  Un lien de réinitialisation a été envoyé à{'\n'}
                  <Text style={styles.successEmail}>{email}</Text>
                </Text>
                <Text style={styles.successHint}>
                  Vérifie ta boîte mail et tes spams.
                </Text>

                <TouchableOpacity
                  style={styles.button}
                  onPress={() => navigation.navigate('Login')}
                >
                  <Text style={styles.buttonText}>Retour à la connexion</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.resendBtn}
                  onPress={() => {
                    setSent(false);
                    setEmail('');
                    setEmailTouched(false);
                    setEmailError('');
                  }}
                >
                  <Text style={styles.resendText}>Renvoyer un lien</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Box flottante gauche */}
      <View style={styles.floatingBoxContainer}>
        <Animated.View style={[styles.floatingBoxWrapper, {
          transform: [{ translateX: containerTranslateX }],
          opacity: containerOpacity,
        }]}>
          <TouchableOpacity
            style={styles.floatingBox}
            onPress={handleBackArrow}
            activeOpacity={0.9}
          >
            <View style={styles.floatingBoxContent}>
              <Text style={styles.floatingBoxText}>Retour</Text>
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
    marginTop: 30,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.placeholder,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
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

  validationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 20,
  },
  validationText: { fontSize: 12, fontWeight: '600', flex: 1 },

  button: {
    backgroundColor: colors.primary,
    padding: 17,
    borderRadius: 12,
    alignItems: 'center',
    marginTop:15,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  // Succès
  successContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 15,
    color: colors.placeholder,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  successEmail: {
    color: '#0078D4',
    fontWeight: '600',
  },
  successHint: {
    fontSize: 13,
    color: colors.placeholder,
    textAlign: 'center',
    marginBottom: 28,
  },
  resendBtn: {
    marginTop: 14,
    alignItems: 'center',
  },
  resendText: {
    color: '#0078D4',
    fontSize: 14,
    fontWeight: '600',
  },

  // Box flottante
  floatingBoxContainer: {
    position: 'absolute',
    bottom: 60,
    right: 0,
    left: -20,
    height: 80,
    zIndex: 9999,
    elevation: 9999,
  },
  floatingBoxWrapper: { flex: 1, justifyContent: 'flex-end', alignItems: 'flex-start' },
  floatingBox: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderTopRightRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 20,
    marginLeft: 20,
  },
  floatingBoxContent: { flexDirection: 'row', alignItems: 'center' },
  floatingBoxText: { color: '#0078D4', fontWeight: 'bold', fontSize: 14 },
  arrowCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#0078D4',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
});