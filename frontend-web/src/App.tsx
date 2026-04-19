// Point d'entrée de l'application — configuration du router et des guards.

import { useEffect }                                        from 'react';
import { BrowserRouter, Routes, Route, Navigate }          from 'react-router-dom';
import { QueryClientProvider }                             from '@tanstack/react-query';
import { queryClient }   from '@/lib/queryClient';
import { useAuthStore }  from '@/stores/authStore';

// ── Pages publiques ──
import { AuthPage }          from '@/pages/auth/AuthPage';
import { OAuthCallbackPage } from '@/pages/auth/OAuthCallbackPage';
import PublicSharePage       from '@/pages/share/PublicSharePage';

// ── Pages protégées ──
import { AppLayout }     from '@/components/layout/AppLayout';
import DashboardPage     from '@/pages/dashboard/DashboardPage';
import { DrivePage }     from '@/pages/drive/DrivePage';
import { TrashPage }     from '@/pages/trash/TrashPage';
import { SharedPage }    from '@/pages/shared/SharedPage';
import PreviewPage       from '@/pages/files/PreviewPage';
import SettingsPage      from '@/pages/settings/SettingsPage';

// Guards de navigation

/**
 * Route protégée — redirige vers /auth si l'utilisateur n'est pas connecté.
 */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const token           = useAuthStore((s) => s.token);

    if (!isAuthenticated || !token) {
        return <Navigate to="/auth" replace />;
    }

    return <>{children}</>;
};

/**
 * Route publique — redirige vers /dashboard si l'utilisateur est déjà connecté.
 * Évite d'afficher la page login à quelqu'un déjà authentifié.
 */
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const token           = useAuthStore((s) => s.token);

    if (isAuthenticated && token) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};

// Composant principal

export default function App() {
    const logout = useAuthStore((s) => s.logout);
    const user   = useAuthStore((s) => s.user);

    // Écoute l'événement déclenché par l'intercepteur Axios (401)
    // pour déconnecter proprement l'utilisateur si son token expire
    useEffect(() => {
        const handleAutoLogout = () => logout();
        window.addEventListener('auth:logout', handleAutoLogout);
        return () => window.removeEventListener('auth:logout', handleAutoLogout);
    }, [logout]);

    // Applique le thème depuis les préférences utilisateur.
    // Si l'utilisateur n'a pas de thème défini (null), on force 'light'
    // et on nettoie le localStorage pour éviter qu'une session précédente
    // en mode sombre ne pollue la nouvelle connexion.
    useEffect(() => {
        const theme = user?.theme ?? 'light';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('sf_theme', theme);
    }, [user?.theme]);

    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <Routes>

                    {/* ── Routes publiques ── */}

                    {/* Login / Register */}
                    <Route
                        path="/auth"
                        element={
                            <PublicRoute>
                                <AuthPage />
                            </PublicRoute>
                        }
                    />

                    {/* Callback OAuth : reçoit le token après Google/GitHub/Microsoft */}
                    <Route
                        path="/auth/callback"
                        element={<OAuthCallbackPage />}
                    />

                    {/* Partage public : page standalone sans Header/Sidebar */}
                    <Route
                        path="/share/:token"
                        element={<PublicSharePage />}
                    />

                    {/* ── Routes protégées (sous AppLayout) ── */}
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <AppLayout />
                            </ProtectedRoute>
                        }
                    >
                        {/* Redirection index → dashboard */}
                        <Route
                            index
                            element={<Navigate to="/dashboard" replace />}
                        />

                        {/* Tableau de bord */}
                        <Route
                            path="dashboard"
                            element={<DashboardPage />}
                        />

                        {/* Gestionnaire de fichiers — racine */}
                        <Route
                            path="drive"
                            element={<DrivePage />}
                        />

                        {/* Gestionnaire de fichiers — navigation dossier */}
                        <Route
                            path="drive/folder/:folderId"
                            element={<DrivePage />}
                        />

                        {/* Prévisualisation d'un fichier — Sprint 8 */}
                        <Route
                            path="drive/preview/:fileId"
                            element={<PreviewPage />}
                        />

                        {/* Corbeille */}
                        <Route
                            path="trash"
                            element={<TrashPage />}
                        />

                        {/* Partagés avec moi */}
                        <Route
                            path="shared"
                            element={<SharedPage />}
                        />

                        {/* Paramètres utilisateur — Sprint 8 */}
                        <Route
                            path="settings"
                            element={<SettingsPage />}
                        />
                    </Route>

                    {/* Fallback : toute URL inconnue → dashboard */}
                    <Route
                        path="*"
                        element={<Navigate to="/dashboard" replace />}
                    />

                </Routes>
            </BrowserRouter>
        </QueryClientProvider>
    );
}