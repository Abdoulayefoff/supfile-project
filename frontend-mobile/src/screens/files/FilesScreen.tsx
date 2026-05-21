import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, Modal, TextInput,
  Image, ScrollView, Keyboard,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { filesApi } from '../../api/files';
import { FileItem, FolderItem, Breadcrumb } from '../../types';
import { formatFileSize, formatDate, getMimeIcon } from '../../utils/fileHelpers';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import { Video, ResizeMode } from 'expo-av';
import { WebView } from 'react-native-webview';
import { useAuthStore } from '../../store/authStore';
import { apiClient } from '../../api/client';


// Écran principal de gestion des fichiers et dossiers
export default function FilesScreen({ route }: any) {
  const { colors } = useTheme();
  const { token } = useAuthStore();

  // État courant du dossier navingué (undefined = racine)
  const [currentFolderId, setCurrentFolderId] = useState<number | undefined>(route.params?.folderId);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Recherche
  const [searchQuery, setSearchQuery] = useState('');
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Modals
  const [folderModalVisible, setFolderModalVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Partage
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareResourceId, setShareResourceId] = useState<number | null>(null);
  const [shareResourceType, setShareResourceType] = useState<'file' | 'folder'>('file');
  const [shareEmail, setShareEmail] = useState('');
  const [sharePassword, setSharePassword] = useState('');
  const [shareExpiresAt, setShareExpiresAt] = useState('');
  const [isPublicShare, setIsPublicShare] = useState(false);
  const [shareLink, setShareLink] = useState('');

  // Upload
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Actions courantes
  const [actionLoading, setActionLoading] = useState(false);

  // Renommage
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ id: number; type: 'file' | 'folder'; name: string } | null>(null);
  const [renameNewName, setRenameNewName] = useState('');

  // Déplacement
  const [moveModalVisible, setMoveModalVisible] = useState(false);
  const [moveTarget, setMoveTarget] = useState<{ id: number; type: 'file' | 'folder' } | null>(null);
  const [rootFolders, setRootFolders] = useState<FolderItem[]>([]);

  // Prévisualisation
  const [previewFile, setPreviewFile] = useState<{
    id: number; uri: string; mimeType: string; name: string; remote?: boolean;
  } | null>(null);
  const [previewText, setPreviewText] = useState<string | null>(null);

  // Menu contextuel (remplace Alert.alert — incompatible >3 boutons sur Android)
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    item: FileItem | FolderItem | null;
    type: 'file' | 'folder';
  }>({ visible: false, item: null, type: 'file' });

  // Filtres type/date
  const [filterType, setFilterType] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Chargement données 
  const loadData = useCallback(async (search = '') => {
    try {
      const [filesData, foldersData] = await Promise.all([
        filesApi.getFiles(currentFolderId, search || undefined),
        filesApi.getFolders(currentFolderId),
      ]);
      setFiles(filesData);
      setFolders(foldersData);

      if (currentFolderId) {
        const bcData = await filesApi.getBreadcrumbs(currentFolderId);
        setBreadcrumbs(bcData);
      } else {
        setBreadcrumbs([]);
      }
    } catch (e) {
      console.error('Erreur chargement fichiers', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentFolderId]);

  // Recharge les données quand le folderId change (navigation dans un sous-dossier)
  useEffect(() => {
    setLoading(true);
    setSearchQuery('');
    loadData();
  }, [currentFolderId]);

  useFocusEffect(
    useCallback(() => {
      loadData(searchQuery);
    }, [loadData, searchQuery])
  );

  // Relance le chargement lors d'un pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadData(searchQuery);
  };

  // Recherche avec debounce
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      loadData(text);
    }, 400);
  };

  // Efface la recherche et ferme le clavier
  const clearSearch = () => {
    setSearchQuery('');
    loadData('');
    Keyboard.dismiss();
  };

  // Navigation dossiers
  const handleFolderPress = (folder: FolderItem) => {
    setCurrentFolderId(folder.id);
  };

  // Navigue vers le dossier correspondant au fil d'ariane cliqué
  const handleBreadcrumbPress = (folderId: number | undefined) => {
    setCurrentFolderId(folderId);
  };

  // Menu contextuel fichier/dossier
  // Alert.alert sur Android ignore les boutons au-delà du 3e → Modal custom
  const openItemMenu = (item: FileItem | FolderItem, type: 'file' | 'folder') => {
    setContextMenu({ visible: true, item, type });
  };

  // Ferme le menu contextuel et réinitialise son état
  const closeContextMenu = () => setContextMenu({ visible: false, item: null, type: 'file' });

  // Filtrage local fichiers par type / date
  const applyFilters = (fileList: FileItem[]): FileItem[] => {
    let result = fileList;
    if (filterType) {
      result = result.filter(f => {
        const m = f.mimeType || '';
        switch (filterType) {
          case 'image':    return m.startsWith('image/');
          case 'video':    return m.startsWith('video/');
          case 'audio':    return m.startsWith('audio/');
          case 'pdf':      return m === 'application/pdf';
          case 'text':     return m.startsWith('text/');
          case 'document': return m.includes('word') || m.includes('excel') || m.includes('powerpoint') || m.includes('spreadsheet') || m.includes('presentation');
          case 'archive':  return m.includes('zip') || m.includes('rar') || m.includes('tar') || m.includes('7z');
          default: return true;
        }
      });
    }
    if (filterDate) {
      const limit = new Date();
      if (filterDate === 'today')  limit.setHours(0, 0, 0, 0);
      if (filterDate === 'week')   limit.setDate(limit.getDate() - 7);
      if (filterDate === 'month')  limit.setMonth(limit.getMonth() - 1);
      if (filterDate === 'year')   limit.setFullYear(limit.getFullYear() - 1);
      result = result.filter(f => new Date(f.updatedAt) >= limit);
    }
    return result;
  };

  // Renommage
  const openRenameModal = (id: number, type: 'file' | 'folder', currentName: string) => {
    setRenameTarget({ id, type, name: currentName });
    setRenameNewName(currentName);
    setRenameModalVisible(true);
  };

  // Envoie la requête de renommage vers l'API (fichier ou dossier)
  const handleRename = async () => {
    if (!renameTarget) return;
    const trimmed = renameNewName.trim();
    if (!trimmed) {
      Alert.alert('Erreur', 'Le nom ne peut pas être vide');
      return;
    }
    try {
      setActionLoading(true);
      if (renameTarget.type === 'file') {
        await filesApi.renameFile(renameTarget.id, trimmed);
      } else {
        await filesApi.renameFolder(renameTarget.id, trimmed);
      }
      setRenameModalVisible(false);
      setRenameTarget(null);
      loadData(searchQuery);
    } catch (e: any) {
      Alert.alert('Erreur', e.response?.data?.error || 'Impossible de renommer');
    } finally {
      setActionLoading(false);
    }
  };

  // Déplacement
  const openMoveModal = async (id: number, type: 'file' | 'folder') => {
    setMoveTarget({ id, type });
    try {
      const folders = await filesApi.getFolders();
      setRootFolders(folders);
    } catch {
      setRootFolders([]);
    }
    setMoveModalVisible(true);
  };

  // Envoie la requête de déplacement vers le dossier cible
  const handleMove = async (targetFolderId: number | null) => {
    if (!moveTarget) return;
    try {
      setActionLoading(true);
      if (moveTarget.type === 'file') {
        await filesApi.moveFile(moveTarget.id, targetFolderId);
      } else {
        await filesApi.moveFolder(moveTarget.id, targetFolderId);
      }
      setMoveModalVisible(false);
      setMoveTarget(null);
      loadData(searchQuery);
    } catch (e: any) {
      Alert.alert('Erreur', e.response?.data?.error || 'Impossible de déplacer');
    } finally {
      setActionLoading(false);
    }
  };

  // Suppression
  const confirmDelete = (id: number, type: 'file' | 'folder', name: string) => {
    Alert.alert(
      'Supprimer',
      `Envoyer "${name}" dans la corbeille ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              if (type === 'file') {
                await filesApi.deleteFile(id);
              } else {
                await filesApi.deleteFolder(id);
              }
              loadData(searchQuery);
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

  // Télécharger / Prévisualiser un fichier
  const handleFilePress = async (file: FileItem) => {
    Alert.alert(
      file.name,
      `${formatFileSize(file.size)}`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Visualiser', onPress: () => previewFileContent(file) },
        { text: 'Télécharger', onPress: () => downloadFile(file) },
        { text: 'Plus…', onPress: () => openItemMenu(file, 'file') },
      ]
    );
  };

  // Télécharge le fichier en cache et l'ouvre dans le visualiseur natif
  const previewFileContent = async (file: FileItem) => {
    try {
      setLoading(true);

      // PDF : Android WebView ne rend pas les PDFs nativement.
      // On télécharge le fichier en natif (auth OK), on le lit en base64,
      // puis on injecte un viewer PDF.js dans la WebView.
      if (file.mimeType === 'application/pdf') {
        const previewApiUrl = `${process.env.EXPO_PUBLIC_API_URL}/files/${file.id}/preview`;
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const fileUri = `${FileSystemLegacy.cacheDirectory}pdf_${file.id}_${safeName}`;
        const fileInfo = await FileSystemLegacy.getInfoAsync(fileUri);
        if (!fileInfo.exists) {
          await FileSystemLegacy.downloadAsync(previewApiUrl, fileUri, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
        setPreviewText(null);
        // iOS + Android : ouvrir avec le viewer natif (Quick Look sur iOS, chooser sur Android)
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Ouvrir le PDF avec',
            UTI: 'com.adobe.pdf',
          });
        } else {
          Alert.alert('Info', 'Impossible d\'ouvrir le PDF sur cet appareil.');
        }
        return;
      }

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileUri = `${FileSystemLegacy.documentDirectory}${file.id}_${safeName}`;

      const fileInfo = await FileSystemLegacy.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        await FileSystemLegacy.downloadAsync(
          `${process.env.EXPO_PUBLIC_API_URL}/files/${file.id}/preview`,
          fileUri,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      if (
        file.mimeType?.startsWith('image/') ||
        file.mimeType?.startsWith('video/') ||
        file.mimeType?.startsWith('audio/') ||
        file.mimeType?.startsWith('text/')
      ) {
        if (file.mimeType?.startsWith('text/')) {
          const content = await FileSystemLegacy.readAsStringAsync(fileUri);
          setPreviewText(content);
        } else {
          setPreviewText(null);
        }
        setPreviewFile({ id: file.id, uri: fileUri, mimeType: file.mimeType, name: file.name, remote: false });
      } else {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri);
        } else {
          Alert.alert('Info', 'Aperçu non disponible pour ce type de fichier.');
        }
      }
    } catch (e: any) {
      console.error('Erreur prévisualisation', e);
      Alert.alert('Erreur', 'Impossible de prévisualiser le fichier');
    } finally {
      setLoading(false);
    }
  };

  // Télécharge le fichier et propose le dialogue de partage système
  const downloadFile = async (file: FileItem) => {
    try {
      setLoading(true);
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileUri = `${FileSystemLegacy.documentDirectory}${file.id}_${safeName}`;

      const downloadResult = await FileSystemLegacy.downloadAsync(
        `${process.env.EXPO_PUBLIC_API_URL}/files/${file.id}`,
        fileUri,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(downloadResult.uri);
      } else {
        Alert.alert('Téléchargé', `Fichier enregistré : ${fileUri}`);
      }
    } catch (e: any) {
      console.error('Erreur téléchargement', e);
      Alert.alert('Erreur', 'Impossible de télécharger ce fichier');
    } finally {
      setLoading(false);
    }
  };

  // Télécharger un dossier (zip)
  const handleFolderDownload = async (folder: FolderItem) => {
    try {
      setActionLoading(true);
      const safeName = folder.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileUri = `${FileSystemLegacy.documentDirectory}${folder.id}_${safeName}.zip`;

      const downloadResult = await FileSystemLegacy.downloadAsync(
        `${process.env.EXPO_PUBLIC_API_URL}/folders/${folder.id}/download`,
        fileUri,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(downloadResult.uri, { mimeType: 'application/zip' });
      } else {
        Alert.alert('Téléchargé', 'ZIP enregistré');
      }
    } catch (e: any) {
      console.error('Erreur téléchargement dossier', e);
      Alert.alert('Erreur', 'Impossible de télécharger ce dossier');
    } finally {
      setActionLoading(false);
    }
  };

  // Partage
  const openShareModal = (resourceId: number, type: 'file' | 'folder') => {
    setShareResourceId(resourceId);
    setShareResourceType(type);
    setShareEmail('');
    setSharePassword('');
    setShareExpiresAt('');
    setShareLink('');
    setIsPublicShare(false);
    setShareModalVisible(true);
  };

  // Envoie la requête de création d'un partage (privé ou public)
  const handleCreateShare = async () => {
    if (!shareResourceId) return;
    if (!isPublicShare && !shareEmail.trim()) {
      Alert.alert('Erreur', "Entrez l'email du destinataire");
      return;
    }
    try {
      setActionLoading(true);
      const payload: any = {
        type: shareResourceType,
        resourceId: shareResourceId,
      };

      if (shareExpiresAt.trim()) {
        const d = new Date(shareExpiresAt.trim());
        if (isNaN(d.getTime())) {
          Alert.alert('Erreur', 'Format de date invalide (ex: 2026-12-31)');
          return;
        }
        payload.expiresAt = d.toISOString();
      }

      if (isPublicShare) {
        if (sharePassword.trim()) payload.password = sharePassword.trim();
      } else {
        payload.sharedWithEmail = shareEmail.trim();
      }

      const response = await apiClient.post('/shares', payload);

      if (isPublicShare && response.data?.token) {
        setShareLink(`https://www.supfile-cloud.fr/share/${response.data.token}`);
      } else {
        setShareModalVisible(false);
        Alert.alert('Succès', isPublicShare ? 'Lien public créé' : `Partagé avec ${shareEmail}`);
      }
    } catch (e: any) {
      const msg = e.response?.data?.error || 'Impossible de créer le partage';
      Alert.alert('Erreur', msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Copie le lien public généré dans le presse-papiers
  const copyShareLink = async () => {
    if (shareLink) {
      await Clipboard.setStringAsync(shareLink);
      Alert.alert('Copié', 'Lien copié dans le presse-papiers');
    }
  };

  // Créer dossier
  const handleCreateFolder = async () => {
    const trimmed = newFolderName.trim();
    if (!trimmed) return;
    try {
      setActionLoading(true);
      await filesApi.createFolder(trimmed, currentFolderId);
      setFolderModalVisible(false);
      setNewFolderName('');
      loadData(searchQuery);
    } catch (e: any) {
      Alert.alert('Erreur', e.response?.data?.error || 'Impossible de créer le dossier');
    } finally {
      setActionLoading(false);
    }
  };

  // Upload fichier avec progression
  const handleUploadFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setIsUploading(true);
        setUploadProgress(0);
        await filesApi.uploadFile(
          file.uri,
          file.mimeType || 'application/octet-stream',
          file.name,
          currentFolderId,
          (pct) => setUploadProgress(pct),
        );
        loadData(searchQuery);
        Alert.alert('Succès', 'Fichier uploadé avec succès');
      }
    } catch (e: any) {
      Alert.alert('Erreur', "Erreur lors de l'upload");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Rendu breadcrumbs
  const renderBreadcrumbs = () => (
    <View style={[styles.breadcrumbsContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={[{ id: undefined as any, name: 'Mes fichiers' }, ...breadcrumbs]}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={({ item, index }) => {
          const isLast = index === breadcrumbs.length;
          return (
            <View style={styles.breadcrumbItem}>
              {index > 0 && (
                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} style={{ marginHorizontal: 4 }} />
              )}
              <TouchableOpacity onPress={() => handleBreadcrumbPress(item.id)}>
                <Text style={[
                  styles.breadcrumbText,
                  {
                    color: isLast ? colors.textPrimary : colors.textSecondary,
                    fontWeight: isLast ? '700' : '400',
                    fontSize: isLast ? 16 : 14,
                  }
                ]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </View>
  );

  // Rendu barre de recherche
  const renderSearchBar = () => (
    <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <View style={[styles.searchInputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <Ionicons name="search" size={18} color={colors.textTertiary} style={{ marginRight: 8 }} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Rechercher des fichiers…"
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={handleSearchChange}
          returnKeyType="search"
          onSubmitEditing={() => loadData(searchQuery)}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // Rendu dossier
  const renderFolderItem = (folder: FolderItem) => (
    <View key={`folder-${folder.id}`} style={[styles.itemContainer, { borderBottomColor: colors.border }]}>
      <TouchableOpacity style={styles.itemMain} onPress={() => handleFolderPress(folder)}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons name={folder.isShared ? 'folder-open' : 'folder'} size={24} color={colors.primary} />
        </View>
        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={1}>{folder.name}</Text>
          <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>
            {folder.isShared ? `Partagé par ${folder.sharedBy?.fullName || 'inconnu'}` : formatDate(folder.createdAt)}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionBtn} onPress={() => openItemMenu(folder, 'folder')}>
        <Ionicons name="ellipsis-vertical" size={20} color={colors.textTertiary} />
      </TouchableOpacity>
    </View>
  );

  // Rendu fichier
  const renderFileItem = (file: FileItem) => {
    const { icon, color } = getMimeIcon(file.mimeType || '');
    return (
      <TouchableOpacity
        key={`file-${file.id}`}
        style={[styles.itemContainer, { borderBottomColor: colors.border }]}
        onPress={() => handleFilePress(file)}
      >
        <View style={styles.itemMain}>
          <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
            <Ionicons name={icon as any} size={24} color={color} />
          </View>
          <View style={styles.itemInfo}>
            <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={1}>{file.name}</Text>
            <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>
              {formatFileSize(file.size)} • {formatDate(file.updatedAt)}
            </Text>
          </View>
        </View>

        <View style={styles.fileActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => downloadFile(file)}>
            <Ionicons name="download-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => openItemMenu(file, 'file')}>
            <Ionicons name="ellipsis-vertical" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const combinedData = [
    ...folders.map(f => ({ ...f, _type: 'folder' as const })),
    ...applyFilters(files).map(f => ({ ...f, _type: 'file' as const })),
  ];

  const TYPE_FILTERS = [
    { key: '',         label: 'Tous' },
    { key: 'image',    label: 'Images' },
    { key: 'video',    label: 'Vidéos' },
    { key: 'audio',    label: 'Audio' },
    { key: 'pdf',      label: 'PDF' },
    { key: 'document', label: 'Docs' },
    { key: 'archive',  label: 'Archives' },
    { key: 'text',     label: 'Texte' },
  ];

  const DATE_FILTERS = [
    { key: '',      label: 'Toutes dates' },
    { key: 'today', label: "Aujourd'hui" },
    { key: 'week',  label: 'Cette semaine' },
    { key: 'month', label: 'Ce mois' },
    { key: 'year',  label: 'Cette année' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {renderBreadcrumbs()}
      {renderSearchBar()}

      {/* Filtres rapides */}
      <View style={[styles.filtersBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}>
          {TYPE_FILTERS.map(f => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilterType(f.key)}
              style={[styles.chip, { backgroundColor: filterType === f.key ? colors.primary : colors.background, borderColor: filterType === f.key ? colors.primary : colors.border }]}
            >
              <Text style={[styles.chipText, { color: filterType === f.key ? '#fff' : colors.textSecondary }]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, gap: 8, marginTop: 6 }}>
          {DATE_FILTERS.map(f => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilterDate(f.key)}
              style={[styles.chip, { backgroundColor: filterDate === f.key ? colors.primary : colors.background, borderColor: filterDate === f.key ? colors.primary : colors.border }]}
            >
              <Text style={[styles.chipText, { color: filterDate === f.key ? '#fff' : colors.textSecondary }]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Barre de progression upload */}
      {isUploading && (
        <View style={[styles.progressContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
            Upload en cours… {uploadProgress}%
          </Text>
          <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
            <View style={[styles.progressBarFill, { width: `${uploadProgress}%` as any, backgroundColor: colors.primary }]} />
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={combinedData}
          keyExtractor={item => `${item._type}-${item.id}`}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          renderItem={({ item }) => {
            if (item._type === 'folder') return renderFolderItem(item as unknown as FolderItem);
            return renderFileItem(item as unknown as FileItem);
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name={searchQuery ? 'search-outline' : 'folder-open-outline'}
                size={64}
                color={colors.textTertiary}
              />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {searchQuery ? 'Aucun résultat' : 'Ce dossier est vide'}
              </Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => {
          Alert.alert('Action', 'Que souhaitez-vous faire ?', [
            { text: 'Nouveau dossier', onPress: () => setFolderModalVisible(true) },
            { text: 'Uploader un fichier', onPress: handleUploadFile },
            { text: 'Annuler', style: 'cancel' },
          ]);
        }}
        disabled={isUploading || actionLoading}
      >
        {(isUploading || actionLoading)
          ? <ActivityIndicator color="#fff" />
          : <Ionicons name="add" size={30} color="#fff" />
        }
      </TouchableOpacity>

      {/* Modal : Nouveau dossier */}
      <Modal visible={folderModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Nouveau dossier</Text>
            <TextInput
              style={[styles.modalInput, { borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Nom du dossier"
              placeholderTextColor={colors.textTertiary}
              value={newFolderName}
              onChangeText={setNewFolderName}
              autoFocus
              maxLength={255}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => { setFolderModalVisible(false); setNewFolderName(''); }} style={styles.modalButton}>
                <Text style={{ color: colors.textSecondary }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreateFolder} style={styles.modalButton} disabled={actionLoading}>
                {actionLoading
                  ? <ActivityIndicator color={colors.primary} size="small" />
                  : <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Créer</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal : Renommer */}
      <Modal visible={renameModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Renommer</Text>
            <TextInput
              style={[styles.modalInput, { borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Nouveau nom"
              placeholderTextColor={colors.textTertiary}
              value={renameNewName}
              onChangeText={setRenameNewName}
              autoFocus
              maxLength={255}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => { setRenameModalVisible(false); setRenameTarget(null); }} style={styles.modalButton}>
                <Text style={{ color: colors.textSecondary }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleRename} style={styles.modalButton} disabled={actionLoading}>
                {actionLoading
                  ? <ActivityIndicator color={colors.primary} size="small" />
                  : <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Renommer</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal : Déplacer */}
      <Modal visible={moveModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, maxHeight: '70%' }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Déplacer vers…</Text>
            <ScrollView>
              {/* Racine */}
              <TouchableOpacity
                style={[styles.folderPickerItem, { borderBottomColor: colors.border }]}
                onPress={() => handleMove(null)}
                disabled={actionLoading}
              >
                <Ionicons name="home-outline" size={20} color={colors.primary} style={{ marginRight: 12 }} />
                <Text style={[styles.folderPickerText, { color: colors.textPrimary }]}>Racine (Mes fichiers)</Text>
              </TouchableOpacity>
              {rootFolders.map(f => (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.folderPickerItem, { borderBottomColor: colors.border }]}
                  onPress={() => handleMove(f.id)}
                  disabled={actionLoading || (moveTarget?.type === 'folder' && moveTarget.id === f.id)}
                >
                  <Ionicons name="folder-outline" size={20} color={colors.primary} style={{ marginRight: 12 }} />
                  <Text style={[styles.folderPickerText, { color: colors.textPrimary }]}>{f.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {actionLoading && <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} />}
            <TouchableOpacity
              onPress={() => { setMoveModalVisible(false); setMoveTarget(null); }}
              style={[styles.modalButton, { alignSelf: 'flex-end', marginTop: 12 }]}
            >
              <Text style={{ color: colors.textSecondary }}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal : Partage */}
      <Modal visible={shareModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Créer un partage</Text>

            {/* Onglets Privé / Public */}
            <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.tab, !isPublicShare && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
                onPress={() => setIsPublicShare(false)}
              >
                <Text style={{ color: !isPublicShare ? colors.primary : colors.textSecondary, fontWeight: '600' }}>
                  Privé (email)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, isPublicShare && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
                onPress={() => setIsPublicShare(true)}
              >
                <Text style={{ color: isPublicShare ? colors.primary : colors.textSecondary, fontWeight: '600' }}>
                  Public (lien)
                </Text>
              </TouchableOpacity>
            </View>

            {shareLink ? (
              <View style={{ marginBottom: 16 }}>
                <Text style={[styles.modalHint, { color: '#34a853', fontWeight: 'bold' }]}>
                  Lien public créé !
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, padding: 10, borderRadius: 8 }}>
                  <Text style={{ flex: 1, color: colors.textPrimary, fontSize: 12 }} numberOfLines={1}>{shareLink}</Text>
                  <TouchableOpacity onPress={copyShareLink} style={{ padding: 4, marginLeft: 8 }}>
                    <Ionicons name="copy-outline" size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : isPublicShare ? (
              <>
                <Text style={[styles.modalHint, { color: colors.textSecondary }]}>
                  Un lien public sera généré. Vous pouvez le protéger par un mot de passe.
                </Text>
                <TextInput
                  style={[styles.modalInput, { borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder="Mot de passe (optionnel)"
                  placeholderTextColor={colors.textTertiary}
                  value={sharePassword}
                  onChangeText={setSharePassword}
                  secureTextEntry
                />
                <TextInput
                  style={[styles.modalInput, { borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder="Expiration (ex : 2026-12-31, optionnel)"
                  placeholderTextColor={colors.textTertiary}
                  value={shareExpiresAt}
                  onChangeText={setShareExpiresAt}
                />
              </>
            ) : (
              <>
                <TextInput
                  style={[styles.modalInput, { borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder="Email du destinataire"
                  placeholderTextColor={colors.textTertiary}
                  value={shareEmail}
                  onChangeText={setShareEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TextInput
                  style={[styles.modalInput, { borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder="Expiration (ex : 2026-12-31, optionnel)"
                  placeholderTextColor={colors.textTertiary}
                  value={shareExpiresAt}
                  onChangeText={setShareExpiresAt}
                />
              </>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setShareModalVisible(false)} style={styles.modalButton}>
                <Text style={{ color: colors.textSecondary }}>Fermer</Text>
              </TouchableOpacity>
              {!shareLink && (
                <TouchableOpacity onPress={handleCreateShare} style={styles.modalButton} disabled={actionLoading}>
                  {actionLoading
                    ? <ActivityIndicator color={colors.primary} size="small" />
                    : <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Partager</Text>
                  }
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal : Menu contextuel (cross-platform) */}
      <Modal visible={contextMenu.visible} transparent animationType="slide" onRequestClose={closeContextMenu}>
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={closeContextMenu}>
          <View style={[styles.menuSheet, { backgroundColor: colors.surface }]}>
            <Text style={[styles.menuSheetTitle, { color: colors.textPrimary, borderBottomColor: colors.border }]} numberOfLines={1}>
              {contextMenu.item?.name}
            </Text>
            {[
              { icon: 'pencil-outline',   label: 'Renommer',           onPress: () => { closeContextMenu(); if (contextMenu.item) openRenameModal(contextMenu.item.id, contextMenu.type, contextMenu.item.name); } },
              { icon: 'move-outline',     label: 'Déplacer',           onPress: () => { closeContextMenu(); if (contextMenu.item) openMoveModal(contextMenu.item.id, contextMenu.type); } },
              { icon: 'share-outline',    label: 'Partager',           onPress: () => { closeContextMenu(); if (contextMenu.item) openShareModal(contextMenu.item.id, contextMenu.type as 'file' | 'folder'); } },
              ...(contextMenu.type === 'folder' ? [{ icon: 'archive-outline', label: 'Télécharger (ZIP)', onPress: () => { closeContextMenu(); if (contextMenu.item) handleFolderDownload(contextMenu.item as FolderItem); } }] : []),
              { icon: 'trash-outline',    label: 'Supprimer',          onPress: () => { closeContextMenu(); if (contextMenu.item) confirmDelete(contextMenu.item.id, contextMenu.type, contextMenu.item.name); }, danger: true },
            ].map((action, i) => (
              <TouchableOpacity key={i} style={[styles.menuSheetItem, { borderBottomColor: colors.border }]} onPress={action.onPress}>
                <Ionicons name={action.icon as any} size={22} color={(action as any).danger ? colors.danger : colors.textPrimary} style={{ marginRight: 16 }} />
                <Text style={[styles.menuSheetItemText, { color: (action as any).danger ? colors.danger : colors.textPrimary }]}>{action.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[styles.menuSheetItem, { justifyContent: 'center' }]} onPress={closeContextMenu}>
              <Text style={[styles.menuSheetItemText, { color: colors.textSecondary }]}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal : Prévisualisation */}
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
            ) : previewFile?.mimeType === 'application/pdf' ? (
              // iOS: data URI base64 — WKWebView rend le PDF nativement sans besoin de file://
              <WebView
                source={{ uri: previewFile.uri }}
                style={{ width: '100%', height: '100%', flex: 1 }}
                startInLoadingState
                renderLoading={() => (
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                  </View>
                )}
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
  breadcrumbsContainer: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  breadcrumbItem: { flexDirection: 'row', alignItems: 'center' },
  breadcrumbText: {},
  searchContainer: { paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1 },
  searchInputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
  },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 2 },
  progressContainer: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  progressLabel: { fontSize: 13, marginBottom: 6 },
  progressBarBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
  itemContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1 },
  itemMain: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  iconContainer: { width: 44, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '500', marginBottom: 3 },
  itemMeta: { fontSize: 12 },
  fileActions: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { padding: 8 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { fontSize: 16, marginTop: 16 },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 60, height: 60, borderRadius: 30,
    justifyContent: 'center', alignItems: 'center',
    elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 4,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '88%', padding: 24, borderRadius: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  modalInput: { borderWidth: 1, borderRadius: 10, padding: 14, fontSize: 15, marginBottom: 16 },
  modalHint: { fontSize: 13, marginBottom: 12, lineHeight: 18 },
  tabRow: { flexDirection: 'row', marginBottom: 16, borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginTop: 4 },
  modalButton: { padding: 10 },
  folderPickerItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
  folderPickerText: { fontSize: 15 },
  previewOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' },
  previewHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 40, paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  previewTitle: { color: '#fff', fontSize: 18, fontWeight: '600', flex: 1, marginRight: 16 },
  previewContent: { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' },
  // Filtres
  filtersBar: { paddingVertical: 8, borderBottomWidth: 1 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '500' },
  // Menu contextuel bas de page
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  menuSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32 },
  menuSheetTitle: { fontSize: 15, fontWeight: '600', padding: 20, borderBottomWidth: 1 },
  menuSheetItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 0.5 },
  menuSheetItemText: { fontSize: 16 },
});
