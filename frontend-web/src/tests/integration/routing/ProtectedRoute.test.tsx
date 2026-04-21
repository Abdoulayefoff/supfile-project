import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import type { User } from '@/types';

// ─── Composants guards extraits de App.tsx (reproduits pour les tests) ─────────
// On teste les guards directement sans importer App.tsx pour éviter les
// dépendances sur les pages protégées (DashboardPage, etc.)

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const token           = useAuthStore((s) => s.token);

    if (!isAuthenticated || !token) {
        return <Navigate to="/auth" replace />;
    }

    return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const token           = useAuthStore((s) => s.token);

    if (isAuthenticated && token) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};

// ─── Helpers 

const makeUser = (): User => ({
    id: 1,
    email: 'abdoulaye@example.com',
    firstName: 'Abdoulaye',
    lastName: 'FOFANA',
    avatar: null,
    quotaUsed: 0,
    quotaLimit: 10_737_418_240,
    theme: null,
    roles: ['ROLE_USER'],
    createdAt: '2026-01-01T00:00:00Z',
});

const renderWithRouter = (initialEntry: string) => {
    return render(
        <MemoryRouter initialEntries={[initialEntry]}>
            <Routes>
                {/* Route publique */}
                <Route
                    path="/auth"
                    element={
                        <PublicRoute>
                            <div data-testid="auth-page">Page de connexion</div>
                        </PublicRoute>
                    }
                />

                {/* Route protégée */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <div data-testid="dashboard-page">Tableau de bord</div>
                        </ProtectedRoute>
                    }
                />

                {/* Fallback */}
                <Route path="*" element={<div data-testid="not-found">404</div>} />
            </Routes>
        </MemoryRouter>
    );
};

beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    useAuthStore.setState({ token: null, user: null, isAuthenticated: false });
});

// ─── ProtectedRoute 

describe('ProtectedRoute', () => {
    it('redirige vers /auth si l\'utilisateur n\'est pas authentifié', () => {
        renderWithRouter('/dashboard');

        // On est redirigé vers /auth donc on voit la page de connexion
        expect(screen.getByTestId('auth-page')).toBeInTheDocument();
        expect(screen.queryByTestId('dashboard-page')).not.toBeInTheDocument();
    });

    it('affiche la page protégée si l\'utilisateur est authentifié', () => {
        useAuthStore.setState({
            token: 'jwt-token',
            user: makeUser(),
            isAuthenticated: true,
        });

        renderWithRouter('/dashboard');

        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
        expect(screen.queryByTestId('auth-page')).not.toBeInTheDocument();
    });

    it('redirige vers /auth si token est null même avec isAuthenticated true', () => {
        // État incohérent (token absent mais isAuthenticated=true) → doit rediriger
        useAuthStore.setState({
            token: null,
            user: makeUser(),
            isAuthenticated: true,
        });

        renderWithRouter('/dashboard');

        expect(screen.getByTestId('auth-page')).toBeInTheDocument();
    });

    it('redirige vers /auth si isAuthenticated est false même avec un token', () => {
        // Autre état incohérent
        useAuthStore.setState({
            token: 'jwt-token',
            user: null,
            isAuthenticated: false,
        });

        renderWithRouter('/dashboard');

        expect(screen.getByTestId('auth-page')).toBeInTheDocument();
    });
});

// ─── PublicRoute 

describe('PublicRoute', () => {
    it('affiche la page publique si l\'utilisateur n\'est pas authentifié', () => {
        renderWithRouter('/auth');

        expect(screen.getByTestId('auth-page')).toBeInTheDocument();
    });

    it('redirige vers /dashboard si l\'utilisateur est déjà authentifié', () => {
        useAuthStore.setState({
            token: 'jwt-token',
            user: makeUser(),
            isAuthenticated: true,
        });

        renderWithRouter('/auth');

        // L'utilisateur connecté est redirigé vers /dashboard
        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
        expect(screen.queryByTestId('auth-page')).not.toBeInTheDocument();
    });

    it('ne redirige pas si le token est null', () => {
        useAuthStore.setState({
            token: null,
            user: null,
            isAuthenticated: false,
        });

        renderWithRouter('/auth');

        expect(screen.getByTestId('auth-page')).toBeInTheDocument();
    });
});

// ─── Sécurité — accès non autorisé 

describe('Sécurité — accès aux routes protégées', () => {
    it('un utilisateur non authentifié ne peut pas accéder au dashboard (redirection /auth)', () => {
        renderWithRouter('/dashboard');

        expect(screen.queryByTestId('dashboard-page')).not.toBeInTheDocument();
        expect(screen.getByTestId('auth-page')).toBeInTheDocument();
    });

    it('un utilisateur authentifié ne peut pas accéder à la page login (redirection /dashboard)', () => {
        useAuthStore.setState({
            token: 'valid-jwt',
            user: makeUser(),
            isAuthenticated: true,
        });

        renderWithRouter('/auth');

        expect(screen.queryByTestId('auth-page')).not.toBeInTheDocument();
        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    });
});
