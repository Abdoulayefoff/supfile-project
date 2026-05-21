// Représente l'utilisateur connecté dans l'application
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

// Représente un fichier stocké dans le système
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

// Représente un dossier qui peut contenir d'autres dossiers et fichiers
export interface FolderItem {
  id: number;
  name: string;
  createdAt: string;
  updatedAt?: string;
  parent: { id: number; name: string } | null;
  parentId?: number | null;
  isShared?: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
  sharedBy?: { id: number; email: string; fullName: string } | null;
}

// Utilisé pour construire le chemin de navigation (Dossier parent > Sous-dossier)
export interface Breadcrumb {
  id: number | null;
  name: string;
}

// Représente un lien de partage (public ou privé) d'un fichier ou d'un dossier
export interface Share {
  id: number;
  token: string;
  isPublic: boolean;
  hasPassword?: boolean;
  expiresAt?: string | null;
  createdAt: string;
  createdBy?: { id: number; email: string; fullName: string };
  resourceType: string;
  resource?: { id: number; name: string; mimeType?: string; size?: number } | null;
  sharedWith?: { id: number; email: string; fullName: string } | null;
}

// Statistiques globales affichées sur le Dashboard
export interface DashboardStats {
  quota: {
    used: string | number;
    limit: string | number;
    percentage: number;
  };
  files: number;
  folders: number;
}

// Statistiques de l'espace occupé par type de fichier (Image, Vidéo, etc.)
export interface MimeTypeStat {
  category: string;
  count: number;
  totalSize: number;
}
