import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { formatFileSize, formatDate, getMimeIcon } from '../../utils/fileHelpers';
import apiClient from '../../api/client';
import { FileItem, FolderItem } from '../../types';
import { useSyncStore } from '../../store/syncStore';

interface TrashFile extends FileItem {
  deletedAt: string;
}

interface TrashFolder extends FolderItem {
  deletedAt: string;
}

export default function TrashScreen() {
  const { colors } = useTheme();
  const [files, setFiles] = useState<TrashFile[]>([]);
  const [folders, setFolders] = useState<TrashFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoaded = useRef(false);
  const { triggerRefresh } = useSyncStore();

  const loadTrash = async () => {
    try {
      const res = await apiClient.get('/trash');
      const data = res.data;
      setFiles(data.files ?? []);
      setFolders(data.folders ?? []);
    } catch (err) {
      console.log('Trash error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    loadTrash();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTrash();
    setRefreshing(false);
  };

  const handleRestoreFile = async (id: number, name: string) => {
    try {
      await apiClient.post(`/trash/files/${id}/restore`);
      setFiles(prev => prev.filter(f => f.id !== id));
      triggerRefresh();
      Alert.alert('✅ Restauré', `"${name}" a été restauré`);
    } catch {
      Alert.alert('Erreur', 'Impossible de restaurer le fichier');
    }
  };

  const handleRestoreFolder = async (id: number, name: string) => {
    try {
      await apiClient.post(`/trash/folders/${id}/restore`);
      setFolders(prev => prev.filter(f => f.id !== id));
      Alert.alert('✅ Restauré', `"${name}" a été restauré`);
    } catch {
      Alert.alert('Erreur', 'Impossible de restaurer le dossier');
    }
  };

  const handleDeleteFile = (id: number, name: string) => {
    Alert.alert(
      'Supprimer définitivement',
      `"${name}" sera supprimé définitivement et ne pourra plus être récupéré.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer', style: 'destructive', onPress: async () => {
            try {
              await apiClient.delete(`/trash/files/${id}`);
              setFiles(prev => prev.filter(f => f.id !== id));
              triggerRefresh();
            } catch {
              Alert.alert('Erreur', 'Impossible de supprimer le fichier');
            }
          }
        }
      ]
    );
  };

  const handleDeleteFolder = (id: number, name: string) => {
    Alert.alert(
      'Supprimer définitivement',
      `"${name}" et tout son contenu seront supprimés définitivement.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer', style: 'destructive', onPress: async () => {
            try {
              await apiClient.delete(`/trash/folders/${id}`);
              setFolders(prev => prev.filter(f => f.id !== id));
            } catch {
              Alert.alert('Erreur', 'Impossible de supprimer le dossier');
            }
          }
        }
      ]
    );
  };

  const handleEmptyTrash = () => {
    if (files.length === 0 && folders.length === 0) return;
    Alert.alert(
      '🗑️ Vider la corbeille',
      'Tous les éléments seront supprimés définitivement. Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Tout supprimer', style: 'destructive', onPress: async () => {
            try {
              await Promise.all([
                ...files.map(f => apiClient.delete(`/trash/files/${f.id}`)),
                ...folders.map(f => apiClient.delete(`/trash/folders/${f.id}`)),
              ]);
              setFiles([]);
              setFolders([]);
            } catch {
              Alert.alert('Erreur', 'Impossible de vider la corbeille');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: 12, fontSize: 14 }}>
          Chargement de la corbeille...
        </Text>
      </View>
    );
  }

  const isEmpty = files.length === 0 && folders.length === 0;

