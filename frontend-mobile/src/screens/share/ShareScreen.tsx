import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  Share,
} from "react-native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";
import { formatDate } from "../../utils/fileHelpers";
import apiClient from "../../api/client";
import FilePreviewModal from "../preview/FilePreviewScreen";
import { formatFileSize } from "../../utils/fileHelpers";

interface ShareItem {
  id: number;
  token: string;
  isPublic: boolean;
  hasPassword: boolean;
  expiresAt: string | null;
  createdAt: string;
  resourceType: "file" | "folder";
  resource: {
    id: number;
    name: string;
    mimeType?: string;
    size?: string | number;
  } | null;
  createdBy?: { id: number; email: string; fullName: string };
  sharedWith?: { id: number; email: string; fullName: string } | null;
  // compatibilité ancienne
  file?: { id: number; name: string; mimeType: string; size: number } | null;
  folder?: { id: number; name: string } | null;
}

export default function ShareScreen() {
  const { colors } = useTheme();
  const [myShares, setMyShares] = useState<ShareItem[]>([]);
  const [receivedShares, setReceivedShares] = useState<ShareItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"my" | "received">("my");
  const hasLoaded = useRef(false);

  const [previewFile, setPreviewFile] = useState<{
    id: number;
    name: string;
    mimeType: string;
    size: number;
  } | null>(null);

  const loadShares = async () => {
    try {
      const [myRes, receivedRes] = await Promise.all([
        apiClient.get("/shares"),
        apiClient.get("/shares/received"),
      ]);
      console.log("My shares:", JSON.stringify(myRes.data));
      console.log("Received shares:", JSON.stringify(receivedRes.data));
      setMyShares(myRes.data ?? []);
      setReceivedShares(receivedRes.data ?? []);
    } catch (err) {
      console.log("Shares error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    loadShares();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadShares();
    setRefreshing(false);
  };

  const handleDeleteShare = (id: number) => {
    Alert.alert("Supprimer le partage", "Ce lien de partage sera désactivé.", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            await apiClient.delete(`/shares/${id}`);
            setMyShares((prev) => prev.filter((s) => s.id !== id));
          } catch {
            Alert.alert("Erreur", "Impossible de supprimer le partage");
          }
        },
      },
    ]);
  };

  const handleCopyLink = async (token: string) => {
    const url = `http://192.168.0.22:3000/share/${token}`;
    await Share.share({ message: url });
  };

  const getShareName = (share: ShareItem): string => {
    if (share.resource) return decodeURIComponent(share.resource.name);
    if (share.file) return decodeURIComponent(share.file.name);
    if (share.folder) return share.folder.name;
    return "Élément inconnu";
  };

  const getShareIcon = (share: ShareItem): string => {
    if (share.resourceType === "folder" || share.folder) return "folder";
    return "file";
  };

  const getShareIconColor = (share: ShareItem): string => {
    if (share.resourceType === "folder" || share.folder) return colors.primary;
    return "#10b981";
  };

  const getShareIconBg = (share: ShareItem): string => {
    if (share.resourceType === "folder" || share.folder)
      return colors.primaryLight;
    return "#dcfce7";
  };

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
          Chargement des partages...
        </Text>
      </View>
    );
  }

  const renderShareItem = (share: ShareItem, showDelete: boolean) => (
    <TouchableOpacity
      key={share.id}
      style={[
        styles.shareRow,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
      onPress={() => {
        const resource = share.resource ?? share.file;
        if (share.resourceType === "file" || share.file) {
          if (resource) {
            setPreviewFile({
              id: resource.id,
              name: resource.name,
              mimeType:
                share.file?.mimeType ??
                resource.mimeType ??
                "application/octet-stream",
              size: Number(share.file?.size ?? resource.size ?? 0),
            });
          }
        } else {
          Alert.alert(
            "Info",
            `Dossier "${resource?.name}" — accessible depuis Mon Drive`,
          );
        }
      }}
      activeOpacity={0.7}
    >
      {/* Icône */}
      <View
        style={[styles.shareIcon, { backgroundColor: getShareIconBg(share) }]}
      >
        <Ionicons
          name={
            getShareIcon(share) === "folder" ? "folder" : "document-outline"
          }
          size={20}
          color={getShareIconColor(share)}
        />
      </View>

      {/* Infos */}
      <View style={styles.shareInfo}>
        <Text
          style={[styles.shareName, { color: colors.text }]}
          numberOfLines={1}
        >
          {getShareName(share)}
        </Text>

        {/* Taille du fichier */}
        {(share.resource || share.file) && share.resourceType === "file" && (
          <Text style={[styles.shareSize, { color: colors.textTertiary }]}>
            {formatFileSize(
              Number(share.resource?.size ?? share.file?.size ?? 0),
            )}
          </Text>
        )}

        <View style={styles.shareMeta}>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: share.isPublic
                  ? colors.primaryLight
                  : colors.purpleLight,
              },
            ]}
          >
            <Ionicons
              name={share.isPublic ? "globe-outline" : "people-outline"}
              size={10}
              color={share.isPublic ? colors.primary : colors.purple}
            />
            <Text
              style={[
                styles.badgeText,
                {
                  color: share.isPublic ? colors.primary : colors.purple,
                },
              ]}
            >
              {share.isPublic ? "Public" : "Privé"}
            </Text>
          </View>

          {share.hasPassword && (
            <View
              style={[
                styles.badge,
                { backgroundColor: colors.surfaceSecondary },
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={10}
                color={colors.textTertiary}
              />
              <Text style={[styles.badgeText, { color: colors.textTertiary }]}>
                Protégé
              </Text>
            </View>
          )}

          {share.expiresAt && (
            <Text style={[styles.expireText, { color: colors.textTertiary }]}>
              Expire le {formatDate(share.expiresAt)}
            </Text>
          )}
        </View>

        {share.createdBy && !showDelete && (
          <Text style={[styles.sharedByText, { color: colors.textTertiary }]}>
            Par {share.createdBy.fullName}
          </Text>
        )}

        <Text style={[styles.shareDate, { color: colors.textTertiary }]}>
          {formatDate(share.createdAt)}
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.shareActions}>
        {share.isPublic && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primaryLight }]}
            onPress={(e) => {
              e.stopPropagation?.();
              handleCopyLink(share.token);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="share-outline" size={16} color={colors.primary} />
          </TouchableOpacity>
        )}
        {showDelete && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.dangerLight }]}
            onPress={(e) => {
              e.stopPropagation?.();
              handleDeleteShare(share.id);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  const currentList = activeTab === "my" ? myShares : receivedShares;
  const isEmpty = currentList.length === 0;

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Partagés
        </Text>
      </View>

      {/* ── Tabs ── */}
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "my" && {
              borderBottomColor: colors.primary,
              borderBottomWidth: 2,
            },
          ]}
          onPress={() => setActiveTab("my")}
        >
          <Ionicons
            name="cloud-upload-outline"
            size={16}
            color={activeTab === "my" ? colors.primary : colors.textTertiary}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "my" ? colors.primary : colors.textTertiary,
                fontWeight: activeTab === "my" ? "700" : "500",
              },
            ]}
          >
            Mes partages
          </Text>
          {myShares.length > 0 && (
            <View
              style={[styles.tabBadge, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.tabBadgeText}>{myShares.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "received" && {
              borderBottomColor: colors.primary,
              borderBottomWidth: 2,
            },
          ]}
          onPress={() => setActiveTab("received")}
        >
          <Ionicons
            name="cloud-download-outline"
            size={16}
            color={
              activeTab === "received" ? colors.primary : colors.textTertiary
            }
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "received"
                    ? colors.primary
                    : colors.textTertiary,
                fontWeight: activeTab === "received" ? "700" : "500",
              },
            ]}
          >
            Reçus
          </Text>
          {receivedShares.length > 0 && (
            <View
              style={[styles.tabBadge, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.tabBadgeText}>{receivedShares.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {isEmpty ? (
        <View style={styles.emptyState}>
          <View
            style={[
              styles.emptyIconBox,
              { backgroundColor: colors.surfaceSecondary },
            ]}
          >
            <Ionicons
              name={
                activeTab === "my" ? "share-social-outline" : "people-outline"
              }
              size={48}
              color={colors.textTertiary}
            />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
            {activeTab === "my" ? "Aucun partage" : "Aucun partage reçu"}
          </Text>
          <Text style={[styles.emptySub, { color: colors.textTertiary }]}>
            {activeTab === "my"
              ? "Partage des fichiers depuis Mon Drive"
              : "Les fichiers partagés avec toi apparaîtront ici"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={currentList}
          keyExtractor={(item) => String(item.id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => renderShareItem(item, activeTab === "my")}
        />
      )}

      {/* ── Preview ── */}
      <FilePreviewModal
        visible={previewFile !== null}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
      />
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

  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 6,
  },
  tabText: { fontSize: 13 },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 4,
  },
  tabBadgeText: { fontSize: 10, fontWeight: "700", color: "#fff" },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 80,
  },
  emptyIconBox: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  emptySub: { fontSize: 13, textAlign: "center", paddingHorizontal: 40 },

  shareRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 10,
    gap: 12,
  },
  shareIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  shareInfo: { flex: 1 },
  shareName: { fontSize: 14, fontWeight: "700", marginBottom: 6 },
  shareMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 4,
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: { fontSize: 10, fontWeight: "600" },
  expireText: { fontSize: 10, fontWeight: "500" },
  sharedByText: { fontSize: 11, marginBottom: 2 },
  shareDate: { fontSize: 11 },

  shareActions: { flexDirection: "row", gap: 8 },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  shareSize: { fontSize: 11, marginBottom: 4, color: "#94a3b8" },
});
