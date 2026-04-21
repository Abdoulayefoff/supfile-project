import type { ReactElement } from 'react';
import { getOAuthUrl, redirectToUrl } from '@/hooks/useAuth';

// ── Style commun à tous les boutons OAuth 
const oauthButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '13px 24px',
    borderRadius: '9999px',
    border: '1.5px solid #c1c6d6',
    background: 'white',
    cursor: 'pointer',
    fontFamily: 'Inter',
    fontWeight: 600,
    fontSize: '14px',
    color: '#191c1d',
    width: '100%',
    transition: 'background .2s',
};

export const OAuthButtons = (): ReactElement => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

            {/* ── Bouton Google ── */}
            <button
                type="button"
                onClick={() => redirectToUrl(getOAuthUrl('google'))}
                style={oauthButtonStyle}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f5'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
            >
                <svg width="18" height="18" viewBox="0 0 48 48">
                    <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
                    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.6 26.8 36 24 36c-5.2 0-9.6-2.9-11.3-7.1l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
                    <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.4-4.6 5.8l6.2 5.2C41 35.3 44 30 44 24c0-1.3-.1-2.7-.4-4z"/>
                </svg>
                Continuer avec Google
            </button>

            {/* ── Bouton GitHub ── */}
            <button
                type="button"
                onClick={() => redirectToUrl(getOAuthUrl('github'))}
                style={oauthButtonStyle}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f5'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#191c1d">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                Continuer avec GitHub
            </button>

            {/* ── Bouton Microsoft ── */}
            <button
                type="button"
                onClick={() => redirectToUrl(getOAuthUrl('microsoft'))}
                style={oauthButtonStyle}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f5'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
            >
                <svg width="18" height="18" viewBox="0 0 21 21">
                    <rect x="0"  y="0"  width="10" height="10" fill="#f25022"/>
                    <rect x="11" y="0"  width="10" height="10" fill="#7fba00"/>
                    <rect x="0"  y="11" width="10" height="10" fill="#00a4ef"/>
                    <rect x="11" y="11" width="10" height="10" fill="#ffb900"/>
                </svg>
                Continuer avec Microsoft
            </button>

        </div>
    );
};