return (
  <View style={[styles.container, { backgroundColor: colors.background }]}>
    {/* Supprime le header ── il est dans le Modal du FilesScreen */}

    {/* Bouton vider */}
    {!isEmpty && (
      <View style={[styles.topBar, {
        backgroundColor: colors.header,
        borderBottomColor: colors.border,
      }]}>
        <Text style={[styles.countText, { color: colors.textSecondary }]}>
          {files.length + folders.length} élément{files.length + folders.length > 1 ? 's' : ''}
        </Text>
        <TouchableOpacity
          style={[styles.emptyBtn, { backgroundColor: colors.dangerLight }]}
          onPress={handleEmptyTrash}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={14} color={colors.danger} />
          <Text style={[styles.emptyBtnText, { color: colors.danger }]}>Vider</Text>
        </TouchableOpacity>
      </View>
    )}

    {isEmpty ? (
      <View style={styles.emptyState}>
        <View style={[styles.emptyIconBox, { backgroundColor: colors.surfaceSecondary }]}>
          <Ionicons name="trash-outline" size={48} color={colors.textTertiary} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
          Corbeille vide
        </Text>
        <Text style={[styles.emptySub, { color: colors.textTertiary }]}>
          Les fichiers supprimés apparaîtront ici
        </Text>
      </View>
    ) : (
      <FlatList
        data={[]}
        renderItem={null}
        keyExtractor={(_, i) => String(i)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 8 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <>
            <View style={[styles.infoBar, {
              backgroundColor: colors.dangerLight,
              marginHorizontal: 16,
              marginTop: 12,
            }]}>
              <Ionicons name="information-circle-outline" size={16} color={colors.danger} />
              <Text style={[styles.infoText, { color: colors.danger }]}>
                Les éléments dans la corbeille comptent dans ton quota
              </Text>
            </View>

            {folders.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>DOSSIERS</Text>
                  <Text style={[styles.sectionCount, { color: colors.textTertiary }]}>{folders.length}</Text>
                </View>
                {folders.map((item) => (
                  <View key={`folder-${item.id}`} style={[styles.itemRow, {
                    backgroundColor: colors.surface, borderColor: colors.border,
                  }]}>
                    <View style={[styles.itemIcon, { backgroundColor: colors.primaryLight }]}>
                      <FontAwesome name="folder" size={20} color={colors.primary} />
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={[styles.itemMeta, { color: colors.textTertiary }]}>
                        Supprimé le {formatDate(item.deletedAt)}
                      </Text>
                    </View>
                    <View style={styles.itemActions}>
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.primaryLight }]}
                        onPress={() => handleRestoreFolder(item.id, item.name)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="refresh-outline" size={16} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.dangerLight }]}
                        onPress={() => handleDeleteFolder(item.id, item.name)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="trash-outline" size={16} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {files.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>FICHIERS</Text>
                  <Text style={[styles.sectionCount, { color: colors.textTertiary }]}>{files.length}</Text>
                </View>
                {files.map((item) => {
                  const { icon, color } = getMimeIcon(item.mimeType);
                  return (
                    <View key={`file-${item.id}`} style={[styles.itemRow, {
                      backgroundColor: colors.surface, borderColor: colors.border,
                    }]}>
                      <View style={[styles.itemIcon, { backgroundColor: color + '20' }]}>
                        <FontAwesome name={icon as any} size={20} color={color} />
                      </View>
                      <View style={styles.itemInfo}>
                        <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
                          {decodeURIComponent(item.name)}
                        </Text>
                        <Text style={[styles.itemMeta, { color: colors.textTertiary }]}>
                          {formatFileSize(item.size)} · Supprimé le {formatDate(item.deletedAt)}
                        </Text>
                      </View>
                      <View style={styles.itemActions}>
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: colors.primaryLight }]}
                          onPress={() => handleRestoreFile(item.id, item.name)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="refresh-outline" size={16} color={colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: colors.dangerLight }]}
                          onPress={() => handleDeleteFile(item.id, item.name)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="trash-outline" size={16} color={colors.danger} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        }
      />
    )}
  </View>
);
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 26, fontWeight: '800' },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  emptyBtnText: { fontSize: 13, fontWeight: '700' },

  emptyState: {
    flex: 1, alignItems: 'center',
    justifyContent: 'center', paddingBottom: 80,
  },
  emptyIconBox: {
    width: 96, height: 96, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptySub: { fontSize: 13, textAlign: 'center', paddingHorizontal: 40 },

  infoBar: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, padding: 12, borderRadius: 12, marginBottom: 4,
  },
  infoText: { flex: 1, fontSize: 12, fontWeight: '500' },

  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 10,
  },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  sectionCount: { fontSize: 11, fontWeight: '600' },

  itemRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, borderRadius: 14, borderWidth: 1.5,
    marginBottom: 8, gap: 12,
  },
  itemIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', marginBottom: 3 },
  itemMeta: { fontSize: 11 },
  itemActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  topBar: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: 16,
  paddingVertical: 12,
  borderBottomWidth: 1,
},
countText: { fontSize: 13, fontWeight: '600' },
});