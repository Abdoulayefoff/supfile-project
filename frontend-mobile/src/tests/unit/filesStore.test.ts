// Suite de tests unitaires pour le module filesStore
import { useFilesStore } from '../../store/filesStore';

// Groupe de tests couvrant le store Zustand des fichiers/dossiers
describe('filesStore', () => {
  // Réinitialise le store à des listes vides avant chaque test
  beforeEach(() => {
    useFilesStore.setState({
      files: [],
      folders: [],
      breadcrumbs: [],
    });
  });

  it('l\'état initial est correct', () => {
    const state = useFilesStore.getState();
    expect(state.files).toEqual([]);
    expect(state.folders).toEqual([]);
    expect(state.breadcrumbs).toEqual([]);
  });

  it('setFiles met à jour les fichiers', () => {
    const mockFiles = [{ id: '1', name: 'test.txt' }] as any;
    useFilesStore.getState().setFiles(mockFiles);
    expect(useFilesStore.getState().files).toEqual(mockFiles);
  });

  it('setFolders met à jour les dossiers', () => {
    const mockFolders = [{ id: '1', name: 'Documents' }] as any;
    useFilesStore.getState().setFolders(mockFolders);
    expect(useFilesStore.getState().folders).toEqual(mockFolders);
  });

  it('setBreadcrumbs met à jour le fil d\'ariane', () => {
    const mockBreadcrumbs = [{ id: '1', name: 'Home' }] as any;
    useFilesStore.getState().setBreadcrumbs(mockBreadcrumbs);
    expect(useFilesStore.getState().breadcrumbs).toEqual(mockBreadcrumbs);
  });

  it('clearCache réinitialise tout l\'état', () => {
    useFilesStore.setState({
      files: [{ id: '1', name: 'test.txt' }] as any,
      folders: [{ id: '1', name: 'Documents' }] as any,
      breadcrumbs: [{ id: '1', name: 'Home' }] as any,
    });

    useFilesStore.getState().clearCache();

    const state = useFilesStore.getState();
    expect(state.files).toEqual([]);
    expect(state.folders).toEqual([]);
    expect(state.breadcrumbs).toEqual([]);
  });
});
