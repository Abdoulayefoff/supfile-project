import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator, TouchableOpacity, Alert, Modal, Image, ScrollView } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Video, ResizeMode } from 'expo-av';
import { useTheme } from '../../hooks/useTheme';
import { sharesApi } from '../../api/shares';
import { Share } from '../../types';
import { formatDate } from '../../utils/fileHelpers';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';

// Table de correspondance extension → type MIME utilisée quand le backend renvoie 'octet-stream'
const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp',
  mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime',
  mp3: 'audio/mpeg', wav: 'audio/wav', aac: 'audio/aac', m4a: 'audio/mp4',
  pdf: 'application/pdf',
  txt: 'text/plain', md: 'text/markdown', csv: 'text/csv',
};

// Déduit le type MIME exact à partir du nom de fichier si l'API ne fournit pas un type précis
const getMimeFromName = (name: string, mimeType?: string): string => {
  if (mimeType && mimeType !== 'application/octet-stream') return mimeType;
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return MIME_BY_EXT[ext] ?? 'application/octet-stream';
};

// Écran gérant les partages créés par l'utilisateur et ceux reçus
export default function ShareScreen() {
  const { colors } = useTheme();
  const { token } = useAuthStore();

  // Onglet actif : 'my_shares' (mes partages) ou 'received' (reçus)
  const [activeTab, setActiveTab] = useState<'my_shares' | 'received'>('my_shares');
  const [shares, setShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [openingId, setOpeningId] = useState<number | null>(null);
  const [previewFile, setPreviewFile] = useState<{
    uri: string; mimeType: string; name: string;
  } | null>(null);
  const [previewText, setPreviewText] = useState<string | null>(null);

  // Charge la liste des partages (soit les miens, soit les reçus selon l'onglet actif)
  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'my_shares') {
        const data = await sharesApi.getShares();
        setShares(data);
      } else {
        const data = await sharesApi.getReceivedShares();
        setShares(data);
      }
    } catch (e) {
      console.error('Failed to load shares', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [activeTab])
  );

  // Relance le chargement lors d'un pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Révoque (supprime) un partage existant après confirmation
  const handleDeleteShare = (id: number) => {
    Alert.alert('Confirmation', 'Voulez-vous révoquer ce partage ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Révoquer',
        style: 'destructive',
        onPress: async () => {
          try {
            await sharesApi.deleteShare(id);
            loadData();
          } catch (e) {
            Alert.alert('Erreur', 'Impossible de révoquer le partage');
          }
        },
      },
    ]);
  };

  // Gère l'ouverture d'un fichier reçu (téléchargement et prévisualisation)
  const handleOpenReceivedFile = async (item: Share) => {
    if (!item.resource) {
      Alert.alert('Erreur', 'Ressource introuvable');
      return;
    }
    setOpeningId(item.id);
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.0.22:8000/api';
      const mime = getMimeFromName(item.resource.name, item.resource.mimeType);
      const safeName = item.resource.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileUri = `${FileSystemLegacy.cacheDirectory}share_${item.resource.id}_${safeName}`;
      const info = await FileSystemLegacy.getInfoAsync(fileUri);
      if (!info.exists) {
        await FileSystemLegacy.downloadAsync(
          `${apiUrl}/files/${item.resource.id}/preview`,
          fileUri,
          { headers: { Authorization: `Bearer ${token}` } },
        );
      }

      if (mime === 'application/pdf') {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri, { mimeType: 'application/pdf', dialogTitle: 'Ouvrir le PDF avec', UTI: 'com.adobe.pdf' });
        }
      } else if (mime.startsWith('image/') || mime.startsWith('video/') || mime.startsWith('audio/') || mime.startsWith('text/')) {
        if (mime.startsWith('text/')) {
          const content = await FileSystemLegacy.readAsStringAsync(fileUri);
          setPreviewText(content);
        } else {
          setPreviewText(null);
        }
        setPreviewFile({ uri: fileUri, mimeType: mime, name: item.resource.name });
      } else {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri, { mimeType: mime, dialogTitle: `Ouvrir ${item.resource.name}` });
        } else {
          Alert.alert('Info', 'Aperçu non disponible pour ce type de fichier.');
        }
      }
    } catch (e: any) {
      Alert.alert('Erreur', e.response?.data?.error || 'Impossible d\'ouvrir ce fichier');
    } finally {
      setOpeningId(null);
    }
  };

  // Rendu d'un élément de la liste des partages
  const renderItem = ({ item }: { item: Share }) => {
    const isPublic = item.isPublic;
    const resourceName = item.resource?.name || 'Ressource inconnue';
    const isFolder = item.resourceType === 'folder';
    const resourceIcon = isFolder ? 'folder' : 'document-text';
    const isOpening = openingId === item.id;

    return (
      <View style={[styles.shareItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.shareHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Ionicons name={resourceIcon} size={20} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.resourceName, { color: colors.textPrimary }]} numberOfLines={1}>{resourceName}</Text>
          </View>
          {activeTab === 'my_shares' && (
            <TouchableOpacity onPress={() => handleDeleteShare(item.id)}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.shareDetails}>
          <View style={styles.detailRow}>
            <Ionicons name={isPublic ? 'earth-outline' : 'people-outline'} size={16} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              {isPublic
                ? 'Lien public'
                : activeTab === 'my_shares'
                  ? `Partagé avec ${item.sharedWith?.email || 'inconnu'}`
                  : `Partagé par ${item.createdBy?.fullName || item.createdBy?.email || 'inconnu'}`}
            </Text>
          </View>
          {item.expiresAt && (
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                Expire le {formatDate(item.expiresAt)}
              </Text>
            </View>
          )}
          {item.hasPassword && (
            <View style={styles.detailRow}>
              <Ionicons name="lock-closed-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>Protégé par mot de passe</Text>
            </View>
          )}
        </View>

        {/* Bouton copier lien (mes partages publics) */}
        {isPublic && activeTab === 'my_shares' && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primaryLight }]}
            onPress={async () => {
              const url = `https://www.supfile-cloud.fr/share/${item.token}`;
              await Clipboard.setStringAsync(url);
              Alert.alert('Copié', 'Lien copié dans le presse-papiers');
            }}
          >
            <Ionicons name="copy-outline" size={16} color={colors.primary} />
            <Text style={{ color: colors.primary, marginLeft: 8, fontWeight: '500' }}>Copier le lien</Text>
          </TouchableOpacity>
        )}

        {/* Bouton ouvrir (partages reçus, fichiers uniquement) */}
        {activeTab === 'received' && !isFolder && item.resource && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primaryLight }]}
            onPress={() => handleOpenReceivedFile(item)}
            disabled={isOpening}
          >
            {isOpening
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <>
                  <Ionicons name="open-outline" size={16} color={colors.primary} />
                  <Text style={{ color: colors.primary, marginLeft: 8, fontWeight: '500' }}>Ouvrir le fichier</Text>
                </>
            }
          </TouchableOpacity>
        )}

        {/* Dossier partagé reçu → info */}
        {activeTab === 'received' && isFolder && (
          <View style={[styles.actionButton, { backgroundColor: colors.background }]}>
            <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, marginLeft: 8, fontSize: 13 }}>
              Dossier accessible dans l'onglet Fichiers
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.tabs, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'my_shares' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('my_shares')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'my_shares' ? colors.primary : colors.textSecondary }]}>Mes partages</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'received' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('received')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'received' ? colors.primary : colors.textSecondary }]}>Reçus</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={shares}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="share-social-outline" size={64} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Aucun partage trouvé</Text>
            </View>
          }
        />
      )}

      {/* Modal prévisualisation fichier reçu */}
      <Modal visible={!!previewFile} transparent animationType="fade">
        <View style={styles.previewOverlay}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle} numberOfLines={1}>{previewFile?.name}</Text>
            <TouchableOpacity onPress={() => { setPreviewFile(null); setPreviewText(null); }} style={{ padding: 8 }}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.previewContent}>
            {previewFile?.mimeType.startsWith('image/') ? (
              <Image source={{ uri: previewFile.uri }} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
            ) : previewFile?.mimeType.startsWith('video/') || previewFile?.mimeType.startsWith('audio/') ? (
              <Video
                source={{ uri: previewFile.uri }}
                style={{ width: '100%', height: previewFile.mimeType.startsWith('audio/') ? 200 : '100%' }}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay
              />
            ) : previewFile?.mimeType.startsWith('text/') ? (
              <ScrollView style={{ flex: 1, width: '100%', backgroundColor: colors.surface, padding: 16 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 14 }}>{previewText || 'Chargement…'}</Text>
              </ScrollView>
            ) : (
              <Text style={{ color: '#fff' }}>Aperçu non disponible.</Text>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, paddingVertical: 16, alignItems: 'center' },
  tabText: { fontSize: 16, fontWeight: '500' },
  listContainer: { padding: 16 },
  shareItem: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  shareHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  resourceName: { fontSize: 16, fontWeight: '600', flex: 1 },
  shareDetails: { marginBottom: 12, gap: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center' },
  detailText: { fontSize: 14, marginLeft: 8 },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 8, marginTop: 4 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 40 },
  emptyText: { fontSize: 16, marginTop: 16 },
  previewOverlay: { flex: 1, backgroundColor: '#000' },
  previewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12, backgroundColor: 'rgba(0,0,0,0.8)' },
  previewTitle: { flex: 1, color: '#fff', fontSize: 16, fontWeight: '600', marginRight: 8 },
  previewContent: { flex: 1, backgroundColor: '#000' },
});
