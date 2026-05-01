import { create } from 'zustand';
import { FileItem, FolderItem, Breadcrumb } from '../types';
import { filesApi } from '../api/files';

interface FilesState {
  files: FileItem[];
  folders: FolderItem[];
  breadcrumbs: Breadcrumb[];
  currentFolderId: number | null;
  isLoading: boolean;
  error: string | null;

  setCurrentFolderId: (id: number | null) => void; // ← ajoute
  loadContents: (folderId?: number) => Promise<void>;
  navigateTo: (folderId: number | null, folderName?: string) => Promise<void>;
  createFolder: (name: string) => Promise<void>;
  renameFile: (id: number, name: string) => Promise<void>;
  renameFolder: (id: number, name: string) => Promise<void>;
  deleteFile: (id: number) => Promise<void>;
  deleteFolder: (id: number) => Promise<void>;
  refresh: () => Promise<void>;
  
}

const globalCache: Record<string, { files: FileItem[], folders: FolderItem[] }> = {};
export const getGlobalCache = () => globalCache;
export const setGlobalCache = (key: string, data: { files: FileItem[], folders: FolderItem[] }) => {
  globalCache[key] = data;
};

export const useFilesStore = create<FilesState>((set, get) => ({
  files: [],
  folders: [],
  breadcrumbs: [{ id: null, name: 'Racine' }],
  currentFolderId: null,
  isLoading: false,
  error: null,
  

  setCurrentFolderId: (id) => set({ currentFolderId: id }), // ← ajoute

  loadContents: async (folderId?) => {
    set({ isLoading: true, error: null });
    try {
      const [{ files, folders }, allFolders] = await Promise.all([
        filesApi.getFiles(folderId),
        filesApi.getFolders(folderId),
      ]);
      set({ files, folders: allFolders, currentFolderId: folderId ?? null });

      if (folderId) {
        const crumbs = await filesApi.getBreadcrumbs(folderId);
        set({ breadcrumbs: crumbs });
      } else {
        set({ breadcrumbs: [{ id: null, name: 'Racine' }] });
      }
    } catch (err: any) {
      set({ error: 'Erreur de chargement' });
    } finally {
      set({ isLoading: false });
    }
  },

  navigateTo: async (folderId, folderName) => {
    await get().loadContents(folderId ?? undefined);
  },

  createFolder: async (name) => {
    const { currentFolderId } = get();
    await filesApi.createFolder(name, currentFolderId ?? undefined);
    await get().refresh();
  },

  renameFile: async (id, name) => {
    await filesApi.renameFile(id, name);
    await get().refresh();
  },

  renameFolder: async (id, name) => {
    await filesApi.renameFolder(id, name);
    await get().refresh();
  },

  deleteFile: async (id) => {
    await filesApi.deleteFile(id);
    await get().refresh();
  },

  deleteFolder: async (id) => {
    await filesApi.deleteFolder(id);
    await get().refresh();
  },

  refresh: async () => {
    await get().loadContents(get().currentFolderId ?? undefined);
  },
  
}));