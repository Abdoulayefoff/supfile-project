import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';
import { dashboardApi } from '../../api/dashboard';
import { DashboardStats, MimeTypeStat, FileItem } from '../../types';
import { formatFileSize, formatDate, getMimeIcon } from '../../utils/fileHelpers';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

// Écran du tableau de bord affichant les statistiques globales de l'utilisateur
export default function DashboardScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { user } = useAuthStore();
  
  // États locaux pour les statistiques globales, par type et les fichiers récents
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [typeStats, setTypeStats] = useState<MimeTypeStat[]>([]);
  const [recentFiles, setRecentFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Récupère les initiales de l'utilisateur pour l'avatar par défaut
  const getInitials = () => {
    const first = user?.firstName?.[0] || '';
    const last = user?.lastName?.[0] || '';
    return (first + last).toUpperCase();
  };

  // Charge toutes les données nécessaires au tableau de bord en parallèle
  const loadData = async () => {
    try {
      const [statsData, typeStatsData, recentFilesData] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getStatsByType(),
        dashboardApi.getRecentFiles(),
      ]);
      setStats(statsData);
      setTypeStats(typeStatsData);
      setRecentFiles(recentFilesData);
    } catch (e) {
      console.error('Failed to load dashboard data', e);
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

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Rendu de la barre de progression du quota de stockage
  const renderQuotaBar = () => {
    if (!stats || !stats.quota) return null;
    const isDanger = stats.quota.percentage > 80;
    const progressColor = isDanger ? colors.danger : colors.primary;

    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Espace de stockage</Text>
        <View style={styles.quotaTextContainer}>
          <Text style={[styles.quotaText, { color: colors.textPrimary }]}>
            {formatFileSize(Number(stats.quota.used))} <Text style={{ color: colors.textSecondary }}>/ {formatFileSize(Number(stats.quota.limit))}</Text>
          </Text>
          <Text style={[styles.quotaPercent, { color: progressColor }]}>
            {stats.quota.percentage.toFixed(1)}%
          </Text>
        </View>
        <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceSecondary }]}>
          <View style={[styles.progressBarFill, { width: `${Math.min(stats.quota.percentage, 100)}%`, backgroundColor: progressColor }]} />
        </View>
      </View>
    );
  };

  // Mappe les catégories backend vers icône + couleur
  const getTypeDisplay = (category: string): { icon: string; color: string; label: string } => {
    const map: Record<string, { icon: string; color: string; label: string }> = {
      images:    { icon: 'image-outline',        color: '#34a853', label: 'Images' },
      videos:    { icon: 'videocam-outline',     color: '#ea4335', label: 'Vidéos' },
      audio:     { icon: 'musical-notes-outline',color: '#9c27b0', label: 'Audio' },
      pdf:       { icon: 'document-text-outline',color: '#f44336', label: 'PDF' },
      documents: { icon: 'document-outline',     color: '#1a73e8', label: 'Documents' },
      tableurs:  { icon: 'grid-outline',         color: '#0f9d58', label: 'Tableurs' },
      archives:  { icon: 'archive-outline',      color: '#ff9800', label: 'Archives' },
      texte:     { icon: 'code-slash-outline',   color: '#607d8b', label: 'Texte' },
      autres:    { icon: 'ellipsis-horizontal-outline', color: '#9e9e9e', label: 'Autres' },
    };
    return map[category] ?? { icon: 'document-outline', color: '#9e9e9e', label: category };
  };

  // Rendu de la section répartition du stockage par type de fichier
  const renderTypeStats = () => {
    if (!typeStats || typeStats.length === 0) return null;

    const total = typeStats.reduce((sum, s) => sum + Number(s.totalSize), 0);

    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Répartition du stockage</Text>
        {typeStats.map((stat) => {
          const { icon, color, label } = getTypeDisplay(stat.category ?? '');
          const size = Number(stat.totalSize);
          const pct = total > 0 ? (size / total) * 100 : 0;
          return (
            <View key={label} style={styles.typeRow}>
              <View style={[styles.typeIcon, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon as any} size={18} color={color} />
              </View>
              <View style={styles.typeInfo}>
                <View style={styles.typeLabelRow}>
                  <Text style={[styles.typeLabel, { color: colors.textPrimary }]}>{label}</Text>
                  <Text style={[styles.typeSize, { color: colors.textSecondary }]}>{formatFileSize(size)}</Text>
                </View>
                <View style={[styles.typeBarBg, { backgroundColor: colors.border }]}>
                  <View style={[styles.typeBarFill, { width: `${Math.max(pct, 2)}%` as any, backgroundColor: color }]} />
                </View>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  // Rendu de la section listant les fichiers récemment modifiés
  const renderRecentFiles = () => {
    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Fichiers récents</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Fichiers')}>
            <Text style={{ color: colors.primary }}>Voir tout</Text>
          </TouchableOpacity>
        </View>
        
        {recentFiles.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Aucun fichier récent</Text>
        ) : (
          recentFiles.map(file => {
            const { icon, color } = getMimeIcon(file.mimeType);
            return (
              <View key={file.id} style={[styles.fileItem, { borderBottomColor: colors.border }]}>
                <View style={[styles.fileIcon, { backgroundColor: color + '20' }]}>
                  <Ionicons name={icon as any} size={24} color={color} />
                </View>
                <View style={styles.fileInfo}>
                  <Text style={[styles.fileName, { color: colors.textPrimary }]} numberOfLines={1}>{file.name}</Text>
                  <Text style={[styles.fileMeta, { color: colors.textSecondary }]}>
                    {formatFileSize(file.size)} • {formatDate(file.updatedAt)}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </View>
    );
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <View style={[styles.header, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>Bonjour,</Text>
          <Text style={[styles.name, { color: colors.textPrimary }]}>{user?.fullName || `${user?.firstName} ${user?.lastName}`}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profil')} style={[styles.avatarContainer, { backgroundColor: colors.primary }]}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={{ width: 44, height: 44, borderRadius: 22 }} />
          ) : (
            <Text style={styles.avatarText}>{getInitials()}</Text>
          )}
        </TouchableOpacity>
      </View>

      {renderQuotaBar()}
      
      <View style={styles.statsRow}>
        <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="document-outline" size={24} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats?.files || 0}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Fichiers</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="folder-outline" size={24} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats?.folders || 0}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Dossiers</Text>
        </View>
      </View>

      {renderTypeStats()}
      {renderRecentFiles()}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { marginBottom: 24, marginTop: 8 },
  greeting: { fontSize: 16 },
  name: { fontSize: 24, fontWeight: 'bold' },
  card: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  quotaTextContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  quotaText: { fontSize: 14, fontWeight: '500' },
  quotaPercent: { fontSize: 14, fontWeight: 'bold' },
  progressBarBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  statBox: { flex: 1, padding: 16, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', marginTop: 8 },
  statLabel: { fontSize: 14 },
  emptyText: { textAlign: 'center', padding: 20 },
  fileItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  fileIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  fileInfo: { flex: 1 },
  fileName: { fontSize: 16, fontWeight: '500', marginBottom: 4 },
  fileMeta: { fontSize: 12 },
  avatarContainer: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  typeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  typeIcon: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  typeInfo: { flex: 1 },
  typeLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  typeLabel: { fontSize: 14, fontWeight: '500' },
  typeSize: { fontSize: 12 },
  typeBarBg: { height: 5, borderRadius: 3, overflow: 'hidden' },
  typeBarFill: { height: '100%', borderRadius: 3 },
});
