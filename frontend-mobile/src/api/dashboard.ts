import apiClient from './client';
import { DashboardStats, MimeTypeStat, FileItem } from '../types';

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const res = await apiClient.get('/dashboard/stats');
    const d = res.data;
    console.log('Stats raw:', JSON.stringify(d));
    return {
      quotaUsed: Number(d.quota?.used ?? 0),
      quotaLimit: Number(d.quota?.limit ?? 32212254720),
      quotaPercentage: Number(d.quota?.percentage ?? 0),
      totalFiles: d.files ?? 0,
      totalFolders: d.folders ?? 0,
    };
  },

getStatsByType: async (): Promise<MimeTypeStat[]> => {
  const res = await apiClient.get('/dashboard/stats/type');
  const data = res.data;

  if (Array.isArray(data)) {
    return data.map((item: any) => ({
      type: item.type ?? item.category ?? 'Autres',
      count: item.count ?? 0,
      totalSize: Number(item.totalSize ?? item.size ?? 0),
    }));
  }
  return Object.entries(data).map(([type, info]: [string, any]) => ({
    type,
    count: info.count ?? 0,
    totalSize: Number(info.totalSize ?? info.size ?? 0),
  }));
},

getRecentFiles: async (): Promise<FileItem[]> => {
  const res = await apiClient.get('/dashboard/recent');
  const data = Array.isArray(res.data) ? res.data : (res.data.files ?? res.data.data ?? []);
  return data.map((f: any) => ({
    ...f,
    size: Number(f.size),
    name: decodeURIComponent(f.name ?? ''),
    createdAt: f.createdAt ?? f.updatedAt ?? new Date().toISOString(),
    folder: f.folder ?? null,
  }));
},
};