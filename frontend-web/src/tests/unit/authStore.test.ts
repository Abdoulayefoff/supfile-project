import { useAuthStore } from '@/stores/authStore';
import type { User } from '@/types';

// Fixture utilisateur réutilisable
const makeUser = (overrides: Partial<User> = {}): User => ({
    id: 1,
    email: 'test@example.com',
    firstName: 'Abdoulaye',
    lastName: '`FOFANA`',
    avatar: null,
    quotaUsed: 1000,
    quotaLimit: 10_737_418_240,
    theme: null,
    roles: ['ROLE_USER'],
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
});

// Réinitialise le store ET les storages entre chaque test
beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    // Réinitialiser le store Zustand à son état initial
    useAuthStore.setState({ token: null, user: null, isAuthenticated: false });
});

// ─── État initial 

describe('authStore — état initial', () => {
    it('commence avec token null', () => {
        expect(useAuthStore.getState().token).toBeNull();
    });

    it('commence avec user null', () => {
        expect(useAuthStore.getState().user).toBeNull();
    });

    it('commence avec isAuthenticated false', () => {
        expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
});

// ─── setAuth 

describe('authStore — setAuth()', () => {
    it('met à jour token, user et isAuthenticated dans le store', () => {
        const user = makeUser();
        useAuthStore.getState().setAuth('my-jwt-token', user);

        const state = useAuthStore.getState();
        expect(state.token).toBe('my-jwt-token');
        expect(state.user).toEqual(user);
        expect(state.isAuthenticated).toBe(true);
    });

    it('persiste dans localStorage quand rememberMe=true (défaut)', () => {
        const user = makeUser();
        useAuthStore.getState().setAuth('tok123', user);

        expect(localStorage.getItem('jwt_token')).toBe('tok123');
        expect(JSON.parse(localStorage.getItem('sf_user')!)).toEqual(user);
    });

    it('persiste dans sessionStorage quand rememberMe=false', () => {
        const user = makeUser();
        useAuthStore.getState().setAuth('tok456', user, false);

        expect(sessionStorage.getItem('jwt_token')).toBe('tok456');
        expect(JSON.parse(sessionStorage.getItem('sf_user')!)).toEqual(user);
    });

    it('ne met pas le token dans localStorage quand rememberMe=false', () => {
        const user = makeUser();
        useAuthStore.getState().setAuth('tok456', user, false);

        expect(localStorage.getItem('jwt_token')).toBeNull();
    });

    it('efface sessionStorage lors d\'un login avec rememberMe=true', () => {
        sessionStorage.setItem('jwt_token', 'old-session-token');
        const user = makeUser();
        useAuthStore.getState().setAuth('newtoken', user, true);

        expect(sessionStorage.getItem('jwt_token')).toBeNull();
    });

    it('efface localStorage lors d\'un login avec rememberMe=false', () => {
        localStorage.setItem('jwt_token', 'old-local-token');
        const user = makeUser();
        useAuthStore.getState().setAuth('newtoken', user, false);

        expect(localStorage.getItem('jwt_token')).toBeNull();
    });
});

// ─── setUser 

describe('authStore — setUser()', () => {
    it('met à jour uniquement le user dans le store sans toucher au token', () => {
        const user = makeUser();
        useAuthStore.getState().setAuth('tok', user);

        const updatedUser = makeUser({ firstName: 'Bob' });
        useAuthStore.getState().setUser(updatedUser);

        expect(useAuthStore.getState().user?.firstName).toBe('Bob');
        expect(useAuthStore.getState().token).toBe('tok');
    });

    it('met à jour sf_user dans localStorage quand le token y est', () => {
        const user = makeUser();
        useAuthStore.getState().setAuth('tok', user, true);

        const updated = makeUser({ email: 'new@example.com' });
        useAuthStore.getState().setUser(updated);

        expect(JSON.parse(localStorage.getItem('sf_user')!).email).toBe('new@example.com');
    });

    it('met à jour sf_user dans sessionStorage quand le token y est', () => {
        const user = makeUser();
        useAuthStore.getState().setAuth('tok', user, false);

        const updated = makeUser({ lastName: 'Martin' });
        useAuthStore.getState().setUser(updated);

        expect(JSON.parse(sessionStorage.getItem('sf_user')!).lastName).toBe('Martin');
    });
});

// ─── logout 

describe('authStore — logout()', () => {
    it('remet token à null', () => {
        useAuthStore.getState().setAuth('tok', makeUser());
        useAuthStore.getState().logout();

        expect(useAuthStore.getState().token).toBeNull();
    });

    it('remet user à null', () => {
        useAuthStore.getState().setAuth('tok', makeUser());
        useAuthStore.getState().logout();

        expect(useAuthStore.getState().user).toBeNull();
    });

    it('remet isAuthenticated à false', () => {
        useAuthStore.getState().setAuth('tok', makeUser());
        useAuthStore.getState().logout();

        expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('efface jwt_token du localStorage', () => {
        localStorage.setItem('jwt_token', 'tok');
        useAuthStore.getState().logout();

        expect(localStorage.getItem('jwt_token')).toBeNull();
    });

    it('efface sf_user du localStorage', () => {
        localStorage.setItem('sf_user', JSON.stringify(makeUser()));
        useAuthStore.getState().logout();

        expect(localStorage.getItem('sf_user')).toBeNull();
    });

    it('efface jwt_token du sessionStorage', () => {
        sessionStorage.setItem('jwt_token', 'tok');
        useAuthStore.getState().logout();

        expect(sessionStorage.getItem('jwt_token')).toBeNull();
    });

    it('efface sf_user du sessionStorage', () => {
        sessionStorage.setItem('sf_user', JSON.stringify(makeUser()));
        useAuthStore.getState().logout();

        expect(sessionStorage.getItem('sf_user')).toBeNull();
    });

    it('efface le legacy supfile-auth du localStorage', () => {
        localStorage.setItem('supfile-auth', JSON.stringify({ state: { token: 'old' } }));
        useAuthStore.getState().logout();

        expect(localStorage.getItem('supfile-auth')).toBeNull();
    });
});
