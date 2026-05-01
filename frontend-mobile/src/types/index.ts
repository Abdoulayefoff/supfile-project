export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatar: string | null;
  quotaUsed: number;
  quotaLimit: number;
  theme: 'light' | 'dark' | null;
  roles: string[];
  createdAt: string;
}

export interface FileItem {
  id: number;
  name: string;
  size: number;
  mimeType: string;
  createdAt: string;
  updatedAt: string;
  folder: { id: number; name: string } | null;
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface FolderItem {
  id: number;
  name: string;
  createdAt: string;
  updatedAt?: string;
  parent: { id: number; name: string } | null;
  parentId?: number | null;  // ← ajoute
  isShared?: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
  sharedBy?: {
    id: number;
    email: string;
    fullName: string;
  } | null;
}

export interface Breadcrumb {
  id: number | null;
  name: string;
}

export interface Share {
  id: number;
  token: string;
  isPublic: boolean;
  hasPassword?: boolean;
  expiresAt?: string | null;
  createdAt: string;
  createdBy?: {
    id: number;
    email: string;
    fullName: string;
  };
  file?: FileItem | null;
  folder?: FolderItem | null;
}

export interface DashboardStats {
  quotaUsed: number;
  quotaLimit: number;
  quotaPercentage: number;
  totalFiles: number;
  totalFolders: number;
}

export interface MimeTypeStat {
  type: string;
  count: number;
  totalSize: number;
}