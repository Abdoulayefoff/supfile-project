import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, SectionList,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { trashApi } from '../../api/trash';
import { formatFileSize, formatDate, getMimeIcon } from '../../utils/fileHelpers';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

// Interface décrivant un fichier présent dans la corbeille
interface TrashFile {
  id: number;
  name: string;
  size: number;
  mimeType: string;
  deletedAt: string;
}

// Interface décrivant un dossier présent dans la corbeille
interface TrashFolder {
  id: number;
  name: string;
  deletedAt: string;
}

// Écran de la corbeille (restauration ou suppression définitive des fichiers et dossiers)
export default function TrashScreen() {
  const { colors } = useTheme();

  const [files, setFiles] = useState<TrashFile[]>([]);
  const [folders, setFolders] = useState<TrashFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Récupère les éléments de la corbeille
  const loadData = async () => {
    try {
      const data = await trashApi.getTrash();
      setFiles(data.files || []);
      setFolders(data.folders || []);
    } catch (e) {
      console.error('Erreur chargement corbeille', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  // Relance le chargement des données lors du pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Restaure un fichier spécifique dans son emplacement d'origine
  const handleRestoreFile = async (id: number, name: string) => {
    Alert.alert('Restaurer', `Restaurer "${name}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Restaurer',
        onPress: async () => {
          try {
            setActionLoading(true);
            await trashApi.restoreFile(id);
            loadData();
          } catch (e: any) {
            Alert.alert('Erreur', e.response?.data?.error || 'Impossible de restaurer');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  // Restaure un dossier spécifique dans son emplacement d'origine
  const handleRestoreFolder = async (id: number, name: string) => {
    Alert.alert('Restaurer', `Restaurer "${name}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Restaurer',
        onPress: async () => {
          try {
            setActionLoading(true);
            await trashApi.restoreFolder(id);
            loadData();
          } catch (e: any) {
            Alert.alert('Erreur', e.response?.data?.error || 'Impossible de restaurer');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  // Supprime définitivement un fichier (action irréversible)
  const handleDeleteFilePermanently = (id: number, name: string) => {
    Alert.alert(
      'Suppression définitive',
      `Supprimer définitivement "${name}" ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              await trashApi.deleteFile(id);
              loadData();
            } catch (e: any) {
              Alert.alert('Erreur', e.response?.data?.error || 'Impossible de supprimer');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  // Supprime définitivement un dossier et tout son contenu (action irréversible)
  const handleDeleteFolderPermanently = (id: number, name: string) => {
    Alert.alert(
      'Suppression définitive',
      `Supprimer définitivement "${name}" et tout son contenu ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              await trashApi.deleteFolder(id);
              loadData();
            } catch (e: any) {
              Alert.alert('Erreur', e.response?.data?.error || 'Impossible de supprimer');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  // Rendu d'un élément fichier dans la liste de la corbeille
  const renderFileItem = ({ item }: { item: TrashFile }) => {
    const { icon, color } = getMimeIcon(item.mimeType || '');
    return (
      <View style={[styles.itemContainer, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <View style={styles.itemLeft}>
          <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
            <Ionicons name={icon as any} size={22} color={color} />
          </View>
          <View style={styles.itemInfo}>
            <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={1}>{item.name}</Text>
            <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>
              {formatFileSize(item.size)} • Supprimé le {formatDate(item.deletedAt)}
            </Text>
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleRestoreFile(item.id, item.name)}
            disabled={actionLoading}
          >
            <Ionicons name="refresh-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleDeleteFilePermanently(item.id, item.name)}
            disabled={actionLoading}
          >
            <Ionicons name="trash-outline" size={22} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Rendu d'un élément dossier dans la liste de la corbeille
  const renderFolderItem = ({ item }: { item: TrashFolder }) => (
    <View style={[styles.itemContainer, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
      <View style={styles.itemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons name="folder" size={22} color={colors.primary} />
        </View>
        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={1}>{item.name}</Text>
          <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>
            Dossier • Supprimé le {formatDate(item.deletedAt)}
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleRestoreFolder(item.id, item.name)}
          disabled={actionLoading}
        >
          <Ionicons name="refresh-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleDeleteFolderPermanently(item.id, item.name)}
          disabled={actionLoading}
        >
          <Ionicons name="trash-outline" size={22} color={colors.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Regroupe les dossiers et fichiers en sections pour le SectionList
  const sections = [
    ...(folders.length > 0 ? [{ title: 'Dossiers', data: folders, type: 'folder' as const }] : []),
    ...(files.length > 0 ? [{ title: 'Fichiers', data: files, type: 'file' as const }] : []),
  ];

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const isEmpty = files.length === 0 && folders.length === 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {actionLoading && (
        <View style={[styles.loadingOverlay, { backgroundColor: colors.surface }]}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[{ color: colors.textSecondary, marginLeft: 12 }]}>Traitement…</Text>
        </View>
      )}

      {isEmpty ? (
        <View style={[styles.centered, { flex: 1 }]}>
          <Ionicons name="trash-outline" size={64} color={colors.textTertiary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>La corbeille est vide</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item, index) => `${(item as any).id}-${index}`}
          renderSectionHeader={({ section }) => (
            <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{section.title}</Text>
            </View>
          )}
          renderItem={({ item, section }) => {
            if (section.type === 'folder') {
              return renderFolderItem({ item: item as TrashFolder });
            }
            return renderFileItem({ item: item as TrashFile });
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingOverlay: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, marginHorizontal: 16, marginTop: 8,
    borderRadius: 8, elevation: 2,
  },
  sectionHeader: { paddingHorizontal: 16, paddingVertical: 10 },
  sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  itemContainer: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1,
  },
  itemLeft: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  iconContainer: { width: 42, height: 42, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '500', marginBottom: 3 },
  itemMeta: { fontSize: 12 },
  actions: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { padding: 8 },
  emptyText: { fontSize: 16, marginTop: 16 },
});
