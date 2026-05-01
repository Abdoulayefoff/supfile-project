import { DashboardStats, MimeTypeStat, FileItem } from '../types';

export const mockStats: DashboardStats = {
  quotaUsed: 5368709120,   // 5 Go
  quotaLimit: 32212254720, // 30 Go
  quotaPercentage: 16.67,
  totalFiles: 42,
  totalFolders: 8,
};

export const mockStatsByType: MimeTypeStat[] = [
  { type: 'Vidéos', count: 8, totalSize: 2684354560 },
  { type: 'Images', count: 15, totalSize: 1073741824 },
  { type: 'Documents', count: 12, totalSize: 536870912 },
  { type: 'PDF', count: 5, totalSize: 268435456 },
  { type: 'Audio', count: 2, totalSize: 134217728 },
];

export const mockRecentFiles: FileItem[] = [
  { id: 1, name: 'Rapport_2026.pdf', size: 2048000, mimeType: 'application/pdf',
    createdAt: '2026-04-19T10:00:00+00:00', updatedAt: '2026-04-19T10:00:00+00:00', folder: null },
  { id: 2, name: 'Photo_vacances.jpg', size: 4096000, mimeType: 'image/jpeg',
    createdAt: '2026-04-18T10:00:00+00:00', updatedAt: '2026-04-18T10:00:00+00:00', folder: null },
  { id: 3, name: 'Budget.xlsx', size: 512000, mimeType: 'application/vnd.ms-excel',
    createdAt: '2026-04-17T10:00:00+00:00', updatedAt: '2026-04-17T10:00:00+00:00', folder: null },
  { id: 4, name: 'Video_cours.mp4', size: 524288000, mimeType: 'video/mp4',
    createdAt: '2026-04-16T10:00:00+00:00', updatedAt: '2026-04-16T10:00:00+00:00', folder: null },
  { id: 5, name: 'Notes.txt', size: 10240, mimeType: 'text/plain',
    createdAt: '2026-04-15T10:00:00+00:00', updatedAt: '2026-04-15T10:00:00+00:00', folder: null },
];