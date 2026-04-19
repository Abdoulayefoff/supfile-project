import { useState, type ReactElement } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAuthStore }       from '@/stores/authStore';
import { useUiStore }         from '@/stores/uiStore';
import { useDashboardStats }  from '@/hooks/useDashboard';

// ── Définition des items de navigation 
// Chaque item correspond à une section de l'application
const NAV_ITEMS = [
    { icon: 'dashboard',     label: 'Dashboard', path: '/dashboard' },
    { icon: 'folder_shared', label: 'Mon Drive',  path: '/drive'     },
    { icon: 'group',         label: 'Partagés',   path: '/shared'    },
    { icon: 'delete',        label: 'Corbeille',  path: '/trash'     },
];

export const Sidebar = (): ReactElement => {
    const navigate = useNavigate();
    const location = useLocation();
    const user = useAuthStore((s) => s.user);
    const { openUpload, openNewFolder } = useUiStore();

    // Quota depuis les stats API (refetché automatiquement après upload)
    const { data: stats } = useDashboardStats();

    // Contrôle l'affichage du dropdown "Nouveau"
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // ── Formatage de la taille du quota
    // Affiche les octets en Ko, Mo ou Go selon la taille
    // Les valeurs viennent directement de l'API — aucun calcul métier
    const formatSize = (bytes: number): string => {
        if (bytes < 1_048_576) return `${(bytes / 1_024).toFixed(0)} Ko`;
        if (bytes < 1_073_741_824) return `${(bytes / 1_048_576).toFixed(1)} Mo`;
        return `${(bytes / 1_073_741_824).toFixed(2)} Go`;
    };

    // Valeurs de quota depuis l'API, fallback sur le store si pas encore chargé
    const quotaUsed    = stats?.quotaUsed  ?? user?.quotaUsed  ?? 0;
    const quotaLimit   = stats?.quotaLimit ?? user?.quotaLimit ?? 1;
    const quotaPercent = Math.min((quotaUsed / quotaLimit) * 100, 100);

    return (
        <aside style={{
            width: '210px',
            background: 'var(--sidebarBg)',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            padding: '16px 10px',
            overflowY: 'auto',
            borderRight: '1px solid var(--border)',
        }}>

            {/* ── Bouton "Nouveau" avec dropdown ── */}
            <div style={{ padding: '0 4px', marginBottom: '18px', position: 'relative' }}>
                <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        borderRadius: '9999px',
                        background: 'linear-gradient(135deg, #005bbf, #1a73e8)',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 700,
                        fontSize: '13px',
                        boxShadow: '0 4px 14px rgba(0,91,191,.25)',
                        transition: 'all .2s',
                    }}
                >
                    <Plus size={16} />
                    Nouveau
                </button>

                {/* Dropdown des options */}
                {dropdownOpen && (
                    <>
                        {/* Overlay transparent pour fermer au clic en dehors */}
                        <div
                            style={{ position: 'fixed', inset: 0, zIndex: 99 }}
                            onClick={() => setDropdownOpen(false)}
                        />

                        <div className="fade" style={{
                            position: 'absolute',
                            top: 'calc(100% + 6px)',
                            left: 0,
                            width: '100%',
                            background: 'var(--surface)',
                            borderRadius: '12px',
                            padding: '5px',
                            boxShadow: '0 8px 32px rgba(0,0,0,.18)',
                            border: '1px solid var(--border)',
                            zIndex: 100,
                        }}>

                            {/* Option : Importer un fichier */}
                            <div
                                className="ctx-item"
                                style={{ color: 'var(--text)' }}
                                onClick={() => {
                                    setDropdownOpen(false);
                                    openUpload();
                                }}
                            >
                                <span
                                    className="material-symbols-outlined"
                                    style={{ fontSize: '17px', color: '#005bbf' }}
                                >
                                    upload_file
                                </span>
                                Importer un fichier
                            </div>

                            {/* Séparateur */}
                            <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />

                            {/* Option : Nouveau dossier */}
                            <div
                                className="ctx-item"
                                style={{ color: 'var(--text)' }}
                                onClick={() => {
                                    setDropdownOpen(false);
                                    openNewFolder();
                                }}
                            >
                                <span
                                    className="material-symbols-outlined"
                                    style={{ fontSize: '17px', color: '#34a853' }}
                                >
                                    create_new_folder
                                </span>
                                Nouveau dossier
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* ── Navigation ── */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {NAV_ITEMS.map((item) => {
                    // Un item est actif si le chemin actuel commence par son path
                    const isActive = location.pathname.startsWith(item.path);

                    return (
                        <div
                            key={item.path}
                            className={`nav-item ${isActive ? 'active' : ''}`}
                            style={{ color: isActive ? '#1a73e8' : 'var(--muted)' }}
                            onClick={() => navigate(item.path)}
                        >
                            <span
                                className="material-symbols-outlined"
                                style={{
                                    fontSize: '19px',
                                    fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                                }}
                            >
                                {item.icon}
                            </span>
                            {item.label}
                        </div>
                    );
                })}
            </nav>

            {/* ── Bloc stockage (poussé en bas) ── */}
            <div style={{ marginTop: 'auto', padding: '14px 6px 0' }}>

                {/* Label "Stockage" */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: 'var(--muted)',
                    marginBottom: '8px',
                }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                        cloud_queue
                    </span>
                    <span style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '.10em',
                    }}>
                        Stockage
                    </span>
                </div>

                {/* Barre de progression du quota */}
                <div style={{
                    background: 'var(--mid)',
                    borderRadius: '9999px',
                    height: '6px',
                    marginBottom: '6px',
                    overflow: 'hidden',
                }}>
                    <div
                        className="progress"
                        style={{ width: `${quotaPercent}%` }}
                    />
                </div>

                {/* Texte quota utilisé / total */}
                <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                    {formatSize(quotaUsed)} / {formatSize(quotaLimit)}
                </span>
            </div>
        </aside>
    );
};