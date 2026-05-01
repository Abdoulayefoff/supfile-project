import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useTheme } from "../../hooks/useTheme";
import { API_URL, getMemoryToken } from "../../api/client";
import { useFilesStore } from "../../store/filesStore";
import { useSyncStore } from "../../store/syncStore";
import { Animated } from "react-native";
import Toast from "../../components/Toast";
import { useToast } from "../../hooks/useToast";

interface Props {
  visible: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
  currentFolderId?: number | null;
}

export default function UploadModal({
  visible,
  onClose,
  onUploadSuccess,
  currentFolderId,
}: Props) {
  const { colors } = useTheme();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState("");
  const { refresh } = useFilesStore();
  const { triggerRefresh } = useSyncStore();

  const { toast, showToast, hideToast } = useToast();

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      setFileName(asset.name);
      setUploading(true);
      setProgress(0);

      const token = getMemoryToken();
      if (!token) throw new Error("Token manquant");

      await uploadFile(asset, token);
    } catch (err: any) {
      console.log("Upload error:", err.message);
      Alert.alert("Erreur", "Impossible d'uploader le fichier");
      setUploading(false);
    }
  };

  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: Math.min(progress, 100),
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const uploadFile = (asset: any, token: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();

      formData.append("file", {
        uri: asset.uri,
        type: asset.mimeType ?? "application/octet-stream",
        name: asset.name,
      } as any);

      if (currentFolderId) {
        formData.append("folderId", String(currentFolderId));
      }

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          setProgress(pct);
        }
      };

      xhr.onload = () => {
        setUploading(false);
        if (xhr.status === 201) {
          setProgress(100);
          showToast(
            "Fichier uploadé !",
            `"${asset.name}" a été uploadé avec succès`,
            "success",
          );
          setTimeout(() => {
            triggerRefresh();
            onUploadSuccess();
            onClose();
          }, 1500);
          resolve();
        } else {
          try {
            const err = JSON.parse(xhr.responseText);
            if (xhr.status === 413) {
              showToast("Quota dépassé", "Fichier trop volumineux", "error");
            } else {
              showToast(
                "Erreur upload",
                err.error ?? "Erreur lors de l'upload",
                "error",
              );
            }
          } catch {
            showToast("Erreur", "Erreur lors de l'upload", "error");
          }
          reject(new Error(xhr.responseText));
        }
      };

      xhr.onerror = () => {
        setUploading(false);
        reject(new Error("Erreur réseau"));
      };

      xhr.open("POST", `${API_URL}/files`);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.send(formData);
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableOpacity
        style={styles.overlay}
        onPress={!uploading ? onClose : undefined}
        activeOpacity={1}
      >
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <Text style={[styles.title, { color: colors.text }]}>Ajouter</Text>

          {!uploading ? (
            <>
              {/* Upload fichier */}
              <TouchableOpacity
                style={[styles.option, { borderColor: colors.border }]}
                onPress={handlePickFile}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.optionIcon,
                    { backgroundColor: colors.primaryLight },
                  ]}
                >
                  <Ionicons
                    name="cloud-upload-outline"
                    size={24}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.optionContent}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>
                    Uploader un fichier
                  </Text>
                  <Text
                    style={[styles.optionSub, { color: colors.textTertiary }]}
                  >
                    Depuis ta galerie ou tes documents
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>

              {/* Annuler */}
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.border }]}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.cancelText, { color: colors.textSecondary }]}
                >
                  Annuler
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            /* ── Progress ── */
            <View style={styles.progressContainer}>
              <View
                style={[
                  styles.fileIconBox,
                  { backgroundColor: colors.primaryLight },
                ]}
              >
                <Ionicons
                  name="document-outline"
                  size={28}
                  color={colors.primary}
                />
              </View>

              <Text
                style={[styles.fileName, { color: colors.text }]}
                numberOfLines={1}
              >
                {fileName}
              </Text>

              <Text
                style={[styles.progressLabel, { color: colors.textTertiary }]}
              >
                {progress < 100
                  ? `Upload en cours... ${Math.min(progress, 100)}%`
                  : " Traitement..."}
              </Text>

              <View
                style={[
                  styles.progressBarBg,
                  { backgroundColor: colors.surfaceSecondary },
                ]}
              >
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 100],
                        outputRange: ["0%", "100%"],
                        extrapolate: "clamp",
                      }),
                      backgroundColor:
                        progress === 100 ? colors.success : colors.primary,
                    },
                  ]}
                />
              </View>

              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={{ marginTop: 12 }}
              />
            </View>
          )}
        </View>
      </TouchableOpacity>
            <Toast
        visible={toast.visible}
        message={toast.message}
        subMessage={toast.subMessage}
        type={toast.type}
        onHide={hideToast}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 20,
  },

  option: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 14,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  optionContent: { flex: 1 },
  optionTitle: { fontSize: 15, fontWeight: "700", marginBottom: 3 },
  optionSub: { fontSize: 12 },

  cancelBtn: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginTop: 4,
  },
  cancelText: { fontSize: 15, fontWeight: "600" },

  // Progress
  progressContainer: { alignItems: "center", paddingVertical: 8 },
  fileIconBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  fileName: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
    paddingHorizontal: 16,
  },
  progressLabel: { fontSize: 13, marginBottom: 16 },
  progressBarBg: {
    width: "100%",
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: { height: "100%", borderRadius: 4 },
});
