import { create } from 'zustand';

// Interface d'état pour forcer le rafraîchissement global des composants (ex: rechargement des listes)
interface SyncState {
  lastUpdate: number; // Timestamp de la dernière mise à jour
  triggerRefresh: () => void; // Fonction pour mettre à jour le timestamp et forcer un rendu
}

// Store Zustand très simple utilisé pour déclencher un fetch global sur toutes les vues concernées
export const useSyncStore = create<SyncState>((set) => ({
  lastUpdate: Date.now(),
  triggerRefresh: () => set({ lastUpdate: Date.now() }),
}));
