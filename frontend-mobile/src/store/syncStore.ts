import { create } from 'zustand';

interface SyncState {
  lastUpdate: number;
  triggerRefresh: () => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  lastUpdate: 0,
  triggerRefresh: () => set({ lastUpdate: Date.now() }),
}));