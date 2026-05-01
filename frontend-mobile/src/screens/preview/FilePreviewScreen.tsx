import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { API_URL, getMemoryToken } from "../../api/client";
import { formatFileSize } from "../../utils/fileHelpers";
import { Video, ResizeMode } from "expo-av";
import { Audio } from "expo-av";
import * as Sharing from "expo-sharing";
import * as ExpoFS from "expo-file-system";
import { WebView } from "react-native-webview";

const { width, height } = Dimensions.get("window");

interface Props {
  visible: boolean;
  onClose: () => void;
  file: {
    id: number;
    name: string;
    mimeType: string;
    size: number;
  } | null;
}

export default function FilePreviewModal({ visible, onClose, file }: Props) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [textContent, setTextContent] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const [pdfBase64, setPdfBase64] = useState<string | null>(null);

  const token = getMemoryToken();
  // ← Headers Authorization — ce qui marchait avant
  const previewUrl = file ? `${API_URL}/files/${file.id}/preview` : "";
  const authHeaders = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [sound]);

  useEffect(() => {
    if (visible && file) {
      if (isImageFile(file.mimeType)) {
        loadImageWithAuth();
      } else if (isTextFile(file.mimeType)) {
        loadTextContent();
      } else if (isPDFFile(file.mimeType)) {
        loadPDFContent();
      } else {
        setLoading(false);
      }
    }
    if (!visible) {
      setTextContent("");
      setLoading(true);
      setImageBase64(null);
      setPdfBase64(null); // ← reset PDF
      if (sound) {
        sound.unloadAsync();
        setSound(null);
        setIsPlaying(false);
      }
    }
  }, [visible, file]);

  const isImageFile = (mime: string) => mime.startsWith("image/");
  const isVideoFile = (mime: string) => mime.startsWith("video/");
  const isAudioFile = (mime: string) => mime.startsWith("audio/");
  const isPDFFile = (mime: string) => mime === "application/pdf";
  const isTextFile = (mime: string) =>
    mime.startsWith("text/") || mime === "application/json";

  const loadImageWithAuth = async () => {
    try {
      setLoading(true);
      const response = await fetch(previewUrl, { headers: authHeaders });
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onload = () => {
        setImageBase64(reader.result as string);
        setLoading(false);
      };
      reader.onerror = () => setLoading(false);
      reader.readAsDataURL(blob);
    } catch {
      setLoading(false);
    }
  };

  const loadTextContent = async () => {
    try {
      setLoading(true);
      const res = await fetch(previewUrl, { headers: authHeaders });
      const text = await res.text();
      setTextContent(text);
    } catch {
      setTextContent("Impossible de charger le contenu");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!file || downloading) return;
    setDownloading(true);
    try {
      const token = getMemoryToken();
      const fileName = decodeURIComponent(file.name);
      const url = `${API_URL}/files/${file.id}/preview`;

      console.log("Downloading:", url);

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", url);
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.responseType = "blob";

        xhr.onload = async () => {
          if (xhr.status === 200) {
            try {
              const blob = xhr.response;
              const reader = new FileReader();
              reader.onload = async () => {
                try {
                  const dataUrl = reader.result as string;
                  const base64 = dataUrl.split(",")[1];

                  // Décode base64 → Uint8Array
                  const binaryStr = atob(base64);
                  const bytes = new Uint8Array(binaryStr.length);
                  for (let i = 0; i < binaryStr.length; i++) {
                    bytes[i] = binaryStr.charCodeAt(i);
                  }

                  const tempFile = new ExpoFS.File(
                    ExpoFS.Paths.cache,
                    fileName,
                  );

                  // Utilise writableStream pour écrire du binaire
                  const writable = tempFile.writableStream();
                  const writer = writable.getWriter();
                  await writer.write(bytes);
                  await writer.close();

                  console.log("Written via stream, size:", bytes.length);
                  console.log("File URI:", tempFile.uri);

                  resolve();

                  const canShare = await Sharing.isAvailableAsync();
                  if (canShare) {
                    await Sharing.shareAsync(tempFile.uri, {
                      mimeType: file.mimeType,
                      dialogTitle: `Enregistrer ${fileName}`,
                    });
                  }
                } catch (e: any) {
                  console.log("Write error:", e.message);
                  reject(e);
                }
              };
              reader.onerror = () => reject(new Error("FileReader error"));
              reader.readAsDataURL(blob);
            } catch (e: any) {
              reject(e);
            }
          } else {
            reject(new Error(`Status ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error("XHR error"));
        xhr.send();
      });
    } catch (err: any) {
      console.log("Download error:", err.message);
      Alert.alert("Erreur", err.message);
    } finally {
      setDownloading(false);
    }
  };
  const loadPDFContent = async () => {
    try {
      setLoading(true);
      console.log("PDF: fetching...");
      const response = await fetch(previewUrl, { headers: authHeaders });
      console.log("PDF: fetch done, reading blob...");
      const blob = await response.blob();
      console.log("PDF: blob size:", blob.size);
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        console.log("PDF: base64 length:", result?.length);
        setPdfBase64(result);
        setLoading(false);
      };
      reader.onerror = (e) => {
        console.log("PDF: reader error:", e);
        setLoading(false);
      };
      reader.onprogress = (e) => {
        console.log("PDF: progress:", e.loaded, "/", e.total);
      };
      console.log("PDF: starting readAsDataURL...");
      reader.readAsDataURL(blob);
      console.log("PDF: readAsDataURL called");
    } catch (err: any) {
      console.log("PDF error:", err.message);
      setLoading(false);
    }
  };

  const handlePlayPauseAudio = async () => {
    if (!sound) {
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: previewUrl, headers: authHeaders },
          { shouldPlay: true },
        );
        setSound(newSound);
        setIsPlaying(true);
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
          }
        });
      } catch {
        Alert.alert("Erreur", "Impossible de lire le fichier audio");
      }
    } else {
      const status = await sound.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
    }
  };

  const renderPreview = () => {
    if (!file) return null;

    if (isImageFile(file.mimeType)) {
      return (
        <View style={[styles.previewContainer, { backgroundColor: "#000" }]}>
          {loading ? (
            <View
              style={[styles.centered, { backgroundColor: colors.background }]}
            >
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ color: colors.textSecondary, marginTop: 12 }}>
                Chargement...
              </Text>
            </View>
          ) : imageBase64 ? (
            <Image
              source={{ uri: imageBase64 }}
              style={styles.image}
              resizeMode="contain"
            />
          ) : (
            <View
              style={[styles.centered, { backgroundColor: colors.background }]}
            >
              <Ionicons
                name="image-outline"
                size={48}
                color={colors.textTertiary}
              />
              <Text style={{ color: colors.textSecondary, marginTop: 12 }}>
                Impossible de charger l'image
              </Text>
            </View>
          )}
        </View>
      );
    }

    if (isVideoFile(file.mimeType)) {
      return (
        <View style={[styles.previewContainer, { backgroundColor: "#000" }]}>
          <Video
            source={{ uri: previewUrl, headers: authHeaders }}
            style={styles.video}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              Alert.alert("Erreur", "Impossible de lire la vidéo");
            }}
          />
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}
        </View>
      );
    }

    if (isAudioFile(file.mimeType)) {
      return (
        <View
          style={[
            styles.previewContainer,
            {
              backgroundColor: colors.background,
              justifyContent: "center",
              alignItems: "center",
            },
          ]}
        >
          <View style={[styles.audioBox, { backgroundColor: colors.surface }]}>
            <View
              style={[
                styles.audioIconBox,
                { backgroundColor: colors.primaryLight },
              ]}
            >
              <Ionicons name="musical-notes" size={48} color={colors.primary} />
            </View>
            <Text
              style={[styles.audioName, { color: colors.text }]}
              numberOfLines={2}
            >
              {decodeURIComponent(file.name)}
            </Text>
            <Text style={[styles.audioSize, { color: colors.textTertiary }]}>
              {formatFileSize(file.size)}
            </Text>
            <TouchableOpacity
              style={[styles.playBtn, { backgroundColor: colors.primary }]}
              onPress={handlePlayPauseAudio}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={32}
                color="#fff"
              />
            </TouchableOpacity>
            <Text style={[styles.audioStatus, { color: colors.textSecondary }]}>
              {isPlaying ? "▶ En lecture..." : "⏸ En pause"}
            </Text>
          </View>
        </View>
      );
    }

if (isPDFFile(file.mimeType)) {
  return (
    <View style={[styles.previewContainer, {
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    }]}>
      <View style={[styles.unsupportedBox, { backgroundColor: colors.surface }]}>
        <View style={[{ 
          width: 96, height: 96, borderRadius: 28,
          backgroundColor: '#ef444420',
          alignItems: 'center', justifyContent: 'center',
          marginBottom: 16,
        }]}>
          <Ionicons name="document-text-outline" size={48} color="#ef4444" />
        </View>
        <Text style={[styles.unsupportedTitle, { color: colors.text }]}>
          {decodeURIComponent(file.name)}
        </Text>
        <Text style={[styles.unsupportedSub, { color: colors.textTertiary }]}>
          {formatFileSize(file.size)}
        </Text>
        <Text style={[styles.unsupportedSub, { color: colors.textTertiary, marginTop: 8 }]}>
          Appuie sur télécharger pour ouvrir le PDF avec ton lecteur PDF
        </Text>
        <TouchableOpacity
          style={[{
            backgroundColor: '#ef4444',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingHorizontal: 24,
            paddingVertical: 14,
            borderRadius: 14,
            marginTop: 20,
          }]}
          onPress={handleDownload}
          activeOpacity={0.8}
        >
          {downloading
            ? <ActivityIndicator size="small" color="#fff" />
            : <>
                <Ionicons name="open-outline" size={18} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                  Ouvrir le PDF
                </Text>
              </>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

    return (
      <View
        style={[
          styles.previewContainer,
          {
            backgroundColor: colors.background,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <View
          style={[styles.unsupportedBox, { backgroundColor: colors.surface }]}
        >
          <View
            style={[
              styles.unsupportedIconBox,
              { backgroundColor: colors.primaryLight },
            ]}
          >
            <Ionicons
              name="document-outline"
              size={48}
              color={colors.primary}
            />
          </View>
          <Text style={[styles.unsupportedTitle, { color: colors.text }]}>
            {file.mimeType.includes("word") ||
            file.mimeType.includes("officedocument")
              ? "Document Word"
              : "Aperçu non disponible"}
          </Text>
          <Text style={[styles.unsupportedSub, { color: colors.textTertiary }]}>
            {file.mimeType.includes("word") ||
            file.mimeType.includes("officedocument")
              ? "Les fichiers Word ne peuvent pas être prévisualisés sur mobile."
              : "Ce type de fichier ne peut pas être prévisualisé."}
          </Text>
          <TouchableOpacity
            style={[
              styles.downloadBtnLarge,
              { backgroundColor: colors.primary },
            ]}
            onPress={handleDownload}
            activeOpacity={0.8}
          >
            {downloading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="download-outline" size={18} color="#fff" />
                <Text style={styles.downloadBtnText}>Télécharger</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.header,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text
              style={[styles.headerName, { color: colors.text }]}
              numberOfLines={1}
            >
              {file ? decodeURIComponent(file.name) : ""}
            </Text>
            <Text style={[styles.headerSize, { color: colors.textTertiary }]}>
              {file ? formatFileSize(file.size) : ""}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.downloadBtn,
              { backgroundColor: colors.primaryLight },
            ]}
            onPress={handleDownload}
            disabled={downloading}
            activeOpacity={0.7}
          >
            {downloading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons
                name="download-outline"
                size={20}
                color={colors.primary}
              />
            )}
          </TouchableOpacity>
        </View>
        {renderPreview()}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 56,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  closeBtn: { padding: 4 },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 15, fontWeight: "700" },
  headerSize: { fontSize: 11, marginTop: 2 },
  downloadBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  previewContainer: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  image: { width, flex: 1 },
  video: { width, height: height - 120 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  audioBox: {
    width: width - 64,
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    gap: 12,
  },
  audioIconBox: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  audioName: { fontSize: 16, fontWeight: "700", textAlign: "center" },
  audioSize: { fontSize: 12 },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  audioStatus: { fontSize: 13, marginTop: 4 },
  textContainer: { flex: 1 },
  textContent: { fontSize: 13, lineHeight: 20, fontFamily: "monospace" },
  unsupportedBox: {
    width: width - 64,
    borderRadius: 24,
    padding: 40,
    alignItems: "center",
    gap: 12,
  },
  unsupportedTitle: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  unsupportedSub: { fontSize: 13, textAlign: "center", lineHeight: 20 },

  unsupportedIconBox: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  downloadBtnLarge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 20,
  },
  downloadBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
