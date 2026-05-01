import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "../../hooks/useTheme";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/themeStore";
import { profileApi } from "../../api/profile";
import { mockStats } from "../../utils/mockDashboard";
import { API_URL } from "../../api/client";
import { getMemoryToken } from "../../api/client";
import { useSyncStore } from "../../store/syncStore";

export default function ProfileScreen() {
  const { colors, isDark } = useTheme();
  const { user, logout } = useAuthStore();
  const { toggleTheme } = useThemeStore();

  // ── Modals ──
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editField, setEditField] = useState<
    "firstName" | "lastName" | "email" | null
  >(null);
  const [editValue, setEditValue] = useState("");
  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // ── Password ──
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const { triggerRefresh } = useSyncStore();

  // ── Avatar ──
  const [avatarLoading, setAvatarLoading] = useState(false);

  const formatQuota = (bytes: number) =>
    (bytes / 1073741824).toFixed(1) + " Go";
  const quotaPercent = Math.min(mockStats.quotaPercentage, 100);

  const initials =
    `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "?";
  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    "Utilisateur";

  const baseUrl = API_URL.replace("/api", "");

  const avatarUrl = user?.avatar
    ? `${API_URL}/files/avatar/${user.avatar.split("/").pop()?.split("?")[0]}?token=${getMemoryToken()}`
    : null;

  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);

useEffect(() => {
  if (user?.avatar) {
    const token = getMemoryToken();
    const url = user.avatar.startsWith('http')
      ? user.avatar.split('?')[0]
      : `${baseUrl}/uploads/avatars/${user.avatar.split('/').pop()?.split('?')[0]}`;
    
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => {
        if (!r.ok) return null;
        return r.blob();
      })
      .then(blob => {
        if (!blob) return;
        const reader = new FileReader();
        reader.onload = () => setAvatarBase64(reader.result as string);
        reader.readAsDataURL(blob);
      })
      .catch(() => setAvatarBase64(null));
  } else {
    setAvatarBase64(null);
  }
}, [user?.avatar]);

  // ── Modifier un champ ──
  const openEditModal = (field: "firstName" | "lastName" | "email") => {
    setEditField(field);
    setEditValue(
      field === "firstName"
        ? (user?.firstName ?? "")
        : field === "lastName"
          ? (user?.lastName ?? "")
          : (user?.email ?? ""),
    );
    setEditError("");
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editValue.trim()) {
      setEditError("Ce champ ne peut pas être vide");
      return;
    }
    if (
      editField === "email" &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editValue)
    ) {
      setEditError("Email invalide");
      return;
    }
    setEditLoading(true);
    try {
      const updated = await profileApi.updateProfile({
        [editField!]: editValue.trim(),
      });
      useAuthStore.setState({ user: updated });
      setShowEditModal(false);
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 409) setEditError("Cet email est déjà utilisé");
      else if (status === 400) setEditError("Valeur invalide");
      else setEditError("Une erreur est survenue");
    } finally {
      setEditLoading(false);
    }
  };

  // ── Changer le mot de passe ──
  const handleChangePassword = async () => {
    setPasswordError("");
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Remplis tous les champs");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError(
        "Le nouveau mot de passe doit contenir au moins 8 caractères",
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas");
      return;
    }
    setPasswordLoading(true);
    try {
      await profileApi.changePassword(currentPassword, newPassword);
      setShowPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      Alert.alert("✅ Succès", "Mot de passe modifié avec succès");
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 401) setPasswordError("Mot de passe actuel incorrect");
      else setPasswordError("Une erreur est survenue");
    } finally {
      setPasswordLoading(false);
    }
  };

  // ── Upload avatar ──
  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission refusée", "L'accès à la galerie est nécessaire");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    setAvatarLoading(true);
    try {
      const data = await profileApi.uploadAvatar(
        asset.uri,
        asset.mimeType ?? "image/jpeg",
      );
      console.log("Avatar reçu:", data.avatar);

      const timestamp = Date.now();
      const newAvatarUrl = data.avatar.startsWith("http")
        ? `${data.avatar}?t=${timestamp}`
        : `${baseUrl}/uploads/avatars/${data.avatar.split("/").pop()}?t=${timestamp}`;

      console.log("Avatar URL construite:", newAvatarUrl);
      useAuthStore.setState({ user: { ...user!, avatar: newAvatarUrl } });
      triggerRefresh();
      Alert.alert("✅ Succès", "Photo de profil mise à jour");
    } catch (err: any) {
      console.log("Avatar error:", err.message);
      Alert.alert("Erreur", "Impossible d'uploader la photo");
    } finally {
      setAvatarLoading(false);
    }
  };

  // ── Toggle thème (sync avec backend) ──
  const handleToggleTheme = async () => {
    toggleTheme();
    try {
      await profileApi.updateProfile({ theme: isDark ? "light" : "dark" });
    } catch {
      // Pas critique si ça échoue
    }
  };

  // ── Déconnexion ──
  const handleLogout = () => {
    Alert.alert("Déconnexion", "Tu vas être déconnecté de ton compte.", [
      { text: "Annuler", style: "cancel" },
      { text: "Déconnexion", style: "destructive", onPress: () => logout() },
    ]);
  };

  const fieldLabel = (field: typeof editField) => {
    if (field === "firstName") return "Prénom";
    if (field === "lastName") return "Nom";
    return "Email";
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.header,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.text }]}>Profil</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ── Avatar + Infos ── */}
        <View style={[styles.profileCard, { backgroundColor: colors.primary }]}>
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={handlePickAvatar}
            disabled={avatarLoading}
            activeOpacity={0.8}
          >
            {avatarLoading ? (
              <View style={styles.avatarCircle}>
                <ActivityIndicator color="#fff" />
              </View>
            ) : avatarBase64 ? (
              <Image
                source={{ uri: avatarBase64 }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              <Ionicons name="camera" size={12} color="#fff" />
            </View>
          </TouchableOpacity>

          <Text style={styles.profileName}>{fullName}</Text>
          <Text style={styles.profileEmail}>{user?.email ?? ""}</Text>

          {/* Quota mini */}
          <View style={styles.quotaMini}>
            <View style={styles.quotaMiniHeader}>
              <Text style={styles.quotaMiniLabel}>Stockage</Text>
              <Text style={styles.quotaMiniValue}>
                {formatQuota(mockStats.quotaUsed)} /{" "}
                {formatQuota(mockStats.quotaLimit)}
              </Text>
            </View>
            <View style={styles.quotaBarBg}>
              <View
                style={[
                  styles.quotaBarFill,
                  {
                    width: `${quotaPercent}%`,
                    backgroundColor: quotaPercent > 80 ? "#ef4444" : "#fff",
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* ── Compte ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            COMPTE
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {[
              {
                field: "firstName" as const,
                label: "Prénom",
                value: user?.firstName ?? "—",
                icon: "person-outline",
              },
              {
                field: "lastName" as const,
                label: "Nom",
                value: user?.lastName ?? "—",
                icon: "person-outline",
              },
              {
                field: "email" as const,
                label: "Email",
                value: user?.email ?? "—",
                icon: "mail-outline",
              },
            ].map((item, index, arr) => (
              <TouchableOpacity
                key={item.field}
                style={[
                  styles.row,
                  {
                    borderBottomColor: colors.border,
                    borderBottomWidth: index < arr.length - 1 ? 1 : 0,
                  },
                ]}
                onPress={() => openEditModal(item.field)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.rowIcon,
                    { backgroundColor: colors.primaryLight },
                  ]}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={18}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.rowContent}>
                  <Text
                    style={[styles.rowLabel, { color: colors.textSecondary }]}
                  >
                    {item.label}
                  </Text>
                  <Text style={[styles.rowValue, { color: colors.text }]}>
                    {item.value}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Sécurité ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            SÉCURITÉ
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <TouchableOpacity
              style={[styles.row, { borderBottomColor: colors.border }]}
              onPress={() => {
                setPasswordError("");
                setShowPasswordModal(true);
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.rowIcon, { backgroundColor: "#fef2f2" }]}>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color="#ef4444"
                />
              </View>
              <View style={styles.rowContent}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>
                  Changer le mot de passe
                </Text>
                <Text style={[styles.rowLabel, { color: colors.textTertiary }]}>
                  Modifier ton mot de passe
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={14}
                color={colors.textTertiary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.row, { borderBottomColor: colors.border }]}
              onPress={() =>
                Alert.alert("Double authentification", "Bientôt disponible")
              }
              activeOpacity={0.7}
            >
              <View style={[styles.rowIcon, { backgroundColor: "#fef2f2" }]}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={18}
                  color="#ef4444"
                />
              </View>
              <View style={styles.rowContent}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>
                  Double authentification
                </Text>
                <Text style={[styles.rowLabel, { color: colors.textTertiary }]}>
                  Renforcer la sécurité
                </Text>
              </View>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: colors.surfaceSecondary },
                ]}
              >
                <Text
                  style={[styles.badgeText, { color: colors.textTertiary }]}
                >
                  Bientôt
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.row, { borderBottomWidth: 0 }]}
              onPress={() =>
                Alert.alert("Sessions actives", "Bientôt disponible")
              }
              activeOpacity={0.7}
            >
              <View style={[styles.rowIcon, { backgroundColor: "#fef2f2" }]}>
                <Ionicons
                  name="phone-portrait-outline"
                  size={18}
                  color="#ef4444"
                />
              </View>
              <View style={styles.rowContent}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>
                  Sessions actives
                </Text>
                <Text style={[styles.rowLabel, { color: colors.textTertiary }]}>
                  Gérer tes appareils
                </Text>
              </View>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: colors.surfaceSecondary },
                ]}
              >
                <Text
                  style={[styles.badgeText, { color: colors.textTertiary }]}
                >
                  Bientôt
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Paramètres ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            PARAMÈTRES
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={[styles.row, { borderBottomColor: colors.border }]}>
              <View
                style={[
                  styles.rowIcon,
                  { backgroundColor: isDark ? "#374151" : "#fef3c7" },
                ]}
              >
                <Ionicons
                  name={isDark ? "moon" : "sunny-outline"}
                  size={18}
                  color={isDark ? "#a78bfa" : "#f59e0b"}
                />
              </View>
              <View style={styles.rowContent}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>
                  {isDark ? "Mode sombre" : "Mode clair"}
                </Text>
                <Text style={[styles.rowLabel, { color: colors.textTertiary }]}>
                  Apparence de l'application
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={handleToggleTheme}
                trackColor={{ false: "#e2e8f0", true: colors.primary }}
                thumbColor="#fff"
              />
            </View>

            <TouchableOpacity
              style={[styles.row, { borderBottomColor: colors.border }]}
              onPress={() => Alert.alert("Notifications", "Bientôt disponible")}
              activeOpacity={0.7}
            >
              <View style={[styles.rowIcon, { backgroundColor: "#fef3c7" }]}>
                <Ionicons
                  name="notifications-outline"
                  size={18}
                  color="#f59e0b"
                />
              </View>
              <View style={styles.rowContent}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>
                  Notifications
                </Text>
                <Text style={[styles.rowLabel, { color: colors.textTertiary }]}>
                  Gérer les notifications
                </Text>
              </View>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: colors.surfaceSecondary },
                ]}
              >
                <Text
                  style={[styles.badgeText, { color: colors.textTertiary }]}
                >
                  Bientôt
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.row, { borderBottomWidth: 0 }]}
              onPress={() => Alert.alert("Langue", "Bientôt disponible")}
              activeOpacity={0.7}
            >
              <View style={[styles.rowIcon, { backgroundColor: "#dcfce7" }]}>
                <Ionicons name="language-outline" size={18} color="#16a34a" />
              </View>
              <View style={styles.rowContent}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>
                  Langue
                </Text>
                <Text style={[styles.rowLabel, { color: colors.textTertiary }]}>
                  Français
                </Text>
              </View>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: colors.surfaceSecondary },
                ]}
              >
                <Text
                  style={[styles.badgeText, { color: colors.textTertiary }]}
                >
                  Bientôt
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Aide ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            AIDE
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <TouchableOpacity
              style={[styles.row, { borderBottomColor: colors.border }]}
              onPress={() =>
                Alert.alert(
                  "Centre d'aide",
                  "Consulte la documentation sur supfile.app/help",
                )
              }
              activeOpacity={0.7}
            >
              <View style={[styles.rowIcon, { backgroundColor: "#eff6ff" }]}>
                <Ionicons
                  name="help-circle-outline"
                  size={18}
                  color={colors.primary}
                />
              </View>
              <View style={styles.rowContent}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>
                  Centre d'aide
                </Text>
                <Text style={[styles.rowLabel, { color: colors.textTertiary }]}>
                  FAQ et documentation
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={14}
                color={colors.textTertiary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.row, { borderBottomColor: colors.border }]}
              onPress={() =>
                Alert.alert(
                  "Signaler un bug",
                  "Envoie un email à support@supfile.app avec la description du problème.",
                  [{ text: "OK" }],
                )
              }
              activeOpacity={0.7}
            >
              <View style={[styles.rowIcon, { backgroundColor: "#eff6ff" }]}>
                <Ionicons name="bug-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.rowContent}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>
                  Signaler un bug
                </Text>
                <Text style={[styles.rowLabel, { color: colors.textTertiary }]}>
                  support@supfile.app
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={14}
                color={colors.textTertiary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.row, { borderBottomWidth: 0 }]}
              onPress={() =>
                Alert.alert(
                  "À propos",
                  "SUPFile v1.0.0\n© 2026 SUPINFO\nProjet 4PROJ",
                )
              }
              activeOpacity={0.7}
            >
              <View style={[styles.rowIcon, { backgroundColor: "#eff6ff" }]}>
                <Ionicons
                  name="information-circle-outline"
                  size={18}
                  color={colors.primary}
                />
              </View>
              <View style={styles.rowContent}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>
                  À propos
                </Text>
                <Text style={[styles.rowLabel, { color: colors.textTertiary }]}>
                  Version 1.0.0
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={14}
                color={colors.textTertiary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Déconnexion ── */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.logoutBtn, { backgroundColor: colors.dangerLight }]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.danger} />
            <Text style={[styles.logoutText, { color: colors.danger }]}>
              Se déconnecter
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.version, { color: colors.textTertiary }]}>
          SUPFile v1.0.0 · © 2026 SUPINFO
        </Text>
      </ScrollView>

      {/* ── Modal édition champ ── */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Modifier {fieldLabel(editField)}
              </Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={22} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              {fieldLabel(editField)?.toUpperCase()}
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.surfaceSecondary,
                  borderColor: editError ? "#ef4444" : colors.border,
                },
              ]}
            >
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={editValue}
                onChangeText={(val) => {
                  setEditValue(val);
                  setEditError("");
                }}
                autoFocus
                autoCapitalize={editField === "email" ? "none" : "words"}
                keyboardType={
                  editField === "email" ? "email-address" : "default"
                }
                returnKeyType="done"
                onSubmitEditing={handleSaveEdit}
              />
            </View>

            {editError ? (
              <View style={styles.errorBadge}>
                <Ionicons
                  name="close-circle"
                  size={13}
                  color="#ef4444"
                  style={{ marginRight: 5 }}
                />
                <Text style={styles.errorText}>{editError}</Text>
              </View>
            ) : null}

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                onPress={() => setShowEditModal(false)}
              >
                <Text
                  style={[
                    styles.modalCancelText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Annuler
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  { backgroundColor: colors.primary },
                  editLoading && { opacity: 0.7 },
                ]}
                onPress={handleSaveEdit}
                disabled={editLoading}
              >
                {editLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalConfirmText}>Enregistrer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal mot de passe ── */}
      <Modal visible={showPasswordModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Changer le mot de passe
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowPasswordModal(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setPasswordError("");
                }}
              >
                <Ionicons name="close" size={22} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>

            {[
              {
                label: "MOT DE PASSE ACTUEL",
                value: currentPassword,
                setter: setCurrentPassword,
                show: showCurrent,
                setShow: setShowCurrent,
              },
              {
                label: "NOUVEAU MOT DE PASSE",
                value: newPassword,
                setter: setNewPassword,
                show: showNew,
                setShow: setShowNew,
              },
              {
                label: "CONFIRMER",
                value: confirmPassword,
                setter: setConfirmPassword,
                show: showConfirm,
                setShow: setShowConfirm,
              },
            ].map((item, index) => (
              <View key={index}>
                <Text
                  style={[styles.inputLabel, { color: colors.textSecondary }]}
                >
                  {item.label}
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: colors.surfaceSecondary,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textTertiary}
                    value={item.value}
                    onChangeText={(val) => {
                      item.setter(val);
                      setPasswordError("");
                    }}
                    secureTextEntry={!item.show}
                  />
                  <TouchableOpacity
                    onPress={() => item.setShow((v: boolean) => !v)}
                  >
                    <Ionicons
                      name={item.show ? "eye-off-outline" : "eye-outline"}
                      size={18}
                      color={colors.textTertiary}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {passwordError ? (
              <View style={styles.errorBadge}>
                <Ionicons
                  name="close-circle"
                  size={13}
                  color="#ef4444"
                  style={{ marginRight: 5 }}
                />
                <Text style={styles.errorText}>{passwordError}</Text>
              </View>
            ) : null}

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                onPress={() => {
                  setShowPasswordModal(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setPasswordError("");
                }}
              >
                <Text
                  style={[
                    styles.modalCancelText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Annuler
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  { backgroundColor: colors.primary },
                  passwordLoading && { opacity: 0.7 },
                ]}
                onPress={handleChangePassword}
                disabled={passwordLoading}
              >
                {passwordLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalConfirmText}>Modifier</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 26, fontWeight: "800" },

  profileCard: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  avatarWrapper: { position: "relative", marginBottom: 12 },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.5)",
  },
  avatarText: { fontSize: 30, fontWeight: "800", color: "#fff" },
  avatarEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  profileName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    marginBottom: 16,
  },

  quotaMini: { width: "100%" },
  quotaMiniHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  quotaMiniLabel: { fontSize: 12, color: "rgba(255,255,255,0.75)" },
  quotaMiniValue: { fontSize: 12, color: "#fff", fontWeight: "600" },
  quotaBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.25)",
    overflow: "hidden",
  },
  quotaBarFill: { height: "100%", borderRadius: 3 },

  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 10,
  },
  card: { borderRadius: 16, borderWidth: 1.5, overflow: "hidden" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 11, marginBottom: 2 },
  rowValue: { fontSize: 14, fontWeight: "600" },
  rowTitle: { fontSize: 14, fontWeight: "600", marginBottom: 2 },

  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: { fontSize: 10, fontWeight: "600" },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 16,
    borderRadius: 16,
  },
  logoutText: { fontSize: 15, fontWeight: "700" },
  version: {
    textAlign: "center",
    fontSize: 11,
    marginTop: 16,
    marginBottom: 8,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "700" },

  inputLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  input: { flex: 1, paddingVertical: 13, fontSize: 14 },

  errorBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: { fontSize: 12, fontWeight: "600", color: "#ef4444", flex: 1 },

  modalBtns: { flexDirection: "row", gap: 12, marginTop: 4 },
  modalCancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
  },
  modalCancelText: { fontWeight: "600" },
  modalConfirmBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalConfirmText: { color: "#fff", fontWeight: "700" },
});
