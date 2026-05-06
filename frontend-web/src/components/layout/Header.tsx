import { useState, useRef, useEffect, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Moon, Sun, Settings, LogOut, Menu } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

interface HeaderProps {
    isDark: boolean;
    onToggleDark: () => void;
    onMenuToggle?: () => void;
    isMobile?: boolean;
}

export const Header = ({ isDark, onToggleDark, onMenuToggle, isMobile = false }: HeaderProps): ReactElement => {
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);

    // Contrôle le dropdown de l'avatar
    const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Initiale de l'avatar
    const avatarLetter = user?.firstName?.charAt(0).toUpperCase()
        ?? user?.email?.charAt(0).toUpperCase()
        ?? '?';

    // Ferme le menu si clic en dehors
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setAvatarMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ── Déconnexion 
    const handleLogout = () => {
        logout();
        navigate('/auth');
    };

    // ── Style des boutons icônes ──
    const iconBtnStyle: React.CSSProperties = {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: 'var(--muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6px',
        borderRadius: '8px',
        transition: 'background .15s',
    };

    return (
        <header style={{
            position: 'sticky',
            top: 0,
            zIndex: 50,
            height: '64px',
            background: 'var(--headerBg)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 22px',
            gap: '16px',
        }}>

            {/* ── Hamburger button (mobile only) ── */}
            {isMobile && (
                <button
                    style={iconBtnStyle}
                    onClick={onMenuToggle}
                    aria-label="Ouvrir le menu"
                    type="button"
                >
                    <Menu size={22} />
                </button>
            )}

            {/* ── Logo ── */}
            <div
                onClick={() => navigate('/dashboard')}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    flexShrink: 0,
                }}
            >
                <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '9px',
                    background: 'linear-gradient(135deg, #005bbf, #1a73e8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <span
                        className="material-symbols-outlined"
                        style={{ fontSize: '18px', color: 'white', fontVariationSettings: "'FILL' 1" }}
                    >
                        cloud
                    </span>
                </div>
                <span style={{
                    fontSize: '19px',
                    fontWeight: 900,
                    letterSpacing: '-0.03em',
                    color: '#005bbf',
                }}>
                    Supfile
                </span>
            </div>

            {/* ── Barre de recherche ── */}
            <div style={{ position: 'relative', maxWidth: '360px', flex: 1 }}>
                <Search
                    size={15}
                    style={{
                        position: 'absolute',
                        left: '11px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--muted)',
                        pointerEvents: 'none',
                    }}
                />
                <input
                    type="text"
                    placeholder="Rechercher des fichiers..."
                    className="sf-input"
                    style={{
                        paddingLeft: '34px',
                        background: 'var(--mid)',
                        color: 'var(--text)',
                        border: 'none',
                        fontSize: '13px',
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                            navigate(`/drive?search=${encodeURIComponent(e.currentTarget.value.trim())}`);
                        }
                    }}
                />
            </div>

            {/* ── Actions droite ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>

                {/* Bouton thème */}
                <button
                    style={iconBtnStyle}
                    onClick={onToggleDark}
                    title={isDark ? 'Mode clair' : 'Mode sombre'}
                >
                    {isDark ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                {/* Bouton paramètres */}
                <button
                    style={iconBtnStyle}
                    onClick={() => navigate('/settings')}
                    title="Paramètres"
                >
                    <Settings size={18} />
                </button>

                {/* ── Avatar + dropdown menu ── */}
                <div ref={menuRef} style={{ position: 'relative', marginLeft: '8px' }}>

                    {/* Avatar cliquable — affiche l'image si disponible, sinon l'initiale */}
                    <div
                        onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: user?.avatar
                                ? 'transparent'
                                : 'linear-gradient(135deg, #005bbf, #1a73e8)',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '12px',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0,91,191,.25)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            userSelect: 'none',
                            overflow: 'hidden',
                        }}
                    >
                        {user?.avatar ? (
                            <img
                                src={`${(import.meta.env.VITE_API_URL as string).replace(/\/api$/, '')}${user.avatar}`}
                                alt="avatar"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : avatarLetter}
                    </div>

                    {/* Dropdown menu utilisateur */}
                    {avatarMenuOpen && (
                        <div className="fade" style={{
                            position: 'absolute',
                            top: 'calc(100% + 8px)',
                            right: 0,
                            minWidth: '200px',
                            background: 'var(--surface)',
                            borderRadius: '14px',
                            padding: '6px',
                            boxShadow: '0 8px 32px rgba(0,0,0,.15)',
                            border: '1px solid var(--border)',
                            zIndex: 100,
                        }}>

                            {/* Infos utilisateur */}
                            <div style={{
                                padding: '10px 12px',
                                borderBottom: '1px solid var(--border)',
                                marginBottom: '4px',
                            }}>
                                <div style={{
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    color: 'var(--text)',
                                }}>
                                    {user?.firstName
                                        ? `${user.firstName} ${user.lastName ?? ''}`
                                        : user?.email}
                                </div>
                                <div style={{
                                    fontSize: '11px',
                                    color: 'var(--muted)',
                                    marginTop: '2px',
                                }}>
                                    {user?.email}
                                </div>
                            </div>

                            {/* Lien Paramètres */}
                            <div
                                className="ctx-item"
                                style={{ color: 'var(--text)' }}
                                onClick={() => {
                                    setAvatarMenuOpen(false);
                                    navigate('/settings');
                                }}
                            >
                                <Settings size={15} color="var(--muted)" />
                                Paramètres
                            </div>

                            {/* Séparateur */}
                            <div style={{
                                height: '1px',
                                background: 'var(--border)',
                                margin: '4px 0',
                            }} />

                            {/* Bouton déconnexion */}
                            <div
                                className="ctx-item"
                                style={{ color: '#ba1a1a' }}
                                onClick={handleLogout}
                            >
                                <LogOut size={15} color="#ba1a1a" />
                                Se déconnecter
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};