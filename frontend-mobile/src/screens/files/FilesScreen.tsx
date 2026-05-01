import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Keyboard,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { filesApi } from "../../api/files";
import { useTheme } from "../../hooks/useTheme";
import { useFilesStore } from "../../store/filesStore";
import { Breadcrumb, FileItem, FolderItem } from "../../types";
import {
  formatDate,
  formatFileSize,
  getMimeIcon,
} from "../../utils/fileHelpers";

import React from "react";
import { useSyncStore } from "../../store/syncStore";
import FilePreviewModal from "../preview/FilePreviewScreen";
import TrashScreen from "../trash/TrashScreen";

import { getGlobalCache, setGlobalCache } from "../../store/filesStore";
import apiClient from "../../api/client";

import { Share } from "react-native";

const { width } = Dimensions.get("window");
const CARD_SIZE = (width - 48) / 3;

export default function FilesScreen() {
  const { colors, isDark } = useTheme();
  const { setCurrentFolderId: setStoreFolderId } = useFilesStore();

  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([
    { id: null, name: "Racine" },
  ]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [searchOpen, setSearchOpen] = useState(false);
  const [recentSearches] = useState(["Rapport", "Photos vacances", "Budget"]);
  const [activeTypeFilter, setActiveTypeFilter] = useState<string | null>(null);
  const [activeDateFilter, setActiveDateFilter] = useState<string | null>(null);
  const [showCustomDateModal, setShowCustomDateModal] = useState(false);
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [showPickerFrom, setShowPickerFrom] = useState(false);
  const [showPickerTo, setShowPickerTo] = useState(false);

  const [dateFromError, setDateFromError] = useState("");
  const [dateToError, setDateToError] = useState("");

  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);

  const [showTrash, setShowTrash] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const { lastUpdate } = useSyncStore();
  const { triggerRefresh } = useSyncStore();

  const [moveLoading, setMoveLoading] = useState(false);
  const [moveSuccess, setMoveSuccess] = useState<string | null>(null);

  const [shareType, setShareType] = useState<"public" | "private">("public");
  const [sharePassword, setSharePassword] = useState("");
  const [shareExpiry, setShareExpiry] = useState("");
  const [shareEmail, setShareEmail] = useState("");

  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareItem, setShareItem] = useState<{
    type: "file" | "folder";
    id: number;
    name: string;
  } | null>(null);
  const [downloadFile, setDownloadFile] = useState<FileItem | null>(null);

  // Modals
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renameValue, setRenameValue] = useState("");
  const [selectedItem, setSelectedItem] = useState<{
    type: "file" | "folder";
    id: number;
    name: string;
  } | null>(null);

  const typeFilters = [
    {
      label: "Images",
      value: "image/",
      icon: "image-outline",
      color: "#10b981",
    },
    {
      label: "PDF",
      value: "application/pdf",
      icon: "document-text-outline",
      color: "#ef4444",
    },
    {
      label: "Vidéos",
      value: "video/",
      icon: "videocam-outline",
      color: "#8b5cf6",
    },
    {
      label: "Audio",
      value: "audio/",
      icon: "musical-notes-outline",
      color: "#f59e0b",
    },
    {
      label: "Docs",
      value: "application/vnd",
      icon: "reader-outline",
      color: "#2563eb",
    },
    {
      label: "Texte",
      value: "text/",
      icon: "document-outline",
      color: "#64748b",
    },
  ];

  const dateFilters = [
    { label: "Aujourd'hui", value: "today" },
    { label: "Cette semaine", value: "week" },
    { label: "Ce mois", value: "month" },
    { label: "Cette année", value: "year" },
    { label: "Personnalisé", value: "custom" },
  ];

  // Animation recherche
  const searchAnim = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef<TextInput>(null);

  const openSearch = () => {
    setSearchOpen(true);
    Animated.spring(searchAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start(() => {
      searchInputRef.current?.focus();
    });
  };

  const closeSearch = () => {
    Keyboard.dismiss();
    setSearchQuery("");
    setActiveTypeFilter(null);
    setActiveDateFilter(null);
    setCustomDateFrom("");
    setCustomDateTo("");
    Animated.spring(searchAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start(() => setSearchOpen(false));
  };

  const formatDisplayDate = (dateStr: string): string => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const handleConfirmFrom = (date: Date) => {
    const formatted = date.toISOString().split("T")[0];
    setCustomDateFrom(formatted);
    setDateFromError("");
    setShowPickerFrom(false);
  };

  const handleConfirmTo = (date: Date) => {
    const formatted = date.toISOString().split("T")[0];
    setCustomDateTo(formatted);
    setDateToError("");
    setShowPickerTo(false);
  };

  const searchOverlayOpacity = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const searchBarTranslateY = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 0],
  });

  // Filtrage unifié
  const getFilteredResults = () => {
    let resultFiles = files;
    let resultFolders = folders;

    if (searchQuery.length > 0) {
      resultFiles = resultFiles.filter((f) =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      resultFolders = resultFolders.filter((f) =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    if (activeTypeFilter) {
      resultFiles = resultFiles.filter(
        (f) =>
          f.mimeType.startsWith(activeTypeFilter) ||
          f.mimeType.includes(activeTypeFilter),
      );
      resultFolders = [];
    }

    if (activeDateFilter) {
      const now = new Date();
      resultFiles = resultFiles.filter((f) => {
        const updated = new Date(f.updatedAt);
        switch (activeDateFilter) {
          case "today":
            return updated.toDateString() === now.toDateString();
          case "week":
            const weekAgo = new Date(now);
            weekAgo.setDate(now.getDate() - 7);
            return updated >= weekAgo;
          case "month":
            return (
              updated.getMonth() === now.getMonth() &&
              updated.getFullYear() === now.getFullYear()
            );
          case "year":
            return updated.getFullYear() === now.getFullYear();
          case "custom":
            if (!customDateFrom && !customDateTo) return true;
            const from = customDateFrom ? new Date(customDateFrom) : null;
            const to = customDateTo
              ? new Date(customDateTo + "T23:59:59")
              : null;
            if (from && updated < from) return false;
            if (to && updated > to) return false;
            return true;
          default:
            return true;
        }
      });
    }

    return { resultFiles, resultFolders };
  };

  const { resultFiles, resultFolders } = getFilteredResults();

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(currentFolderId ?? undefined);
    setRefreshing(false);
  };

  const isNavigating = useRef(false);
  const loadAbortController = useRef<AbortController | null>(null);

  const loadData = async (folderId?: number) => {
    const cacheKey = String(folderId ?? "root");
    const callId = Date.now();

    const gc = getGlobalCache();
    if (gc[cacheKey]) {
      // Cache disponible — affiche immédiatement SANS loading
      setFiles(gc[cacheKey].files);
      setFolders(gc[cacheKey].folders);
      setLoading(false);
    } else {
      // Pas de cache — affiche le loading
      setLoading(true);
      setFiles([]);
      setFolders([]);
    }

    try {
      const [filesData, foldersData] = await Promise.all([
        filesApi.getFiles(folderId),
        filesApi.getFolders(folderId),
      ]);

      if (currentFolderIdRef.current !== (folderId ?? null)) {
        console.log(`[${callId}] IGNORED — folder changed`);
        return;
      }

      const newFiles = filesData.files ?? [];
      const newFolders = Array.isArray(foldersData) ? foldersData : [];

      setGlobalCache(cacheKey, { files: newFiles, folders: newFolders });
      setFiles(newFiles);
      setFolders(newFolders);
      setLoading(false);
    } catch (err: any) {
      console.log(`[${callId}] ERROR:`, err.message);
      setLoading(false);
    }
  };

  const handleFolderPress = (folder: FolderItem) => {
    if (isNavigating.current) {
      console.log("BLOCKED double tap");
      return;
    }
    isNavigating.current = true;
    currentFolderIdRef.current = folder.id;
    setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }]);
    setCurrentFolderId(folder.id);
    setStoreFolderId(folder.id);

    setFiles([]);
    setFolders([]);

    const cacheKey = String(folder.id);
    const gc = getGlobalCache();
    if (gc[cacheKey]) {
      setFiles(gc[cacheKey].files);
      setFolders(gc[cacheKey].folders);
    }

    loadData(folder.id);

    // ← Débloque immédiatement après avoir lancé le chargement
    setTimeout(() => {
      isNavigating.current = false;
    }, 500);
  };

  const handleBreadcrumbPress = (crumb: Breadcrumb, index: number) => {
    if (isNavigating.current) return;
    isNavigating.current = true;
    currentFolderIdRef.current = crumb.id;
    setBreadcrumbs((prev) => prev.slice(0, index + 1));
    const folderId = crumb.id ?? undefined;
    setCurrentFolderId(crumb.id);
    setStoreFolderId(crumb.id);

    setFiles([]);
    setFolders([]);

    const cacheKey = String(crumb.id ?? "root");
    const gc = getGlobalCache();
    if (gc[cacheKey]) {
      setFiles(gc[cacheKey].files);
      setFolders(gc[cacheKey].folders);
    }

    loadData(folderId);

    // ← Débloque immédiatement
    setTimeout(() => {
      isNavigating.current = false;
    }, 500);
  };

  const hasLoaded = useRef(false);
  const currentFolderIdRef = useRef<number | null>(null);

  // Sync ref avec state
  useEffect(() => {
    currentFolderIdRef.current = currentFolderId;
  }, [currentFolderId]);

  // Chargement initial
  useEffect(() => {
    console.log("=== INITIAL LOAD ===");
    hasLoaded.current = true;
    loadData();
  }, []);

  // Refresh sur sync — utilise le ref pour avoir la bonne valeur
  useEffect(() => {
    if (!hasLoaded.current) return;
    console.log("=== SYNC REFRESH === folderId:", currentFolderIdRef.current);
    const silentRefresh = async () => {
      try {
        const folderId = currentFolderIdRef.current ?? undefined;
        const [filesData, foldersData] = await Promise.all([
          filesApi.getFiles(folderId),
          filesApi.getFolders(folderId),
        ]);
        console.log(
          "Sync result — files:",
          filesData.files?.length,
          "folders:",
          foldersData?.length,
        );
        setFiles(filesData.files ?? []);
        setFolders(Array.isArray(foldersData) ? foldersData : []);
      } catch (err: any) {
        console.log("Sync error:", err.message);
      }
    };
    silentRefresh();
  }, [lastUpdate]);

  const handleLongPress = (
    type: "file" | "folder",
    id: number,
    name: string,
  ) => {
    setSelectedItem({ type, id, name });
    setShowActionModal(true);
  };

  const handleDelete = () => {
    setShowActionModal(false);
    Alert.alert("Supprimer", `Supprimer "${selectedItem?.name ?? ""}" ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          // ← Mise à jour immédiate de l'UI
          if (selectedItem?.type === "file") {
            setFiles((prev) => prev.filter((f) => f.id !== selectedItem.id));
          } else {
            setFolders((prev) => prev.filter((f) => f.id !== selectedItem!.id));
          }
          // ← API en arrière-plan
          try {
            if (selectedItem?.type === "file") {
              await filesApi.deleteFile(selectedItem.id);
            } else {
              await filesApi.deleteFolder(selectedItem!.id);
            }
            triggerRefresh();
          } catch {
            // Rollback si erreur
            Alert.alert("Erreur", "Impossible de supprimer");
            loadData(currentFolderId ?? undefined);
          }
        },
      },
    ]);
  };
  const confirmRename = async () => {
    if (!renameValue.trim() || !selectedItem) return;
    // ← Mise à jour immédiate de l'UI
    if (selectedItem.type === "file") {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === selectedItem.id ? { ...f, name: renameValue } : f,
        ),
      );
    } else {
      setFolders((prev) =>
        prev.map((f) =>
          f.id === selectedItem.id ? { ...f, name: renameValue } : f,
        ),
      );
    }
    setShowRenameModal(false);
    // ← API en arrière-plan
    try {
      if (selectedItem.type === "file") {
        await filesApi.renameFile(selectedItem.id, renameValue);
      } else {
        await filesApi.renameFolder(selectedItem.id, renameValue);
      }
      triggerRefresh();
    } catch {
      Alert.alert("Erreur", "Impossible de renommer");
      loadData(currentFolderId ?? undefined);
    }
  };

  const confirmNewFolder = async () => {
    if (!newFolderName.trim()) return;
    // ← Ferme le modal immédiatement
    const tempFolder: FolderItem = {
      id: Date.now(), // ID temporaire
      name: newFolderName,
      createdAt: new Date().toISOString(),
      parent: null,
      isShared: false,
    };
    setFolders((prev) => [tempFolder, ...prev]);
    setNewFolderName("");
    setShowNewFolderModal(false);
    // ← API en arrière-plan
    try {
      const folder = await filesApi.createFolder(
        tempFolder.name,
        currentFolderId ?? undefined,
      );
      // Remplace le dossier temporaire par le vrai
      setFolders((prev) =>
        prev.map((f) => (f.id === tempFolder.id ? folder : f)),
      );
      triggerRefresh();
    } catch {
      Alert.alert("Erreur", "Impossible de créer le dossier");
      setFolders((prev) => prev.filter((f) => f.id !== tempFolder.id));
    }
  };

  const formatDateInput = (
    text: string,
    currentValue: string,
    setter: (val: string) => void,
    setError: (msg: string) => void,
  ) => {
    const numbers = text.replace(/\D/g, "");
    const currentNumbers = currentValue.replace(/\D/g, "");

    // Si on efface, on laisse faire sans validation
    if (numbers.length < currentNumbers.length) {
      let result = numbers.slice(0, 4);
      if (numbers.length > 4) result += `-${numbers.slice(4, 6)}`;
      if (numbers.length > 6) result += `-${numbers.slice(6, 8)}`;
      setter(result);
      setError("");
      return;
    }

    const newDigit = numbers[numbers.length - 1];
    const position = numbers.length; // position du nouveau chiffre (1-based)

    // ── Validation caractère par caractère ──

    // Mois : positions 5 et 6
    if (position === 5) {
      // Premier chiffre du mois : max 1
      if (parseInt(newDigit) > 1) {
        setError(
          `Mois invalide — le premier chiffre ne peut pas être ${newDigit}`,
        );
        return; // bloque l'écriture
      }
      setError("");
    }

    if (position === 6) {
      const month = parseInt(numbers.slice(4, 6));
      if (month < 1 || month > 12) {
        setError(`Le mois doit être entre 01 et 12`);
        return; // bloque
      }
      setError("");
    }

    // Jour : positions 7 et 8
    if (position === 7) {
      const month = parseInt(numbers.slice(4, 6));
      const daysInMonth = new Date(
        parseInt(numbers.slice(0, 4)),
        month,
        0,
      ).getDate();
      const maxFirstDigit = Math.floor(daysInMonth / 10);

      if (parseInt(newDigit) > maxFirstDigit) {
        setError(`Jour invalide pour ce mois — max ${daysInMonth} jours`);
        return;
      }
      setError("");
    }

    if (position === 8) {
      const year = parseInt(numbers.slice(0, 4));
      const month = parseInt(numbers.slice(4, 6));
      const day = parseInt(numbers.slice(6, 8));
      const daysInMonth = new Date(year, month, 0).getDate();

      if (day < 1 || day > daysInMonth) {
        setError(
          `Le mois ${String(month).padStart(2, "0")} a ${daysInMonth} jours maximum`,
        );
        return;
      }
      setError("");
    }

    // Assemblage
    let result = numbers.slice(0, 4);
    if (numbers.length > 4) result += `-${numbers.slice(4, 6)}`;
    if (numbers.length > 6) result += `-${numbers.slice(6, 8)}`;
    setter(result);
  };

  const validateDate = (
    dateStr: string,
    setError: (msg: string) => void,
  ): boolean => {
    if (dateStr.length < 10) {
      setError("");
      return false;
    }

    const [yearStr, monthStr, dayStr] = dateStr.split("-");
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);
    const day = parseInt(dayStr);

    if (month < 1 || month > 12) {
      setError("Le mois doit être entre 01 et 12");
      return false;
    }

    const daysInMonth = new Date(year, month, 0).getDate();
    if (day < 1 || day > daysInMonth) {
      setError(`Le mois ${monthStr} a ${daysInMonth} jours maximum`);
      return false;
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      setError("Date invalide");
      return false;
    }

    setError("");
    return true;
  };

  // ── Folder grid ──────────────────────────────────────────
  const renderFolderGrid = ({ item }: { item: FolderItem }) => (
    <TouchableOpacity
      style={[
        styles.folderCardGrid,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          width: CARD_SIZE,
        },
      ]}
      onPress={() => handleFolderPress(item)}
      onLongPress={() => handleLongPress("folder", item.id, item.name)}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.folderIconBg,
          {
            backgroundColor: item.isShared
              ? colors.purpleLight
              : colors.primaryLight,
          },
        ]}
      >
        <FontAwesome
          name="folder"
          size={26}
          color={item.isShared ? colors.purple : colors.primary}
        />
        {item.isShared && (
          <View style={[styles.sharedDot, { backgroundColor: colors.purple }]}>
            <FontAwesome name="share-alt" size={7} color="#fff" />
          </View>
        )}
      </View>
      <Text
        style={[styles.folderCardName, { color: colors.text }]}
        numberOfLines={2}
      >
        {item.name}
      </Text>
      {item.isShared && item.sharedBy && (
        <Text
          style={[styles.sharedByLabel, { color: colors.purple }]}
          numberOfLines={1}
        >
          {item.sharedBy.fullName}
        </Text>
      )}
    </TouchableOpacity>
  );

  // ── Folder list ──────────────────────────────────────────
  const renderFolderList = ({ item }: { item: FolderItem }) => (
    <TouchableOpacity
      style={[
        styles.folderRowList,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
      onPress={() => handleFolderPress(item)}
      onLongPress={() => handleLongPress("folder", item.id, item.name)}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.folderIconBgSmall,
          {
            backgroundColor: item.isShared
              ? colors.purpleLight
              : colors.primaryLight,
          },
        ]}
      >
        <FontAwesome
          name="folder"
          size={20}
          color={item.isShared ? colors.purple : colors.primary}
        />
      </View>
      <View style={styles.folderRowInfo}>
        <Text
          style={[styles.folderRowName, { color: colors.text }]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        {item.isShared && item.sharedBy && (
          <Text style={[styles.sharedByLabel, { color: colors.purple }]}>
            Partagé par {item.sharedBy.fullName}
          </Text>
        )}
      </View>
      <FontAwesome name="chevron-right" size={12} color={colors.textTertiary} />
    </TouchableOpacity>
  );

  // ── File list ────────────────────────────────────────────
  const renderFileList = ({ item }: { item: FileItem }) => {
    const { icon, color } = getMimeIcon(item.mimeType);
    return (
      <TouchableOpacity
        style={[
          styles.fileRowList,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
        onPress={() => setPreviewFile(item)}
        onLongPress={() => handleLongPress("file", item.id, item.name)}
        activeOpacity={0.7}
      >
        <View style={[styles.fileIconBox, { backgroundColor: color + "20" }]}>
          <FontAwesome name={icon as any} size={20} color={color} />
        </View>
        <View style={styles.fileRowInfo}>
          <Text
            style={[styles.fileRowName, { color: colors.text }]}
            numberOfLines={1}
          >
            {decodeURIComponent(item.name)}
          </Text>
          <Text style={[styles.fileRowMeta, { color: colors.textTertiary }]}>
            {formatFileSize(item.size)} · {formatDate(item.updatedAt)}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => handleLongPress("file", item.id, item.name)}
          style={styles.moreBtn}
        >
          <FontAwesome
            name="ellipsis-v"
            size={15}
            color={colors.textTertiary}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // ── File grid ────────────────────────────────────────────
  const renderFileGrid = ({ item }: { item: FileItem }) => {
    const { icon, color } = getMimeIcon(item.mimeType);
    return (
      <TouchableOpacity
        style={[
          styles.fileCardGrid,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            width: CARD_SIZE,
          },
        ]}
        onPress={() => setPreviewFile(item)}
        onLongPress={() => handleLongPress("file", item.id, item.name)}
        activeOpacity={0.7}
      >
        <View
          style={[styles.fileCardIconBox, { backgroundColor: color + "20" }]}
        >
          <FontAwesome name={icon as any} size={28} color={color} />
        </View>
        <Text
          style={[styles.fileCardName, { color: colors.text }]}
          numberOfLines={2}
        >
          {decodeURIComponent(item.name)}
        </Text>
        <Text style={[styles.fileCardMeta, { color: colors.textTertiary }]}>
          {formatFileSize(item.size)}
        </Text>
      </TouchableOpacity>
    );
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
        <View style={styles.headerTop}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Mon Drive
          </Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[
                styles.searchIconBtn,
                { backgroundColor: colors.surfaceSecondary },
              ]}
              onPress={() => setShowTrash(true)}
            >
              <Ionicons name="trash-outline" size={20} color={colors.icon} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.searchIconBtn,
                { backgroundColor: colors.surfaceSecondary },
              ]}
              onPress={openSearch}
            >
              <Ionicons name="search-outline" size={20} color={colors.icon} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── Breadcrumb bar + actions ── */}
      <View
        style={[
          styles.breadcrumbBar,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.breadcrumbLeft}>
          <Ionicons
            name="home-outline"
            size={12}
            color={colors.textTertiary}
            style={{ marginRight: 6 }}
          />
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              <TouchableOpacity
                onPress={() => handleBreadcrumbPress(crumb, index)}
              >
                <Text
                  style={[
                    styles.breadcrumbText,
                    {
                      color:
                        index === breadcrumbs.length - 1
                          ? colors.primary
                          : colors.textTertiary,
                      fontWeight:
                        index === breadcrumbs.length - 1 ? "700" : "400",
                    },
                  ]}
                >
                  {crumb.name}
                </Text>
              </TouchableOpacity>
              {index < breadcrumbs.length - 1 && (
                <Ionicons
                  name="chevron-forward"
                  size={10}
                  color={colors.textTertiary}
                  style={{ marginHorizontal: 4 }}
                />
              )}
            </React.Fragment>
          ))}
        </View>
        <View style={styles.breadcrumbActions}>
          <TouchableOpacity
            style={[
              styles.smallBtn,
              { backgroundColor: colors.surfaceSecondary },
            ]}
            onPress={() => setViewMode((v) => (v === "list" ? "grid" : "list"))}
          >
            <Ionicons
              name={viewMode === "list" ? "grid-outline" : "list-outline"}
              size={15}
              color={colors.icon}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.smallBtn, { backgroundColor: colors.primary }]}
            onPress={() => setShowNewFolderModal(true)}
          >
            <Ionicons name="folder-open-outline" size={15} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Loading bar ── */}
      {loading && (
        <View
          style={[styles.loadingBar, { backgroundColor: colors.primaryLight }]}
        >
          <View
            style={[styles.loadingBarFill, { backgroundColor: colors.primary }]}
          />
        </View>
      )}

      {/* ── Contenu principal ── */}
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
            {/* Dossiers */}
            {resultFolders.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    DOSSIERS
                  </Text>
                  <Text
                    style={[
                      styles.sectionCount,
                      { color: colors.textTertiary },
                    ]}
                  >
                    {resultFolders.length}
                  </Text>
                </View>
                {viewMode === "grid" ? (
                  <FlatList
                    data={resultFolders}
                    renderItem={renderFolderGrid}
                    keyExtractor={(item) => `fg-${item.id}`}
                    numColumns={3}
                    scrollEnabled={false}
                    columnWrapperStyle={{ gap: 8, marginBottom: 8 }}
                  />
                ) : (
                  resultFolders.map((item) => (
                    <View key={`fl-${item.id}`}>
                      {renderFolderList({ item })}
                    </View>
                  ))
                )}
              </View>
            )}

            {/* Fichiers */}
            {resultFiles.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    FICHIERS
                  </Text>
                  <Text
                    style={[
                      styles.sectionCount,
                      { color: colors.textTertiary },
                    ]}
                  >
                    {resultFiles.length}
                  </Text>
                </View>
                {viewMode === "grid" ? (
                  <FlatList
                    data={resultFiles}
                    renderItem={renderFileGrid}
                    keyExtractor={(item) => `fg-${item.id}`}
                    numColumns={3}
                    scrollEnabled={false}
                    columnWrapperStyle={{ gap: 8, marginBottom: 8 }}
                  />
                ) : (
                  resultFiles.map((item) => (
                    <View key={`fl-${item.id}`}>
                      {renderFileList({ item })}
                    </View>
                  ))
                )}
              </View>
            )}

            {/* Loading */}
            {loading && (
              <View style={[styles.emptyState]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text
                  style={[
                    styles.emptyTitle,
                    { color: colors.textSecondary, marginTop: 16 },
                  ]}
                >
                  Chargement...
                </Text>
              </View>
            )}

            {/* Vide — seulement si pas de loading */}
            {!loading &&
              resultFiles.length === 0 &&
              resultFolders.length === 0 && (
                <View style={styles.emptyState}>
                  <View
                    style={[
                      styles.emptyIconBox,
                      { backgroundColor: colors.surfaceSecondary },
                    ]}
                  >
                    <Ionicons
                      name="folder-open-outline"
                      size={48}
                      color={colors.textTertiary}
                    />
                  </View>
                  <Text
                    style={[styles.emptyTitle, { color: colors.textSecondary }]}
                  >
                    Dossier vide
                  </Text>
                  <Text
                    style={[styles.emptySub, { color: colors.textTertiary }]}
                  >
                    Uploadez des fichiers ou créez un dossier
                  </Text>
                </View>
              )}
          </>
        }
      />

      {/* ── Search Overlay ── */}
      {searchOpen && (
        <Animated.View
          style={[
            styles.searchOverlay,
            {
              backgroundColor: colors.background,
              opacity: searchOverlayOpacity,
            },
          ]}
        >
          {/* Header animé */}
          <Animated.View
            style={[
              styles.searchOverlayHeader,
              {
                backgroundColor: colors.header,
                borderBottomColor: colors.border,
                transform: [{ translateY: searchBarTranslateY }],
              },
            ]}
          >
            <View
              style={[
                styles.searchBarExpanded,
                {
                  backgroundColor: colors.surfaceSecondary,
                  borderColor: colors.borderFocus,
                },
              ]}
            >
              <Ionicons
                name="search-outline"
                size={18}
                color={colors.primary}
                style={{ marginRight: 10 }}
              />
              <TextInput
                ref={searchInputRef}
                style={[styles.searchInputExpanded, { color: colors.text }]}
                placeholder="Rechercher fichiers, dossiers..."
                placeholderTextColor={colors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={colors.textTertiary}
                  />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity onPress={closeSearch} style={styles.cancelBtn}>
              <Text style={[styles.cancelText, { color: colors.primary }]}>
                Annuler
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Contenu scrollable */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.searchContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Chips type */}
            <Text
              style={[styles.suggestTitle, { color: colors.textSecondary }]}
            >
              TYPE DE FICHIER
            </Text>
            <View style={styles.chipsRow}>
              {typeFilters.map((filter) => (
                <TouchableOpacity
                  key={filter.value}
                  style={[
                    styles.chip,
                    {
                      backgroundColor:
                        activeTypeFilter === filter.value
                          ? colors.primary
                          : colors.surfaceSecondary,
                      borderColor:
                        activeTypeFilter === filter.value
                          ? colors.primary
                          : colors.border,
                    },
                  ]}
                  onPress={() =>
                    setActiveTypeFilter(
                      activeTypeFilter === filter.value ? null : filter.value,
                    )
                  }
                >
                  <Ionicons
                    name={filter.icon as any}
                    size={13}
                    color={
                      activeTypeFilter === filter.value ? "#fff" : filter.color
                    }
                    style={{ marginRight: 5 }}
                  />
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color:
                          activeTypeFilter === filter.value
                            ? "#fff"
                            : colors.text,
                      },
                    ]}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Chips date */}
            <Text
              style={[
                styles.suggestTitle,
                { color: colors.textSecondary, marginTop: 20 },
              ]}
            >
              DATE DE MODIFICATION
            </Text>
            <View style={styles.chipsRow}>
              {dateFilters.map((filter) => (
                <TouchableOpacity
                  key={filter.value}
                  style={[
                    styles.chip,
                    {
                      backgroundColor:
                        activeDateFilter === filter.value
                          ? colors.primary
                          : colors.surfaceSecondary,
                      borderColor:
                        activeDateFilter === filter.value
                          ? colors.primary
                          : colors.border,
                    },
                  ]}
                  onPress={() => {
                    if (filter.value === "custom") {
                      setActiveDateFilter("custom");
                      setShowCustomDateModal(true);
                    } else {
                      setActiveDateFilter(
                        activeDateFilter === filter.value ? null : filter.value,
                      );
                    }
                  }}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={13}
                    color={
                      activeDateFilter === filter.value
                        ? "#fff"
                        : colors.textSecondary
                    }
                    style={{ marginRight: 5 }}
                  />
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color:
                          activeDateFilter === filter.value
                            ? "#fff"
                            : colors.text,
                      },
                    ]}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Résultats ou suggestions */}
            {searchQuery.length === 0 &&
            !activeTypeFilter &&
            !activeDateFilter ? (
              <View style={{ marginTop: 24 }}>
                {/* Recherches récentes */}
                <Text
                  style={[styles.suggestTitle, { color: colors.textSecondary }]}
                >
                  RECHERCHES RÉCENTES
                </Text>
                {recentSearches.map((s, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.suggestItem,
                      { borderBottomColor: colors.border },
                    ]}
                    onPress={() => setSearchQuery(s)}
                  >
                    <View
                      style={[
                        styles.suggestIcon,
                        { backgroundColor: colors.surfaceSecondary },
                      ]}
                    >
                      <Ionicons
                        name="time-outline"
                        size={16}
                        color={colors.textTertiary}
                      />
                    </View>
                    <Text style={[styles.suggestText, { color: colors.text }]}>
                      {s}
                    </Text>
                    <Ionicons
                      name="arrow-back-outline"
                      size={14}
                      color={colors.textTertiary}
                    />
                  </TouchableOpacity>
                ))}

                {/* Fichiers récents */}
                <Text
                  style={[
                    styles.suggestTitle,
                    { color: colors.textSecondary, marginTop: 24 },
                  ]}
                >
                  FICHIERS RÉCENTS
                </Text>
                {files.slice(0, 3).map((file) => {
                  const { icon, color } = getMimeIcon(file.mimeType);
                  return (
                    <TouchableOpacity
                      key={file.id}
                      style={[
                        styles.suggestItem,
                        { borderBottomColor: colors.border },
                      ]}
                      onPress={() => setSearchQuery(file.name)}
                    >
                      <View
                        style={[
                          styles.suggestIcon,
                          { backgroundColor: color + "20" },
                        ]}
                      >
                        <FontAwesome
                          name={icon as any}
                          size={15}
                          color={color}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[styles.suggestText, { color: colors.text }]}
                          numberOfLines={1}
                        >
                          {file.name}
                        </Text>
                        <Text
                          style={[
                            styles.suggestMeta,
                            { color: colors.textTertiary },
                          ]}
                        >
                          {formatFileSize(file.size)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={{ marginTop: 24 }}>
                {/* Badge résultats + effacer */}
                {(activeTypeFilter || activeDateFilter) && (
                  <View style={styles.activeFiltersRow}>
                    <Text
                      style={[
                        styles.activeFiltersText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {resultFiles.length} résultat
                      {resultFiles.length > 1 ? "s" : ""}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setActiveTypeFilter(null);
                        setActiveDateFilter(null);
                        setCustomDateFrom("");
                        setCustomDateTo("");
                      }}
                    >
                      <Text
                        style={[styles.clearFilters, { color: colors.primary }]}
                      >
                        Effacer les filtres
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Aperçu plage custom active */}
                {activeDateFilter === "custom" &&
                  (customDateFrom || customDateTo) && (
                    <TouchableOpacity
                      style={[
                        styles.datePreview,
                        { backgroundColor: colors.primaryLight },
                      ]}
                      onPress={() => setShowCustomDateModal(true)}
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={14}
                        color={colors.primary}
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={[
                          styles.datePreviewText,
                          { color: colors.primary },
                        ]}
                      >
                        {customDateFrom || "..."} → {customDateTo || "..."}
                      </Text>
                      <Ionicons
                        name="pencil-outline"
                        size={13}
                        color={colors.primary}
                        style={{ marginLeft: 8 }}
                      />
                    </TouchableOpacity>
                  )}

                {/* Dossiers résultats */}
                {resultFolders.length > 0 && (
                  <>
                    <Text
                      style={[
                        styles.suggestTitle,
                        { color: colors.textSecondary },
                      ]}
                    >
                      DOSSIERS
                    </Text>
                    {resultFolders.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.suggestItem,
                          { borderBottomColor: colors.border },
                        ]}
                        onPress={() => {
                          closeSearch();
                          handleFolderPress(item);
                        }}
                      >
                        <View
                          style={[
                            styles.suggestIcon,
                            { backgroundColor: colors.primaryLight },
                          ]}
                        >
                          <FontAwesome
                            name="folder"
                            size={15}
                            color={colors.primary}
                          />
                        </View>
                        <Text
                          style={[styles.suggestText, { color: colors.text }]}
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                        <Ionicons
                          name="chevron-forward"
                          size={14}
                          color={colors.textTertiary}
                        />
                      </TouchableOpacity>
                    ))}
                  </>
                )}

                {/* Fichiers résultats */}
                {resultFiles.length > 0 && (
                  <>
                    <Text
                      style={[
                        styles.suggestTitle,
                        {
                          color: colors.textSecondary,
                          marginTop: resultFolders.length > 0 ? 20 : 0,
                        },
                      ]}
                    >
                      FICHIERS
                    </Text>
                    {resultFiles.map((item) => {
                      const { icon, color } = getMimeIcon(item.mimeType);
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[
                            styles.suggestItem,
                            { borderBottomColor: colors.border },
                          ]}
                          onPress={() => {
                            closeSearch();
                            Alert.alert("Aperçu", item.name);
                          }}
                        >
                          <View
                            style={[
                              styles.suggestIcon,
                              { backgroundColor: color + "20" },
                            ]}
                          >
                            <FontAwesome
                              name={icon as any}
                              size={15}
                              color={color}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                styles.suggestText,
                                { color: colors.text },
                              ]}
                              numberOfLines={1}
                            >
                              {item.name}
                            </Text>
                            <Text
                              style={[
                                styles.suggestMeta,
                                { color: colors.textTertiary },
                              ]}
                            >
                              {formatFileSize(item.size)} ·{" "}
                              {formatDate(item.updatedAt)}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </>
                )}

                {/* Aucun résultat */}
                {resultFiles.length === 0 && resultFolders.length === 0 && (
                  <View style={styles.searchEmpty}>
                    <View
                      style={[
                        styles.searchEmptyIcon,
                        { backgroundColor: colors.surfaceSecondary },
                      ]}
                    >
                      <Ionicons
                        name="search-outline"
                        size={36}
                        color={colors.textTertiary}
                      />
                    </View>
                    <Text
                      style={[
                        styles.searchEmptyText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Aucun résultat
                    </Text>
                    <Text
                      style={[
                        styles.searchEmptySub,
                        { color: colors.textTertiary },
                      ]}
                    >
                      Essaie d'autres termes ou filtres
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </Animated.View>
      )}

      {/* ── Modal nouveau dossier ── */}
      <Modal visible={showNewFolderModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Nouveau dossier
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowNewFolderModal(false);
                  setNewFolderName("");
                }}
              >
                <Ionicons name="close" size={22} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.surfaceSecondary,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Nom du dossier"
              placeholderTextColor={colors.textTertiary}
              value={newFolderName}
              onChangeText={setNewFolderName}
              autoFocus
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                onPress={() => {
                  setShowNewFolderModal(false);
                  setNewFolderName("");
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
                ]}
                onPress={confirmNewFolder}
              >
                <Text style={styles.modalConfirmText}>Créer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal renommer ── */}
      <Modal visible={showRenameModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Renommer
              </Text>
              <TouchableOpacity onPress={() => setShowRenameModal(false)}>
                <Ionicons name="close" size={22} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.surfaceSecondary,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={renameValue}
              onChangeText={setRenameValue}
              autoFocus
              selectTextOnFocus
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                onPress={() => setShowRenameModal(false)}
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
                ]}
                onPress={confirmRename}
              >
                <Text style={styles.modalConfirmText}>Renommer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal date personnalisée ── */}
      <Modal visible={showCustomDateModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Période personnalisée
              </Text>
              <TouchableOpacity onPress={() => setShowCustomDateModal(false)}>
                <Ionicons name="close" size={22} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.dateInfo, { color: colors.textTertiary }]}>
              Sélectionne une plage de dates pour filtrer les fichiers modifiés
              dans cette période.
            </Text>

            {/* Date début */}
            <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>
              DATE DE DÉBUT
            </Text>
            <View style={styles.dateInputRow}>
              <TextInput
                style={[
                  styles.dateTextInput,
                  {
                    backgroundColor: colors.surfaceSecondary,
                    color: colors.text,
                    borderColor: dateFromError
                      ? colors.danger
                      : customDateFrom.length === 10
                        ? colors.primary
                        : colors.border,
                  },
                ]}
                placeholder="AAAA-MM-JJ"
                placeholderTextColor={colors.textTertiary}
                value={customDateFrom}
                onChangeText={(text) =>
                  formatDateInput(
                    text,
                    customDateFrom,
                    setCustomDateFrom,
                    setDateFromError,
                  )
                }
                keyboardType="numeric"
                maxLength={10}
              />
              <TouchableOpacity
                style={[
                  styles.calendarBtn,
                  { backgroundColor: colors.primaryLight },
                ]}
                onPress={() => setShowPickerFrom(true)}
              >
                <Ionicons name="calendar" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Badge date début — UN SEUL bloc */}
            {dateFromError ? (
              <View
                style={[
                  styles.dateSelectedBadge,
                  { backgroundColor: colors.dangerLight },
                ]}
              >
                <Ionicons
                  name="close-circle"
                  size={14}
                  color={colors.danger}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[styles.dateSelectedText, { color: colors.danger }]}
                >
                  {dateFromError}
                </Text>
              </View>
            ) : customDateFrom.length === 10 ? (
              <View
                style={[
                  styles.dateSelectedBadge,
                  { backgroundColor: colors.primaryLight },
                ]}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color={colors.primary}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[styles.dateSelectedText, { color: colors.primary }]}
                >
                  {formatDisplayDate(customDateFrom)}
                </Text>
              </View>
            ) : null}

            {/* Date fin */}
            <Text
              style={[
                styles.dateLabel,
                { color: colors.textSecondary, marginTop: 16 },
              ]}
            >
              DATE DE FIN
            </Text>
            <View style={styles.dateInputRow}>
              <TextInput
                style={[
                  styles.dateTextInput,
                  {
                    backgroundColor: colors.surfaceSecondary,
                    color: colors.text,
                    borderColor: dateToError
                      ? colors.danger
                      : customDateTo.length === 10
                        ? colors.primary
                        : colors.border,
                  },
                ]}
                placeholder="AAAA-MM-JJ"
                placeholderTextColor={colors.textTertiary}
                value={customDateTo}
                onChangeText={(text) =>
                  formatDateInput(
                    text,
                    customDateTo,
                    setCustomDateTo,
                    setDateToError,
                  )
                }
                keyboardType="numeric"
                maxLength={10}
              />
              <TouchableOpacity
                style={[
                  styles.calendarBtn,
                  { backgroundColor: colors.primaryLight },
                ]}
                onPress={() => setShowPickerTo(true)}
              >
                <Ionicons name="calendar" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Badge date fin — UN SEUL bloc */}
            {dateToError ? (
              <View
                style={[
                  styles.dateSelectedBadge,
                  { backgroundColor: colors.dangerLight },
                ]}
              >
                <Ionicons
                  name="close-circle"
                  size={14}
                  color={colors.danger}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[styles.dateSelectedText, { color: colors.danger }]}
                >
                  {dateToError}
                </Text>
              </View>
            ) : customDateTo.length === 10 ? (
              <View
                style={[
                  styles.dateSelectedBadge,
                  { backgroundColor: colors.primaryLight },
                ]}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color={colors.primary}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[styles.dateSelectedText, { color: colors.primary }]}
                >
                  {formatDisplayDate(customDateTo)}
                </Text>
              </View>
            ) : null}

            {/* Aperçu plage complète */}
            {customDateFrom.length === 10 &&
              customDateTo.length === 10 &&
              !dateFromError &&
              !dateToError && (
                <View
                  style={[
                    styles.dateRangePreview,
                    {
                      backgroundColor: colors.successLight,
                      borderColor: colors.success,
                    },
                  ]}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={15}
                    color={colors.success}
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={[styles.dateRangeText, { color: colors.success }]}
                  >
                    {formatDisplayDate(customDateFrom)} →{" "}
                    {formatDisplayDate(customDateTo)}
                  </Text>
                </View>
              )}

            <View style={[styles.modalBtns, { marginTop: 20 }]}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                onPress={() => {
                  setCustomDateFrom("");
                  setCustomDateTo("");
                  setDateFromError("");
                  setDateToError("");
                  setActiveDateFilter(null);
                  setShowCustomDateModal(false);
                }}
              >
                <Text
                  style={[
                    styles.modalCancelText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Effacer
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowCustomDateModal(false)}
                disabled={
                  (!customDateFrom && !customDateTo) ||
                  !!dateFromError ||
                  !!dateToError
                }
                style={[
                  styles.modalConfirmBtn,
                  { backgroundColor: colors.primary },
                  ((!customDateFrom && !customDateTo) ||
                    !!dateFromError ||
                    !!dateToError) && { opacity: 0.5 },
                ]}
              >
                <Text style={styles.modalConfirmText}>Appliquer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Date Picker Début ── */}
      <DateTimePickerModal
        isVisible={showPickerFrom}
        mode="date"
        display="inline"
        locale="fr-FR"
        maximumDate={customDateTo ? new Date(customDateTo) : new Date()}
        onConfirm={handleConfirmFrom}
        onCancel={() => setShowPickerFrom(false)}
        confirmTextIOS="Confirmer"
        cancelTextIOS="Annuler"
      />

      {/* ── Date Picker Fin ── */}
      <DateTimePickerModal
        isVisible={showPickerTo}
        mode="date"
        display="inline"
        locale="fr-FR"
        minimumDate={customDateFrom ? new Date(customDateFrom) : undefined}
        maximumDate={new Date()}
        onConfirm={handleConfirmTo}
        onCancel={() => setShowPickerTo(false)}
        confirmTextIOS="Confirmer"
        cancelTextIOS="Annuler"
      />

      {/* ── Action sheet ── */}
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
                <Ionicons
                  name={selectedItem?.type === "folder" ? "folder" : "document"}
                  size={18}
                  color={colors.primary}
                />
              </View>
              <Text
                style={[styles.actionTitle, { color: colors.text }]}
                numberOfLines={1}
              >
                {selectedItem?.name}
              </Text>
            </View>

            {[
              {
                icon: "pencil-outline",
                color: colors.primary,
                bg: colors.primaryLight,
                label: "Renommer",
                onPress: () => {
                  setShowActionModal(false);
                  setRenameValue(selectedItem?.name ?? "");
                  setTimeout(() => setShowRenameModal(true), 300);
                },
              },
              {
                icon: "move-outline",
                color: colors.success,
                bg: colors.successLight,
                label: "Déplacer",
                onPress: () => {
                  setShowActionModal(false);
                  setShowMoveModal(true);
                },
              },
              {
                icon: "download-outline",
                color: colors.icon,
                bg: colors.surfaceSecondary,
                label: "Télécharger",
                onPress: async () => {
                  setShowActionModal(false);
                  if (selectedItem?.type === "file") {
                    // Trouve le fichier complet
                    const file = files.find((f) => f.id === selectedItem.id);
                    if (file) setDownloadFile(file);
                  } else {
                    // Télécharger dossier en ZIP
                    Alert.alert(
                      "Info",
                      "Téléchargement du dossier en ZIP bientôt disponible",
                    );
                  }
                },
              },
              {
                icon: "share-social-outline",
                color: colors.purple,
                bg: colors.purpleLight,
                label: "Partager",
                onPress: () => {
                  setShowActionModal(false);
                  if (selectedItem) {
                    setShareItem(selectedItem);
                    setShowShareModal(true);
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
                <Text style={[styles.actionLabel, { color: colors.text }]}>
                  {action.label}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={colors.border}
                />
              </TouchableOpacity>
            ))}

            <View
              style={[styles.actionDivider, { backgroundColor: colors.border }]}
            />

            <TouchableOpacity style={styles.actionItem} onPress={handleDelete}>
              <View
                style={[
                  styles.actionIconBox,
                  { backgroundColor: colors.dangerLight },
                ]}
              >
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color={colors.danger}
                />
              </View>
              <Text style={[styles.actionLabel, { color: colors.danger }]}>
                Supprimer
              </Text>
              <Ionicons
                name="chevron-forward"
                size={14}
                color={colors.danger}
                style={{ opacity: 0.4 }}
              />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      {/* ── Modal Corbeille ── */}
      <Modal visible={showTrash} animationType="slide">
        <View style={{ flex: 1 }}>
          <View
            style={[
              styles.trashHeader,
              {
                backgroundColor: colors.header,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <TouchableOpacity onPress={() => setShowTrash(false)}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.trashTitle, { color: colors.text }]}>
              Corbeille
            </Text>
            <View style={{ width: 24 }} />
          </View>
          <TrashScreen />
        </View>
      </Modal>

      <FilePreviewModal
        visible={previewFile !== null}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
      />
      {/* ── Preview pour téléchargement depuis menu ── */}
      {downloadFile && (
        <FilePreviewModal
          visible={downloadFile !== null}
          onClose={() => setDownloadFile(null)}
          file={downloadFile}
        />
      )}

      {/* ── Modal Déplacer ── */}
      <Modal visible={showMoveModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Déplacer vers...
              </Text>
              <TouchableOpacity
                onPress={() => {
                  if (!moveLoading) {
                    setMoveSuccess(null);
                    setShowMoveModal(false);
                  }
                }}
              >
                <Ionicons name="close" size={22} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>

            {moveLoading ? (
              /* ── Loading ── */
              <View style={{ alignItems: "center", paddingVertical: 32 }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text
                  style={{
                    color: colors.textSecondary,
                    marginTop: 12,
                    fontSize: 14,
                  }}
                >
                  Déplacement en cours...
                </Text>
              </View>
            ) : moveSuccess ? (
              /* ── Succès ── */
              <View style={{ alignItems: "center", paddingVertical: 24 }}>
                <View
                  style={[
                    styles.moveSuccessIcon,
                    { backgroundColor: colors.successLight },
                  ]}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={48}
                    color={colors.success}
                  />
                </View>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 17,
                    fontWeight: "700",
                    marginTop: 16,
                    textAlign: "center",
                  }}
                >
                  Déplacé avec succès
                </Text>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 13,
                    marginTop: 8,
                    textAlign: "center",
                    paddingHorizontal: 8,
                  }}
                >
                  {moveSuccess}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.modalConfirmBtn,
                    {
                      backgroundColor: colors.primary,
                      marginTop: 24,
                      width: "100%",
                    },
                  ]}
                  onPress={() => {
                    setMoveSuccess(null);
                    setShowMoveModal(false);
                  }}
                >
                  <Text style={styles.modalConfirmText}>OK</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* ── Liste dossiers ── */
              <>
                {/* Racine */}
                <TouchableOpacity
                  style={[
                    styles.moveFolderItem,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.surfaceSecondary,
                    },
                  ]}
                  onPress={async () => {
                    setMoveLoading(true);
                    try {
                      if (selectedItem?.type === "file") {
                        await filesApi.moveFile(selectedItem.id, null);
                        setFiles((prev) =>
                          prev.filter((f) => f.id !== selectedItem.id),
                        );
                      } else {
                        await filesApi.moveFolder(selectedItem!.id, null);
                        setFolders((prev) =>
                          prev.filter((f) => f.id !== selectedItem!.id),
                        );
                      }
                      const gc = getGlobalCache();
                      delete gc[String(currentFolderId ?? "root")];
                      delete gc["root"];
                      setMoveSuccess(
                        `"${selectedItem?.name}" a été déplacé à la Racine`,
                      );
                    } catch {
                      Alert.alert("Erreur", "Impossible de déplacer");
                    } finally {
                      setMoveLoading(false);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.moveFolderIconBox,
                      { backgroundColor: colors.primaryLight },
                    ]}
                  >
                    <Ionicons
                      name="home-outline"
                      size={18}
                      color={colors.primary}
                    />
                  </View>
                  <Text style={[styles.moveFolderName, { color: colors.text }]}>
                    Racine
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={14}
                    color={colors.textTertiary}
                  />
                </TouchableOpacity>

                {/* Liste des dossiers */}
                <ScrollView style={{ maxHeight: 300 }}>
                  {folders
                    .filter((f) => f.id !== selectedItem?.id)
                    .map((folder) => (
                      <TouchableOpacity
                        key={folder.id}
                        style={[
                          styles.moveFolderItem,
                          {
                            borderColor: colors.border,
                            backgroundColor: colors.surfaceSecondary,
                          },
                        ]}
                        onPress={async () => {
                          setMoveLoading(true);
                          try {
                            if (selectedItem?.type === "file") {
                              await filesApi.moveFile(
                                selectedItem.id,
                                folder.id,
                              );
                              setFiles((prev) =>
                                prev.filter((f) => f.id !== selectedItem.id),
                              );
                            } else {
                              await filesApi.moveFolder(
                                selectedItem!.id,
                                folder.id,
                              );
                              setFolders((prev) =>
                                prev.filter((f) => f.id !== selectedItem!.id),
                              );
                            }
                            const gc = getGlobalCache();
                            delete gc[String(currentFolderId ?? "root")];
                            delete gc[String(folder.id)];
                            setMoveSuccess(
                              `"${selectedItem?.name}" a été déplacé dans "${folder.name}"`,
                            );
                          } catch {
                            Alert.alert("Erreur", "Impossible de déplacer");
                          } finally {
                            setMoveLoading(false);
                          }
                        }}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            styles.moveFolderIconBox,
                            { backgroundColor: colors.primaryLight },
                          ]}
                        >
                          <Ionicons
                            name="folder-outline"
                            size={18}
                            color={colors.primary}
                          />
                        </View>
                        <Text
                          style={[
                            styles.moveFolderName,
                            { color: colors.text },
                          ]}
                        >
                          {folder.name}
                        </Text>
                        <Ionicons
                          name="chevron-forward"
                          size={14}
                          color={colors.textTertiary}
                        />
                      </TouchableOpacity>
                    ))}
                </ScrollView>

                <TouchableOpacity
                  style={[
                    styles.modalCancelBtn,
                    {
                      borderColor: colors.border,
                      marginTop: 16,
                      flex: 0,
                      width: "100%",
                    },
                  ]}
                  onPress={() => setShowMoveModal(false)}
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
              </>
            )}
          </View>
        </View>
      </Modal>
      {/* ── Modal Partager ── */}
      <Modal visible={showShareModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Partager "{shareItem?.name}"
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowShareModal(false);
                  setSharePassword("");
                  setShareExpiry("");
                  setShareEmail("");
                  setShareType("public");
                }}
              >
                <Ionicons name="close" size={22} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>

            {/* Tabs public / privé */}
            <View style={[styles.shareTabRow, { borderColor: colors.border }]}>
              <TouchableOpacity
                style={[
                  styles.shareTab,
                  shareType === "public" && {
                    borderBottomColor: colors.primary,
                    borderBottomWidth: 2,
                  },
                ]}
                onPress={() => setShareType("public")}
              >
                <Ionicons
                  name="globe-outline"
                  size={16}
                  color={
                    shareType === "public"
                      ? colors.primary
                      : colors.textTertiary
                  }
                />
                <Text
                  style={[
                    styles.shareTabText,
                    {
                      color:
                        shareType === "public"
                          ? colors.primary
                          : colors.textTertiary,
                    },
                  ]}
                >
                  Public
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.shareTab,
                  shareType === "private" && {
                    borderBottomColor: colors.primary,
                    borderBottomWidth: 2,
                  },
                ]}
                onPress={() => setShareType("private")}
              >
                <Ionicons
                  name="people-outline"
                  size={16}
                  color={
                    shareType === "private"
                      ? colors.primary
                      : colors.textTertiary
                  }
                />
                <Text
                  style={[
                    styles.shareTabText,
                    {
                      color:
                        shareType === "private"
                          ? colors.primary
                          : colors.textTertiary,
                    },
                  ]}
                >
                  Privé
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 320 }}>
              {shareType === "private" ? (
                /* ── Partage privé ── */
                <View style={{ marginTop: 16 }}>
                  <Text
                    style={[
                      styles.shareFieldLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    EMAIL DU DESTINATAIRE
                  </Text>
                  <TextInput
                    style={[
                      styles.modalInput,
                      {
                        backgroundColor: colors.surfaceSecondary,
                        color: colors.text,
                        borderColor: colors.border,
                        marginBottom: 8,
                      },
                    ]}
                    placeholder="email@example.com"
                    placeholderTextColor={colors.textTertiary}
                    value={shareEmail}
                    onChangeText={setShareEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              ) : (
                /* ── Partage public ── */
                <View style={{ marginTop: 16 }}>
                  {/* Mot de passe optionnel */}
                  <Text
                    style={[
                      styles.shareFieldLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    MOT DE PASSE (OPTIONNEL)
                  </Text>
                  <TextInput
                    style={[
                      styles.modalInput,
                      {
                        backgroundColor: colors.surfaceSecondary,
                        color: colors.text,
                        borderColor: colors.border,
                        marginBottom: 8,
                      },
                    ]}
                    placeholder="Laisser vide pour aucun mot de passe"
                    placeholderTextColor={colors.textTertiary}
                    value={sharePassword}
                    onChangeText={setSharePassword}
                    secureTextEntry
                  />

                  {/* Date d'expiration optionnelle */}
                  <Text
                    style={[
                      styles.shareFieldLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    DATE D'EXPIRATION (OPTIONNEL)
                  </Text>
                  <TextInput
                    style={[
                      styles.modalInput,
                      {
                        backgroundColor: colors.surfaceSecondary,
                        color: colors.text,
                        borderColor: colors.border,
                        marginBottom: 8,
                      },
                    ]}
                    placeholder="AAAA-MM-JJ (ex: 2026-12-31)"
                    placeholderTextColor={colors.textTertiary}
                    value={shareExpiry}
                    onChangeText={setShareExpiry}
                    keyboardType="numeric"
                  />
                </View>
              )}
            </ScrollView>

            {/* Bouton créer */}
            <TouchableOpacity
              style={[
                styles.modalConfirmBtn,
                {
                  backgroundColor: colors.primary,
                  marginTop: 16,
                  width: "100%",
                  flexDirection: "row",
                  gap: 8,
                },
              ]}
              onPress={async () => {
                setShowShareModal(false);
                try {
                  const body: any = {
                    type: shareItem?.type,
                    resourceId: shareItem?.id,
                  };

                  if (shareType === "private") {
                    if (!shareEmail.trim()) {
                      Alert.alert("Erreur", "Veuillez entrer un email");
                      return;
                    }
                    body.sharedWithEmail = shareEmail.trim();
                  } else {
                    if (sharePassword.trim())
                      body.password = sharePassword.trim();
                    if (shareExpiry.trim())
                      body.expiresAt = shareExpiry.trim() + "T23:59:59+00:00";
                  }

                  console.log("Share body:", JSON.stringify(body));
                  const res = await apiClient.post("/shares", body);
                  console.log("Share response:", JSON.stringify(res.data));

                  if (shareType === "public") {
                    const shareUrl = `http://192.168.0.15:3000/share/${res.data.token}`;
                    Alert.alert("✅ Lien créé", shareUrl, [
                      {
                        text: "Partager",
                        onPress: () => Share.share({ message: shareUrl }),
                      },
                      { text: "OK" },
                    ]);
                  } else {
                    Alert.alert(
                      "✅ Partagé",
                      `Fichier partagé avec ${res.data.sharedWith?.fullName ?? shareEmail}`,
                      [{ text: "OK" }],
                    );
                  }

                  setSharePassword("");
                  setShareExpiry("");
                  setShareEmail("");
                  setShareType("public");
                } catch (err: any) {
                  console.log("Share error:", err.response?.data, err.message);
                  Alert.alert(
                    "Erreur",
                    err.response?.data?.message ??
                      "Impossible de créer le partage",
                  );
                }
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name={
                  shareType === "public" ? "link-outline" : "person-add-outline"
                }
                size={18}
                color="#fff"
              />
              <Text style={[styles.modalConfirmText, { fontSize: 15 }]}>
                {shareType === "public" ? "Créer le lien" : "Partager"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalCancelBtn,
                {
                  borderColor: colors.border,
                  marginTop: 8,
                  flex: 0,
                  width: "100%",
                },
              ]}
              onPress={() => {
                setShowShareModal(false);
                setSharePassword("");
                setShareExpiry("");
                setShareEmail("");
                setShareType("public");
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
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerGreeting: { fontSize: 13, fontWeight: "500", marginBottom: 2 },
  headerTitle: { fontSize: 26, fontWeight: "800" },
  searchIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },

  // Breadcrumb
  breadcrumbBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  breadcrumbLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    flexWrap: "wrap",
  },
  breadcrumbText: { fontSize: 13 },
  breadcrumbActions: { flexDirection: "row", gap: 8, marginLeft: 12 },
  smallBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  // Sections
  section: { paddingHorizontal: 16, marginBottom: 8, marginTop: 12 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  sectionCount: { fontSize: 11, fontWeight: "600" },

  // Folder grid
  folderCardGrid: {
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  folderIconBg: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    position: "relative",
  },
  sharedDot: {
    position: "absolute",
    top: -3,
    right: -3,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  folderCardName: { fontSize: 11, fontWeight: "600", textAlign: "center" },
  sharedByLabel: { fontSize: 9, marginTop: 2, textAlign: "center" },

  // Folder list
  folderRowList: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  folderIconBgSmall: {
    width: 42,
    height: 42,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  folderRowInfo: { flex: 1 },
  folderRowName: { fontSize: 14, fontWeight: "600" },

  // File list
  fileRowList: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  fileIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  fileRowInfo: { flex: 1 },
  fileRowName: { fontSize: 14, fontWeight: "600", marginBottom: 3 },
  fileRowMeta: { fontSize: 11 },
  moreBtn: { padding: 8 },

  // File grid
  fileCardGrid: {
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  fileCardIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  fileCardName: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
  },
  fileCardMeta: { fontSize: 9, textAlign: "center" },

  // Empty
  emptyState: { alignItems: "center", paddingTop: 80, paddingBottom: 40 },
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

  // Search overlay
  searchOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  searchOverlayHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 56,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  searchBarExpanded: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
  },
  searchInputExpanded: { flex: 1, fontSize: 15 },
  cancelBtn: { paddingHorizontal: 4 },
  cancelText: { fontSize: 15, fontWeight: "600" },
  searchContent: { padding: 16, paddingBottom: 60 },

  // Chips
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  chipText: { fontSize: 12, fontWeight: "600" },

  // Suggest
  suggestTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
  },
  suggestItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 14,
    borderBottomWidth: 1,
  },
  suggestIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  suggestText: { flex: 1, fontSize: 14, fontWeight: "500" },
  suggestMeta: { fontSize: 11, marginTop: 2 },

  // Active filters
  activeFiltersRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  activeFiltersText: { fontSize: 13, fontWeight: "600" },
  clearFilters: { fontSize: 13, fontWeight: "600" },

  // Date custom
  dateLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
  },
  datePreview: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  datePreviewText: { fontSize: 13, fontWeight: "600" },

  // Search empty
  searchEmpty: { alignItems: "center", paddingTop: 48 },
  searchEmptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  searchEmptyText: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
  searchEmptySub: { fontSize: 13, textAlign: "center" },

  // Modals
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
  modalInput: {
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    borderWidth: 1.5,
    marginBottom: 20,
  },
  modalBtns: { flexDirection: "row", gap: 12 },
  modalCancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
  },
  modalCancelText: { fontWeight: "600" },
  modalConfirmBtn: {
    flex: 0,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalConfirmText: { color: "#fff", fontWeight: "700" },

  // Action sheet
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
  actionDivider: { height: 1, marginVertical: 8 },

  dateInfo: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
  },
  dateInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  dateTextInput: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    borderWidth: 1.5,
    fontVariant: ["tabular-nums"],
  },
  calendarBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dateSelectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 4,
  },
  dateSelectedText: { fontSize: 12, fontWeight: "600" },
  dateRangePreview: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
  },
  dateRangeText: { flex: 1, fontSize: 12, fontWeight: "600" },

  dateErrorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    marginTop: 2,
  },
  dateErrorText: {
    fontSize: 12,
    fontWeight: "500",
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 50,
  },
  headerActions: {
    flexDirection: "row",
    gap: 10,
  },
  trashHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  trashTitle: { fontSize: 20, fontWeight: "800" },

  loadingBar: {
    height: 3,
    width: "100%",
    overflow: "hidden",
  },
  loadingBarFill: {
    height: "100%",
    width: "60%",
    borderRadius: 2,
  },
  moveFolderItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 8,
    gap: 12,
  },
  moveFolderName: { fontSize: 14, fontWeight: "600", flex: 1 },
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

  moveFolderIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },

  moveSuccessIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  shareTabRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  shareTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
  },
  shareTabText: { fontSize: 13, fontWeight: "600" },
  shareFieldLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
  },
});
