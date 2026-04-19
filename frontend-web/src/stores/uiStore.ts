// Store Zustand pour les états UI globaux (modals, etc.)
// Permet aux pages enfants (Dashboard, Drive…) de déclencher les modals
// gérées par AppLayout sans prop-drilling.

import { create } from 'zustand';

interface UiState {
    showUpload:    boolean;
    showNewFolder: boolean;

    openUpload:    () => void;
    closeUpload:   () => void;
    openNewFolder: () => void;
    closeNewFolder:() => void;
}

export const useUiStore = create<UiState>((set) => ({
    showUpload:     false,
    showNewFolder:  false,

    openUpload:     () => set({ showUpload: true }),
    closeUpload:    () => set({ showUpload: false }),
    openNewFolder:  () => set({ showNewFolder: true }),
    closeNewFolder: () => set({ showNewFolder: false }),
}));
