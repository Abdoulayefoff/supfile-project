import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, Modal, TextInput, ActivityIndicator, Image } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useTheme } from '../../hooks/useTheme';
import { profileApi } from '../../api/profile';
import { Ionicons } from '@expo/vector-icons';
import { formatFileSize } from '../../utils/fileHelpers';
import { useFocusEffect } from '@react-navigation/native';
import { authApi } from '../../api/auth';
import { apiClient } from '../../api/client';
import * as ImagePicker from 'expo-image-picker';

// Écran de profil utilisateur (Informations, Paramètres, Thème)
export default function ProfileScreen() {
  const { colors, isDark } = useTheme();
  const { user, logout } = useAuthStore();
  const { toggleTheme } = useThemeStore();

  // États de visibilité des différentes modales de l'écran
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [legalModalVisible, setLegalModalVisible] = useState(false);
  const [legalTitle, setLegalTitle] = useState('');
  const [legalContent, setLegalContent] = useState('');
  const [legalLoading, setLegalLoading] = useState(false);

  // Recharge les informations de l'utilisateur depuis l'API et met à jour le store
  const refreshUser = async () => {
    try {
      const me = await authApi.getMe();
      useAuthStore.getState().updateUser(me.user);
    } catch (e) {
      console.log('Failed to refresh user', e);
    }
  };

  // Refresh user data every time this tab becomes active
  useFocusEffect(
    useCallback(() => {
      refreshUser();
    }, [])
  );

  // Keep form fields in sync when user data updates
  React.useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setEmail(user.email || '');
    }
  }, [user]);

  // Affiche une alerte de confirmation avant de déconnecter l'utilisateur
  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: () => logout() }
    ]);
  };

  // Extrait la première lettre du prénom pour l'affichage de l'avatar par défaut
  const getInitials = () => {
    const name = user?.firstName || user?.email || 'U';
    return name.charAt(0).toUpperCase();
  };

  // Déclenche la sélection et l'upload d'un nouvel avatar depuis la galerie
  const handleUpdateAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setLoading(true);
        const image = result.assets[0];
        
        const formData = new FormData();
        formData.append('avatar', {
          uri: image.uri,
          type: 'image/jpeg',
          name: 'avatar.jpg',
        } as any);

        await profileApi.uploadAvatar(formData);
        await refreshUser();
        Alert.alert('Succès', 'Avatar mis à jour');
      }
    } catch (e: any) {
      console.error(e);
      Alert.alert('Erreur', 'Impossible de mettre à jour l\'avatar');
    } finally {
      setLoading(false);
    }
  };

  // Met à jour les informations du profil via l'API
  const handleUpdateProfile = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Erreur', 'Le prénom et le nom sont requis');
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert('Erreur', 'Format d\'email invalide');
      return;
    }
    try {
      setLoading(true);
      const payload: any = { firstName: firstName.trim(), lastName: lastName.trim() };
      if (email.trim() && email.trim() !== user?.email) {
        payload.email = email.trim();
      }
      const result = await profileApi.updateProfile(payload);
      // L'API renvoie un nouveau token si l'email a changé
      if (result.token) {
        await authApi.saveToken(result.token);
      }
      await refreshUser();
      setEditProfileModalVisible(false);
      Alert.alert('Succès', 'Profil mis à jour avec succès');
    } catch (e: any) {
      Alert.alert('Erreur', e.response?.data?.error || 'Impossible de mettre à jour le profil');
    } finally {
      setLoading(false);
    }
  };

  // Gère la suppression définitive du compte après validation du mot clé
  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim().toLowerCase() !== 'supprimer') {
      Alert.alert('Erreur', 'Tapez "supprimer" pour confirmer');
      return;
    }
    try {
      setLoading(true);
      await profileApi.deleteAccount();
      setDeleteModalVisible(false);
      await logout();
    } catch (e: any) {
      Alert.alert('Erreur', e.response?.data?.error || 'Impossible de supprimer le compte');
    } finally {
      setLoading(false);
    }
  };

  // Labels affichés dans l'en-tête de la modal selon le slug demandé
  const LEGAL_TITLES: Record<string, string> = {
    privacy: 'Politique de confidentialité',
    terms: 'Conditions d\'utilisation',
    help: 'Aide & support',
  };

  // Ouvre la modal légale et charge le contenu depuis l'API
  const openLegal = async (slug: 'privacy' | 'terms' | 'help') => {
    setLegalTitle(LEGAL_TITLES[slug]);
    setLegalContent('');
    setLegalModalVisible(true);
    setLegalLoading(true);
    try {
      const response = await apiClient.get(`/legal/${slug}`);
      setLegalContent(response.data?.content ?? '');
    } catch {
      setLegalContent('Impossible de charger ce document.');
    } finally {
      setLegalLoading(false);
    }
  };

  // Met à jour le mot de passe de l'utilisateur via l'API
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Erreur', 'Le nouveau mot de passe doit comporter au moins 8 caractères');
      return;
    }
    try {
      setLoading(true);
      await profileApi.changePassword(currentPassword, newPassword);
      setPasswordModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      Alert.alert('Succès', 'Mot de passe modifié avec succès');
    } catch (e: any) {
      Alert.alert('Erreur', e.response?.data?.error || 'Mot de passe actuel incorrect');
    } finally {
      setLoading(false);
    }
  };

  // Calcul du pourcentage de quota utilisé pour la barre de progression
  const quotaUsed = Number(user?.quotaUsed || 0);
  const quotaLimit = Number(user?.quotaLimit || 0);
  const quotaPercent = quotaLimit > 0 ? Math.min((quotaUsed / quotaLimit) * 100, 100) : 0;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleUpdateAvatar} style={[styles.avatarContainer, { backgroundColor: colors.primary }]}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={{ width: 80, height: 80, borderRadius: 40 }} />
          ) : (
            <Text style={styles.avatarText}>{getInitials()}</Text>
          )}
          <View style={[styles.editAvatarBadge, { backgroundColor: colors.primary }]}>
            <Ionicons name="camera" size={14} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text style={[styles.name, { color: colors.textPrimary }]}>
          {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email || ''}
        </Text>
        <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email}</Text>
      </View>

      {/* Espace de stockage */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Espace de stockage</Text>
        <View style={[styles.menuContainer, { backgroundColor: colors.surface, borderColor: colors.border, padding: 16 }]}>
          <View style={styles.quotaRow}>
            <Text style={{ color: colors.textPrimary }}>Utilisé</Text>
            <Text style={{ color: colors.textPrimary, fontWeight: 'bold' }}>{formatFileSize(quotaUsed)}</Text>
          </View>
          <View style={[styles.progressBarBackground, { backgroundColor: colors.border, marginVertical: 10 }]}>
            <View style={[styles.progressBarFill, {
              width: `${quotaPercent}%` as any,
              backgroundColor: quotaPercent > 80 ? '#ef4444' : colors.primary
            }]} />
          </View>
          <View style={styles.quotaRow}>
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{quotaPercent.toFixed(1)}% utilisé</Text>
            <Text style={{ color: colors.textSecondary }}>{formatFileSize(quotaLimit)} total</Text>
          </View>
        </View>
      </View>

      {/* Paramètres */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Paramètres</Text>
        <View style={[styles.menuContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Thème sombre */}
          <View style={[styles.menuItem, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="moon-outline" size={22} color={colors.textPrimary} style={styles.menuIcon} />
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>Thème sombre</Text>
            </View>
            <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ true: colors.primary }} />
          </View>

          {/* Modifier profil */}
          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
            onPress={() => setEditProfileModalVisible(true)}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="person-outline" size={22} color={colors.textPrimary} style={styles.menuIcon} />
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>Modifier le profil</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>

          {/* Changer mdp */}
          <TouchableOpacity style={styles.menuItem} onPress={() => setPasswordModalVisible(true)}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="lock-closed-outline" size={22} color={colors.textPrimary} style={styles.menuIcon} />
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>Changer le mot de passe</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Légal & aide */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Informations légales</Text>
        <View style={[styles.menuContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
            onPress={() => openLegal('terms')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="document-text-outline" size={22} color={colors.textPrimary} style={styles.menuIcon} />
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>Conditions d'utilisation</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
            onPress={() => openLegal('privacy')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="shield-outline" size={22} color={colors.textPrimary} style={styles.menuIcon} />
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>Politique de confidentialité</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => openLegal('help')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="help-circle-outline" size={22} color={colors.textPrimary} style={styles.menuIcon} />
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>Aide & support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.copyright, { color: colors.textTertiary }]}>© 2025 SUPFile. Tous droits réservés.</Text>
      </View>

      {/* Déconnexion */}
      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={22} color={colors.danger} style={styles.menuIcon} />
        <Text style={[styles.logoutText, { color: colors.danger }]}>Se déconnecter</Text>
      </TouchableOpacity>

      {/* Suppression compte */}
      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: colors.surface, borderColor: '#ef444440', marginTop: 12 }]}
        onPress={() => { setDeleteConfirmText(''); setDeleteModalVisible(true); }}
      >
        <Ionicons name="trash-outline" size={22} color="#ef4444" style={styles.menuIcon} />
        <Text style={[styles.logoutText, { color: '#ef4444' }]}>Supprimer mon compte</Text>
      </TouchableOpacity>

      <View style={{ height: 48 }} />

      {/* Modal - Modifier profil */}
      <Modal visible={editProfileModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Modifier le profil</Text>
            <TextInput
              style={[styles.modalInput, { borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Prénom"
              placeholderTextColor={colors.textTertiary}
              value={firstName}
              onChangeText={setFirstName}
            />
            <TextInput
              style={[styles.modalInput, { borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Nom"
              placeholderTextColor={colors.textTertiary}
              value={lastName}
              onChangeText={setLastName}
            />
            <TextInput
              style={[styles.modalInput, { borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Adresse email"
              placeholderTextColor={colors.textTertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setEditProfileModalVisible(false)} style={styles.modalButton}>
                <Text style={{ color: colors.textSecondary }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleUpdateProfile} style={styles.modalButton} disabled={loading}>
                {loading ? <ActivityIndicator color={colors.primary} /> : <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Enregistrer</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal - Supprimer compte */}
      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: '#ef4444' }]}>Supprimer le compte</Text>
            <Text style={[{ color: colors.textSecondary, marginBottom: 16, fontSize: 14, lineHeight: 20 }]}>
              Cette action est irréversible. Toutes vos données seront supprimées définitivement.{'\n\n'}
              Tapez <Text style={{ fontWeight: 'bold', color: colors.textPrimary }}>supprimer</Text> pour confirmer.
            </Text>
            <TextInput
              style={[styles.modalInput, { borderColor: '#ef4444', color: colors.textPrimary }]}
              placeholder="supprimer"
              placeholderTextColor={colors.textTertiary}
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              autoCapitalize="none"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setDeleteModalVisible(false)} style={styles.modalButton}>
                <Text style={{ color: colors.textSecondary }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDeleteAccount} style={styles.modalButton} disabled={loading}>
                {loading ? <ActivityIndicator color="#ef4444" /> : <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>Supprimer</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal - Changer mdp */}
      <Modal visible={passwordModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Changer le mot de passe</Text>
            <TextInput
              style={[styles.modalInput, { borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Mot de passe actuel"
              placeholderTextColor={colors.textTertiary}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
            />
            <TextInput
              style={[styles.modalInput, { borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Nouveau mot de passe (min. 8 caractères)"
              placeholderTextColor={colors.textTertiary}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => { setPasswordModalVisible(false); setCurrentPassword(''); setNewPassword(''); }} style={styles.modalButton}>
                <Text style={{ color: colors.textSecondary }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleChangePassword} style={styles.modalButton} disabled={loading}>
                {loading ? <ActivityIndicator color={colors.primary} /> : <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Changer</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal - Informations légales */}
      <Modal visible={legalModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.legalModalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.legalModalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary, flex: 1, marginBottom: 0 }]} numberOfLines={2}>{legalTitle}</Text>
              <TouchableOpacity onPress={() => setLegalModalVisible(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {legalLoading ? (
              <View style={{ height: 120, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <ScrollView style={styles.legalScrollView} contentContainerStyle={styles.legalScrollContent}>
                <Text style={{ color: colors.textPrimary, fontSize: 14, lineHeight: 22 }}>{legalContent}</Text>
              </ScrollView>
            )}
            <TouchableOpacity
              onPress={() => setLegalModalVisible(false)}
              style={[styles.modalButton, { alignSelf: 'flex-end', marginTop: 8 }]}
            >
              <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', paddingVertical: 32, borderBottomWidth: 1 },
  avatarContainer: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  editAvatarBadge: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  name: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  email: { fontSize: 14 },
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  menuContainer: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
  menuIcon: { marginRight: 16 },
  menuText: { fontSize: 16 },
  quotaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressBarBackground: { height: 8, borderRadius: 4, width: '100%' },
  progressBarFill: { height: 8, borderRadius: 4 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, marginHorizontal: 16, marginTop: 32, borderRadius: 12, borderWidth: 1 },
  logoutText: { fontSize: 16, fontWeight: '600' },
  copyright: { fontSize: 12, textAlign: 'center', marginTop: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', padding: 24, borderRadius: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  modalInput: { borderWidth: 1, borderRadius: 10, padding: 14, fontSize: 16, marginBottom: 14 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginTop: 8 },
  modalButton: { padding: 10 },
  legalModalContent: { width: '92%', maxHeight: '80%', padding: 24, borderRadius: 16, flexShrink: 1 },
  legalModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  legalScrollView: { flexShrink: 1 },
  legalScrollContent: { paddingBottom: 8 },
});
