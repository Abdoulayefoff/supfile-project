import React, { useRef, useState, useEffect } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

// Interface pour formater la réponse JSON interceptée du backend
interface OAuthResult {
  success: boolean;
  token?: string;
  user?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
  error?: string;
}

// Propriétés nécessaires pour gérer l'ouverture du WebView
interface Props {
  visible: boolean;
  provider: 'google' | 'github' | 'microsoft';
  apiBaseUrl: string;
  onSuccess: (token: string, user: any) => void; // Callback appelé lors de la connexion réussie
  onError: (message: string) => void;
  onClose: () => void;
}

// JS injecté sur les endpoints check-json : lit le body et le transmet via postMessage.
const INJECT_CAPTURE_JS = `
(function() {
  try {
    var text = document.body && document.body.innerText ? document.body.innerText.trim() : '';
    if (text.startsWith('{')) {
      window.ReactNativeWebView.postMessage(text);
    }
  } catch(e) {}
})();
true;
`;

// User-agent Chrome Mobile standard — évite la détection WebView par Google (le "wv" Android)
const CHROME_UA =
  Platform.OS === 'android'
    ? 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'
    : 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0.0.0 Mobile/15E148 Safari/604.1';

// Composant Modal contenant le WebView pour l'authentification OAuth2 tierce
export default function OAuthWebViewModal({
  visible,
  provider,
  apiBaseUrl,
  onSuccess,
  onError,
  onClose,
}: Props) {
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Évite d'appeler onSuccess/onError plusieurs fois si plusieurs navigations déclenchent le handler
  const handledRef = useRef(false);

  const oauthStartUrl = `${apiBaseUrl}/auth/oauth/${provider}`;

  // Réinitialise l'état à chaque ouverture du modal
  useEffect(() => {
    if (visible) {
      handledRef.current = false;
      setIsLoading(true);
    }
  }, [visible]);

  // Token extrait de l'URL de callback web — on le transmet directement,
  // LoginScreen se charge de récupérer le profil via apiClient.
  const handleTokenFromUrl = (token: string) => {
    if (handledRef.current) return;
    handledRef.current = true;
    onSuccess(token, null);
  };

  // Gère les changements d'URL dans le WebView pour détecter les redirections de callback
  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    const url = navState.url || '';

    // 1. Endpoint check-json mobile → injecter JS pour capturer la réponse JSON
    if (url.includes('/auth/oauth/') && url.includes('/check-json')) {
      webViewRef.current?.injectJavaScript(INJECT_CAPTURE_JS);
      return;
    }

    // 2. Callback web frontend → le backend y redirige avec ?token=JWT après /check
    //    Ex: https://www.supfile-cloud.fr/auth/callback?token=eyJ...
    if (url.includes('/auth/callback')) {
      try {
        const parsed = new URL(url);
        const token = parsed.searchParams.get('token');
        const error = parsed.searchParams.get('error');
        if (token) {
          handleTokenFromUrl(token);
        } else if (error && !handledRef.current) {
          handledRef.current = true;
          onError(decodeURIComponent(error));
        }
      } catch {
        // URL malformée — on ignore
      }
      return;
    }
  };

  // Récupère le JSON capturé par `INJECT_CAPTURE_JS` (utilisé si l'endpoint check-json est déclenché)
  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    if (handledRef.current) return;
    try {
      const result: OAuthResult = JSON.parse(event.nativeEvent.data);
      if (result.success && result.token && result.user) {
        handledRef.current = true;
        onSuccess(result.token, result.user);
      } else {
        onError(result.error || 'Authentification échouée');
      }
    } catch {
      onError('Réponse inattendue du serveur');
    }
  };

  // En cas d'erreur réseau pendant le chargement de la page de login
  const handleError = () => {
    onError('Impossible de contacter le serveur. Vérifiez votre connexion.');
  };

  const providerLabel: Record<string, string> = {
    google: 'Google',
    github: 'GitHub',
    microsoft: 'Microsoft',
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={26} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Connexion avec {providerLabel[provider]}</Text>
          {isLoading
            ? <ActivityIndicator size="small" color="#1A56DB" />
            : <View style={{ width: 26 }} />
          }
        </View>

        <WebView
          ref={webViewRef}
          source={{ uri: oauthStartUrl }}
          style={{ flex: 1 }}
          userAgent={CHROME_UA}
          onNavigationStateChange={handleNavigationStateChange}
          onMessage={handleMessage}
          onError={handleError}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          originWhitelist={['https://*', 'http://*']}
          incognito
          javaScriptEnabled
          domStorageEnabled={false}
          thirdPartyCookiesEnabled={false}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  closeBtn: { padding: 4 },
  title: { fontSize: 16, fontWeight: '600', color: '#111827', flex: 1, textAlign: 'center', marginHorizontal: 8 },
});
