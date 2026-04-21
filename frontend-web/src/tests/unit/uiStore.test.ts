import { useUiStore } from '@/stores/uiStore';

beforeEach(() => {
    // Réinitialiser à l'état initial avant chaque test
    useUiStore.setState({ showUpload: false, showNewFolder: false });
});

// ─── État initial 

describe('uiStore — état initial', () => {
    it('showUpload vaut false initialement', () => {
        expect(useUiStore.getState().showUpload).toBe(false);
    });

    it('showNewFolder vaut false initialement', () => {
        expect(useUiStore.getState().showNewFolder).toBe(false);
    });
});

// ─── openUpload / closeUpload 

describe('uiStore — openUpload()', () => {
    it('passe showUpload à true', () => {
        useUiStore.getState().openUpload();
        expect(useUiStore.getState().showUpload).toBe(true);
    });

    it('ne modifie pas showNewFolder', () => {
        useUiStore.getState().openUpload();
        expect(useUiStore.getState().showNewFolder).toBe(false);
    });
});

describe('uiStore — closeUpload()', () => {
    it('passe showUpload à false', () => {
        useUiStore.setState({ showUpload: true });
        useUiStore.getState().closeUpload();
        expect(useUiStore.getState().showUpload).toBe(false);
    });

    it('est idempotent si showUpload est déjà false', () => {
        useUiStore.getState().closeUpload();
        expect(useUiStore.getState().showUpload).toBe(false);
    });
});

describe('uiStore — open/close cycle upload', () => {
    it('ouvre puis ferme correctement', () => {
        useUiStore.getState().openUpload();
        expect(useUiStore.getState().showUpload).toBe(true);

        useUiStore.getState().closeUpload();
        expect(useUiStore.getState().showUpload).toBe(false);
    });
});

// ─── openNewFolder / closeNewFolder 

describe('uiStore — openNewFolder()', () => {
    it('passe showNewFolder à true', () => {
        useUiStore.getState().openNewFolder();
        expect(useUiStore.getState().showNewFolder).toBe(true);
    });

    it('ne modifie pas showUpload', () => {
        useUiStore.getState().openNewFolder();
        expect(useUiStore.getState().showUpload).toBe(false);
    });
});

describe('uiStore — closeNewFolder()', () => {
    it('passe showNewFolder à false', () => {
        useUiStore.setState({ showNewFolder: true });
        useUiStore.getState().closeNewFolder();
        expect(useUiStore.getState().showNewFolder).toBe(false);
    });

    it('est idempotent si showNewFolder est déjà false', () => {
        useUiStore.getState().closeNewFolder();
        expect(useUiStore.getState().showNewFolder).toBe(false);
    });
});

describe('uiStore — indépendance des deux modals', () => {
    it('les deux modals peuvent être ouvertes simultanément', () => {
        useUiStore.getState().openUpload();
        useUiStore.getState().openNewFolder();

        expect(useUiStore.getState().showUpload).toBe(true);
        expect(useUiStore.getState().showNewFolder).toBe(true);
    });

    it('fermer une modal ne ferme pas l\'autre', () => {
        useUiStore.setState({ showUpload: true, showNewFolder: true });
        useUiStore.getState().closeUpload();

        expect(useUiStore.getState().showUpload).toBe(false);
        expect(useUiStore.getState().showNewFolder).toBe(true);
    });
});
