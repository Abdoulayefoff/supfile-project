import { useEffect, useRef, type ReactElement } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import apiClient from '@/lib/axios';
import type { User } from '@/types';

export const OAuthCallbackPage = (): ReactElement => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const setAuth = useAuthStore((s) => s.setAuth);

    // useRef pour éviter le double appel en StrictMode React
    const handled = useRef(false);

    useEffect(() => {
        if (handled.current) return;
        handled.current = true;

        const token = searchParams.get('token');

        // Si pas de token dans l'URL → erreur, on retourne au login
        if (!token) {
            navigate('/auth?error=oauth_failed', { replace: true });
            return;
        }

        // ── Récupération des infos utilisateur avec le token OAuth ────────
        // On appelle GET /api/user/me avec le token reçu pour obtenir
        // les données complètes de l'utilisateur
        const fetchUser = async () => {
            try {
                const response = await apiClient.get<{ user: User }>('/user/me', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setAuth(token, response.data.user);
                navigate('/dashboard', { replace: true });
            } catch {
                navigate('/auth?error=oauth_failed', { replace: true });
            }
        };

        fetchUser();
    }, [searchParams, navigate, setAuth]);

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f0f2f5',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
        }}>
            {/* ── Logo ── */}
            <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #005bbf, #1a73e8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <span
                    className="material-symbols-outlined"
                    style={{ fontSize: '26px', color: 'white', fontVariationSettings: "'FILL' 1" }}
                >
                    cloud
                </span>
            </div>

            {/* ── Message de chargement ── */}
            <p style={{
                fontSize: '15px',
                fontWeight: 600,
                color: '#414754',
                fontFamily: 'Inter, sans-serif',
            }}>
                Connexion en cours...
            </p>
        </div>
    );
};