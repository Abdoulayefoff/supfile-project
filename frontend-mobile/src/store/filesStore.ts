import { create } from 'zustand';
import { FileItem, FolderItem, Breadcrumb } from '../types';

// Définition de l'interface pour l'état du gestionnaire de fichiers/dossiers.
interface FilesState {
  files: FileItem[]; // Liste des fichiers dans le dossier courant
  folders: FolderItem[]; // Liste des sous-dossiers dans le dossier courant
  breadcrumbs: Breadcrumb[]; // Fil d'Ariane pour la navigation
  setFiles: (files: FileItem[]) => void;
  setFolders: (folders: FolderItem[]) => void;
  setBreadcrumbs: (breadcrumbs: Breadcrumb[]) => void;
  clearCache: () => void;
}

// Création du store Zustand pour partager l'état des fichiers entre les différents composants (ex: FilesScreen).
export const useFilesStore = create<FilesState>((set) => ({
  files: [],
  folders: [],
  breadcrumbs: [],
  // Mises à jour simples de l'état
  setFiles: (files) => set({ files }),
  setFolders: (folders) => set({ folders }),
  setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),
  // Réinitialise le cache lors de la déconnexion ou d'un rafraîchissement forcé
  clearCache: () => set({ files: [], folders: [], breadcrumbs: [] }),
}));
