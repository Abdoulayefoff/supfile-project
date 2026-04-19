export interface User {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  quotaUsed: number;
  quotaLimit: number;
  theme: string | null;
  roles: string[];
  createdAt: string;
}

export interface Folder {
  id: number;
  name: string;
  parentId: number | null;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  isShared?: boolean;
  sharedBy?: {
    id: number;
    email: string;
    fullName: string;
  };
}

export interface FileItem {
  id: number;
  name: string;
  size: number;
  mimeType: string;
  folderId: number | null;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  humanReadableSize: string;
  extension: string;
  isImage: boolean;
  isVideo: boolean;
  isAudio: boolean;
  isPdf: boolean;
}

export interface Share {
  id: number;
  token: string;
  isPublic: boolean;
  hasPassword: boolean;
  expiresAt: string | null;
  createdAt: string;
  file: FileItem | null;
  folder: Folder | null;
  sharedWith: {
    id: number;
    email: string;
    fullName: string;
  } | null;
}

export interface DashboardStats {
  totalFiles: number;
  totalFolders: number;
  quotaUsed: number;
  quotaLimit: number;
  quotaPercentage: number;
  recentFiles: FileItem[];
  fileTypeDistribution: Record<string, number>;
  storageByType: Record<string, number>;
}

export interface ApiError {
  message: string;
  code?: string;
}