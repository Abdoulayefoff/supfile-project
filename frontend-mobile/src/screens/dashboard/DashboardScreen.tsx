import { FontAwesome, Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { dashboardApi } from "../../api/dashboard";
import { useTheme } from "../../hooks/useTheme";
import { useAuthStore } from "../../store/authStore";
import { useSyncStore } from "../../store/syncStore";
import { DashboardStats, FileItem, MimeTypeStat } from "../../types";
import {
  formatDate,
  formatFileSize,
  getMimeIcon,
} from "../../utils/fileHelpers";

import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { TabParamList } from "../../navigation/AppNavigator";
import FilePreviewModal from "../preview/FilePreviewScreen";

import { Modal } from "react-native";
import apiClient, { API_URL, getMemoryToken } from "../../api/client";
import { filesApi } from "../../api/files";

import UploadModal from "../upload/UploadScreen";
import TrashScreen from "../trash/TrashScreen";
import { Image } from "react-native";

const { width } = Dimensions.get("window");

export default function DashboardScreen() {
  const { colors } = useTheme();
  const { user } = useAuthStore();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsByType, setStatsByType] = useState<MimeTypeStat[]>([]);
  const [recentFiles, setRecentFiles] = useState<FileItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const { lastUpdate, triggerRefresh } = useSyncStore();

  const [showUpload, setShowUpload] = useState(false);
  const [showTrash, setShowTrash] = useState(false);

  const loadData = async () => {
    try {
      const [statsData, typeData, recentData] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getStatsByType(),
        dashboardApi.getRecentFiles(),
      ]);
      console.log("Stats:", JSON.stringify(statsData));
      console.log("Type:", JSON.stringify(typeData));
      console.log("Recent:", JSON.stringify(recentData));
      setStats(statsData);
      setStatsByType(typeData);
      setRecentFiles(recentData);
    } catch (err: any) {
      console.log("Dashboard error:", err.response?.status, err.message);
    } finally {
      setLoading(false);
    }
  };

  const isFirstLoad = useRef(true);
  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      loadData();
      return;
    }
    // Refresh silencieux sans loading spinner
    const silentRefresh = async () => {
      try {
        const [statsData, typeData, recentData] = await Promise.all([
          dashboardApi.getStats(),
          dashboardApi.getStatsByType(),
          dashboardApi.getRecentFiles(),
        ]);
        setStats(statsData);
        setStatsByType(typeData);
        setRecentFiles(recentData);
      } catch (err) {
        console.log("Dashboard silent refresh error:", err);
      }
    };
    silentRefresh();
  }, [lastUpdate]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatQuota = (bytes: number): string => {
    if (bytes < 1073741824) {
      return (bytes / 1048576).toFixed(1) + " MB";
    }
    return (bytes / 1073741824).toFixed(1) + " Go";
  };

  const getTypeColor = (type: string): string => {
    const t = type.toLowerCase();
    if (t === "images" || t === "image") return "#10b981";
    if (t === "videos" || t === "video" || t === "vidéos") return "#8b5cf6";
    if (t === "documents" || t === "document") return "#2563eb";
    if (t === "pdf") return "#ef4444";
    if (t === "audio") return "#f59e0b";
    if (t === "archives" || t === "archive") return "#ca8a04";
    if (t === "text" || t === "texte") return "#64748b";
    return "#94a3b8";
  };

  const getTypeIcon = (type: string): string => {
    const t = type.toLowerCase();
    if (t === "images" || t === "image") return "image-outline";
    if (t === "videos" || t === "video" || t === "vidéos")
      return "videocam-outline";
    if (t === "documents" || t === "document") return "reader-outline";
    if (t === "pdf") return "document-text-outline";
    if (t === "audio") return "musical-notes-outline";
    if (t === "archives" || t === "archive") return "archive-outline";
    if (t === "text" || t === "texte") return "document-outline";
    return "ellipsis-horizontal-outline";
  };

  const getTypeLabel = (type: string): string => {
    const t = type.toLowerCase();
    if (t === "images" || t === "image") return "Images";
    if (t === "videos" || t === "video") return "Vidéos";
    if (t === "documents" || t === "document") return "Documents";
    if (t === "pdf") return "PDF";
    if (t === "audio") return "Audio";
    if (t === "archives" || t === "archive") return "Archives";
    if (t === "text" || t === "texte") return "Texte";
    return type;
  };

  const avatarUrl = user?.avatar
    ? `${API_URL}/files/avatar/${user.avatar.split("/").pop()?.split("?")[0]}?token=${getMemoryToken()}`
    : null;

  const totalUsedByType = statsByType.reduce((sum, s) => sum + s.totalSize, 0);

  // ── Écran de chargement ──
  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text
          style={{ color: colors.textSecondary, marginTop: 12, fontSize: 14 }}
        >
          Chargement du dashboard...
        </Text>
      </View>
    );
  }

  // ── Erreur / pas de données ──
  if (!stats) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <Ionicons
          name="cloud-offline-outline"
          size={48}
          color={colors.textTertiary}
        />
        <Text
          style={{ color: colors.textSecondary, marginTop: 12, fontSize: 14 }}
        >
          Impossible de charger les données
        </Text>
        <TouchableOpacity
          onPress={loadData}
          style={{
            marginTop: 16,
            backgroundColor: colors.primary,
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
        <View>
          <Text style={[styles.headerGreeting, { color: colors.textTertiary }]}>
            Bonjour {user?.firstName ? user.firstName : "👋"}
          </Text>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Dashboard
          </Text>
        </View>
        <View
          style={[styles.avatarCircle, { backgroundColor: colors.primary }]}
        >
          {/* Avatar avec image si disponible */}
          {user?.avatar ? (
            <Image
              source={{
                uri: user.avatar.startsWith("http")
                  ? user.avatar
                  : `${process.env.EXPO_PUBLIC_API_URL?.replace("/api", "")}/uploads/avatars/${user.avatar.split("/").pop()?.split("?")[0]}`,
              }}
              style={[styles.avatarCircle, { borderWidth: 0 }]}
            />
          ) : (
            <View
              style={[styles.avatarCircle, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.avatarText}>
                {user?.firstName?.[0]?.toUpperCase() ??
                  user?.email?.[0]?.toUpperCase() ??
                  "?"}
              </Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* ── Carte Quota ── */}
        <View style={styles.section}>
          <View style={[styles.quotaCard, { backgroundColor: colors.primary }]}>
            <View style={styles.quotaHeader}>
              <View>
                <Text style={styles.quotaLabel}>Stockage utilisé</Text>
                <Text style={styles.quotaValue}>
                  {formatQuota(stats.quotaUsed)}
                  <Text style={styles.quotaTotal}>
                    {" "}
                    / {formatQuota(stats.quotaLimit)}
                  </Text>
                </Text>
              </View>
              <View style={styles.quotaIconCircle}>
                <Ionicons
                  name="cloud-outline"
                  size={24}
                  color={colors.primary}
                />
              </View>
            </View>

            {/* Barre de progression */}
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min(stats.quotaPercentage, 100)}%`,
                    backgroundColor:
                      stats.quotaPercentage > 80 ? "#ef4444" : "#fff",
                  },
                ]}
              />
            </View>
            <Text style={styles.quotaPercent}>
              {stats.quotaPercentage.toFixed(1)}% utilisé
            </Text>

            {/* Stats rapides */}
            <View style={styles.quickStats}>
              <View style={styles.quickStatItem}>
                <Ionicons
                  name="document-outline"
                  size={16}
                  color="rgba(255,255,255,0.8)"
                />
                <Text style={styles.quickStatValue}>{stats.totalFiles}</Text>
                <Text style={styles.quickStatLabel}>Fichiers</Text>
              </View>
              <View style={styles.quickStatDivider} />
              <View style={styles.quickStatItem}>
                <Ionicons
                  name="folder-outline"
                  size={16}
                  color="rgba(255,255,255,0.8)"
                />
                <Text style={styles.quickStatValue}>{stats.totalFolders}</Text>
                <Text style={styles.quickStatLabel}>Dossiers</Text>
              </View>
              <View style={styles.quickStatDivider} />
              <View style={styles.quickStatItem}>
                <Ionicons
                  name="server-outline"
                  size={16}
                  color="rgba(255,255,255,0.8)"
                />
                <Text style={styles.quickStatValue}>
                  {formatQuota(stats.quotaLimit - stats.quotaUsed)}
                </Text>
                <Text style={styles.quickStatLabel}>Libre</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Répartition par type ── */}
        {statsByType.length > 0 && (
          <View style={styles.section}>
            <Text
              style={[styles.sectionTitle, { color: colors.textSecondary }]}
            >
              RÉPARTITION PAR TYPE
            </Text>
            <View
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              {/* Barre de répartition visuelle */}
              {totalUsedByType > 0 && (
                <View style={styles.typeBar}>
                  {statsByType.map((item, index) => {
                    const percentage = item.totalSize / totalUsedByType;
                    const minWidth = percentage < 0.05 ? 0.05 : percentage; // minimum 5%
                    return (
                      <View
                        key={index}
                        style={[
                          styles.typeBarSegment,
                          {
                            flex: minWidth,
                            backgroundColor: getTypeColor(item.type),
                            borderTopLeftRadius: index === 0 ? 6 : 0,
                            borderBottomLeftRadius: index === 0 ? 6 : 0,
                            borderTopRightRadius:
                              index === statsByType.length - 1 ? 6 : 0,
                            borderBottomRightRadius:
                              index === statsByType.length - 1 ? 6 : 0,
                          },
                        ]}
                      />
                    );
                  })}
                </View>
              )}

              {/* Légende */}
              {statsByType.map((item, index) => (
                <View
                  key={index}
                  style={[
                    styles.typeItem,
                    {
                      borderBottomColor: colors.border,
                      borderBottomWidth: index < statsByType.length - 1 ? 1 : 0,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.typeDot,
                      { backgroundColor: getTypeColor(item.type) },
                    ]}
                  />
                  <View
                    style={[
                      styles.typeIconBox,
                      {
                        backgroundColor: getTypeColor(item.type) + "20",
                      },
                    ]}
                  >
                    <Ionicons
                      name={getTypeIcon(item.type) as any}
                      size={14}
                      color={getTypeColor(item.type)}
                    />
                  </View>
                  <Text style={[styles.typeName, { color: colors.text }]}>
                    {getTypeLabel(item.type)}
                  </Text>
                  <Text
                    style={[styles.typeCount, { color: colors.textTertiary }]}
                  >
                    {item.count} fichier{item.count > 1 ? "s" : ""}
                  </Text>
                  <Text
                    style={[styles.typeSize, { color: colors.textSecondary }]}
                  >
                    {formatFileSize(item.totalSize)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Fichiers récents ── */}
        {recentFiles.length > 0 && (
          <View style={styles.section}>
            <Text
              style={[styles.sectionTitle, { color: colors.textSecondary }]}
            >
              FICHIERS RÉCENTS
            </Text>
            <View
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              {recentFiles.map((file, index) => {
                const { icon, color } = getMimeIcon(file.mimeType);
                return (
                  <TouchableOpacity
                    key={file.id}
                    style={[
                      styles.recentItem,
                      {
                        borderBottomColor: colors.border,
                        borderBottomWidth:
                          index < recentFiles.length - 1 ? 1 : 0,
                      },
                    ]}
                    onPress={() => setPreviewFile(file)}
                    onLongPress={() => {
                      setSelectedFile(file);
                      setShowActionModal(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.recentIconBox,
                        { backgroundColor: color + "20" },
                      ]}
                    >
                      <FontAwesome name={icon as any} size={18} color={color} />
                    </View>
                    <View style={styles.recentInfo}>
                      <Text
                        style={[styles.recentName, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {file.name}
                      </Text>
                      <Text
                        style={[
                          styles.recentMeta,
                          { color: colors.textTertiary },
                        ]}
                      >
                        {formatFileSize(file.size)} ·{" "}
                        {formatDate(file.updatedAt)}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={14}
                      color={colors.textTertiary}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Message si aucun fichier ── */}
        {recentFiles.length === 0 && statsByType.length === 0 && (
          <View
            style={[styles.section, { alignItems: "center", paddingTop: 20 }]}
          >
            <View
              style={[
                styles.emptyIconBox,
                { backgroundColor: colors.surfaceSecondary },
              ]}
            >
              <Ionicons
                name="cloud-upload-outline"
                size={36}
                color={colors.textTertiary}
              />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
              Aucun fichier
            </Text>
            <Text style={[styles.emptySub, { color: colors.textTertiary }]}>
              Uploadez vos premiers fichiers pour commencer
            </Text>
          </View>
        )}

        {/* ── Actions rapides ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            ACTIONS RAPIDES
          </Text>
          <View style={styles.actionsGrid}>
            {[
              {
                icon: "cloud-upload-outline",
                label: "Uploader",
                color: colors.primary,
                bg: colors.primaryLight,
                onPress: () => setShowUpload(true),
              },
              {
                icon: "folder-open-outline",
                label: "Mes fichiers",
                color: "#10b981",
                bg: colors.successLight,
                onPress: () => navigation.navigate("Files"),
              },
              {
                icon: "share-social-outline",
                label: "Partagés",
                color: "#8b5cf6",
                bg: colors.purpleLight,
                onPress: () => navigation.navigate("Shared"),
              },
              {
                icon: "trash-outline",
                label: "Corbeille",
                color: "#ef4444",
                bg: colors.dangerLight,
                onPress: () => setShowTrash(true),
              },
            ].map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.actionCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={action.onPress}
                activeOpacity={0.7}
              >
                <View
                  style={[styles.actionIconBox, { backgroundColor: action.bg }]}
                >
                  <Ionicons
                    name={action.icon as any}
                    size={22}
                    color={action.color}
                  />
                </View>
                <Text style={[styles.actionLabel, { color: colors.text }]}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <FilePreviewModal
        visible={previewFile !== null}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
      />

      {/* ── Action sheet fichiers récents ── */}
      <Modal visible={showActionModal} transparent animationType="slide">
        <TouchableOpacity
          style={styles.actionOverlay}
          onPress={() => setShowActionModal(false)}
          activeOpacity={1}
        >
          <View
            style={[styles.actionSheet, { backgroundColor: colors.surface }]}
          >
            <View
              style={[styles.actionHandle, { backgroundColor: colors.border }]}
            />
            <View style={styles.actionTitleRow}>
              <View
                style={[
                  styles.actionTitleIcon,
                  { backgroundColor: colors.primaryLight },
                ]}
              >
                <Ionicons name="document" size={18} color={colors.primary} />
              </View>
              <Text
                style={[styles.actionTitle, { color: colors.text }]}
                numberOfLines={1}
              >
                {selectedFile?.name}
              </Text>
            </View>

            {[
              {
                icon: "eye-outline",
                color: colors.primary,
                bg: colors.primaryLight,
                label: "Prévisualiser",
                onPress: () => {
                  setShowActionModal(false);
                  if (selectedFile) setPreviewFile(selectedFile);
                },
              },
              {
                icon: "share-social-outline",
                color: "#8b5cf6",
                bg: colors.purpleLight,
                label: "Partager",
                onPress: () => {
                  setShowActionModal(false);
                  setShowShareModal(true);
                },
              },
              {
                icon: "trash-outline",
                color: colors.danger,
                bg: colors.dangerLight,
                label: "Supprimer",
                onPress: async () => {
                  setShowActionModal(false);
                  if (!selectedFile) return;
                  try {
                    await filesApi.deleteFile(selectedFile.id);
                    setRecentFiles((prev) =>
                      prev.filter((f) => f.id !== selectedFile.id),
                    );
                    triggerRefresh();
                  } catch {
                    Alert.alert("Erreur", "Impossible de supprimer");
                  }
                },
              },
            ].map((action) => (
              <TouchableOpacity
                key={action.label}
                style={styles.actionItem}
                onPress={action.onPress}
              >
                <View
                  style={[styles.actionIconBox, { backgroundColor: action.bg }]}
                >
                  <Ionicons
                    name={action.icon as any}
                    size={18}
                    color={action.color}
                  />
                </View>
                <Text
                  style={[
                    styles.actionLabel,
                    {
                      color:
                        action.label === "Supprimer"
                          ? colors.danger
                          : colors.text,
                    },
                  ]}
                >
                  {action.label}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={colors.border}
                />
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Upload Modal ── */}
      <UploadModal
        visible={showUpload}
        onClose={() => setShowUpload(false)}
        onUploadSuccess={() => {
          setShowUpload(false);
          triggerRefresh();
        }}
        currentFolderId={null}
      />

      {/* ── Corbeille Modal ── */}
      <Modal visible={showTrash} animationType="slide">
        <View style={{ flex: 1 }}>
          <View
            style={[
              {
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 20,
                paddingTop: 56,
                paddingBottom: 16,
                borderBottomWidth: 1,
                backgroundColor: colors.header,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <TouchableOpacity onPress={() => setShowTrash(false)}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text
              style={{ fontSize: 20, fontWeight: "800", color: colors.text }}
            >
              Corbeille
            </Text>
            <View style={{ width: 24 }} />
          </View>
          <TrashScreen />
        </View>
      </Modal>

      {/* ── Modal Partager ── */}
      <Modal visible={showShareModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Partager "{selectedFile?.name}"
              </Text>
              <TouchableOpacity onPress={() => setShowShareModal(false)}>
                <Ionicons name="close" size={22} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.shareOption,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.primaryLight,
                },
              ]}
              onPress={async () => {
                setShowShareModal(false);
                try {
                  const res = await apiClient.post("/shares", {
                    fileId: selectedFile?.id,
                    isPublic: true,
                  });
                  const shareUrl = `http://192.168.0.15:3000/share/${res.data.token}`;
                  Alert.alert("✅ Lien créé", shareUrl, [{ text: "OK" }]);
                } catch {
                  Alert.alert("Erreur", "Impossible de créer le partage");
                }
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="globe-outline" size={22} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text
                  style={[styles.shareOptionTitle, { color: colors.primary }]}
                >
                  Lien public
                </Text>
                <Text
                  style={[
                    styles.shareOptionSub,
                    { color: colors.textSecondary },
                  ]}
                >
                  Accessible à tous via un lien
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.shareOption,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.purpleLight,
                },
              ]}
              onPress={async () => {
                setShowShareModal(false);
                try {
                  await apiClient.post("/shares", {
                    fileId: selectedFile?.id,
                    isPublic: false,
                  });
                  Alert.alert(
                    "✅ Partage créé",
                    "Le fichier a été partagé en privé",
                  );
                } catch {
                  Alert.alert("Erreur", "Impossible de créer le partage");
                }
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="people-outline" size={22} color={colors.purple} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text
                  style={[styles.shareOptionTitle, { color: colors.purple }]}
                >
                  Partage privé
                </Text>
                <Text
                  style={[
                    styles.shareOptionSub,
                    { color: colors.textSecondary },
                  ]}
                >
                  Visible uniquement par les personnes invitées
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalCancelBtn,
                { borderColor: colors.border, marginTop: 8 },
              ]}
              onPress={() => setShowShareModal(false)}
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
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerGreeting: { fontSize: 13, fontWeight: "500", marginBottom: 2 },
  headerTitle: { fontSize: 26, fontWeight: "800" },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarText: { color: "#fff", fontSize: 18, fontWeight: "700" },

  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 12,
  },

  quotaCard: { borderRadius: 20, padding: 20 },
  quotaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  quotaLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    marginBottom: 4,
  },
  quotaValue: { fontSize: 28, fontWeight: "800", color: "#fff" },
  quotaTotal: {
    fontSize: 16,
    fontWeight: "400",
    color: "rgba(255,255,255,0.6)",
  },
  quotaIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginBottom: 8,
    overflow: "hidden",
  },
  progressBarFill: { height: "100%", borderRadius: 4 },
  quotaPercent: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    marginBottom: 16,
  },
  quickStats: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    padding: 12,
  },
  quickStatItem: { flex: 1, alignItems: "center", gap: 4 },
  quickStatValue: { fontSize: 16, fontWeight: "700", color: "#fff" },
  quickStatLabel: { fontSize: 10, color: "rgba(255,255,255,0.7)" },
  quickStatDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginHorizontal: 8,
  },

  card: { borderRadius: 16, borderWidth: 1.5, overflow: "hidden" },

  typeBar: {
    flexDirection: "row",
    height: 8,
    borderRadius: 6,
    overflow: "hidden",
    margin: 16,
    marginBottom: 8,
  },
  typeBarSegment: { height: "100%" },
  typeItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  typeDot: { width: 8, height: 8, borderRadius: 4 },
  typeIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  typeName: { flex: 1, fontSize: 14, fontWeight: "600" },
  typeCount: { fontSize: 12 },
  typeSize: { fontSize: 12, fontWeight: "600", marginLeft: 8 },

  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  recentIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  recentInfo: { flex: 1 },
  recentName: { fontSize: 14, fontWeight: "600", marginBottom: 3 },
  recentMeta: { fontSize: 11 },

  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
  emptySub: { fontSize: 13, textAlign: "center" },

  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  actionCard: {
    width: (width - 44) / 2,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    alignItems: "center",
    gap: 10,
  },

  actionOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  actionSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
  actionHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  actionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  actionTitleIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitle: { flex: 1, fontSize: 15, fontWeight: "700" },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 14,
  },
  actionIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: { flex: 1, fontSize: 15, fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 24,
  },
  modal: { borderRadius: 20, padding: 24 },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  modalCancelBtn: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
  },
  modalCancelText: { fontWeight: "600" },
  shareOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  shareOptionTitle: { fontSize: 15, fontWeight: "700", marginBottom: 3 },
  shareOptionSub: { fontSize: 12 },
});
