// Suite de tests unitaires pour le module syncStore
import { useSyncStore } from '../../store/syncStore';

// Groupe de tests couvrant le store de synchronisation (triggerRefresh)
describe('syncStore', () => {
  // Active les minuteurs simulés pour contrôler Date.now() dans les tests
  beforeEach(() => {
    jest.useFakeTimers();
    // Réinitialiser l'état avant chaque test
    useSyncStore.setState({ lastUpdate: 1000 });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // Vérifie que triggerRefresh met à jour lastUpdate avec l'heure courante
  it('triggerRefresh updates lastUpdate to current time', () => {
    jest.setSystemTime(new Date(2000));
    
    useSyncStore.getState().triggerRefresh();
    
    expect(useSyncStore.getState().lastUpdate).toBe(2000);
  });
});
