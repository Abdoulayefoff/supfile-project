// Page tableau de bord — quota, répartition stockage, fichiers récents,
// GET /api/dashboard/stats  |  GET /api/dashboard/recent

import type { ReactElement } from 'react';
import { useNavigate }       from 'react-router-dom';
import { FileText, Image, Video, Folder } from 'lucide-react';

import { useAuthStore }                          from '@/stores/authStore';
import { useUiStore }                            from '@/stores/uiStore';
import { useDashboardStats, useRecentFiles }     from '@/hooks/useDashboard';
import { useIsMobile }                           from '@/hooks/useIsMobile';
import type { StatsByType }                      from '@/services/dashboardService';
import { fmtSize, fmtDate, getMimeInfo }         from '@/lib/utils';
import { MaterialIcon }                          from '@/components/ui/MaterialIcon';
import type { FileItem }                         from '@/types';

// Types locaux

interface StorageCategory {
    label:    string;
    color:    string;
    icon:     ReactElement;
    rawBytes: number;
}

interface QuickAction {
    icon:    string;
    label:   string;
    color:   string;
    onClick: () => void;
}

// Helpers

/**
 * Construit les 4 catégories de répartition du stockage
 * à partir du tableau statsByType renvoyé par l'API.
 */
const buildStorageCategories = (
    statsByType: StatsByType[] | undefined
): StorageCategory[] => {
    const sum = (categories: string[]): number =>
        (statsByType ?? [])
            .filter((s) => categories.includes(s.category))
            .reduce((acc, s) => acc + s.totalSize, 0);

    return [
        { label: 'Docs',   color: '#005bbf', icon: <FileText size={14} color="#005bbf" />, rawBytes: sum(['documents', 'pdf', 'tableurs', 'texte']) },
        { label: 'Photos', color: '#34a853', icon: <Image    size={14} color="#34a853" />, rawBytes: sum(['images']) },
        { label: 'Vidéos', color: '#f97316', icon: <Video    size={14} color="#f97316" />, rawBytes: sum(['videos', 'audio']) },
        { label: 'Autres', color: '#727785', icon: <Folder   size={14} color="#727785" />, rawBytes: sum(['archives', 'autres']) },
    ];
};

// ── Graphique donut SVG

interface DonutChartProps {
    categories: StorageCategory[];
    total:      number;
}

const DonutChart = ({ categories, total }: DonutChartProps): ReactElement => {
    const R  = 44;
    const SW = 15;
    const C  = 2 * Math.PI * R;
    let   cumulative = 0;

    return (
        <svg viewBox="0 0 120 120" width={116} height={116} style={{ flexShrink: 0 }}>
            <g style={{ transform: 'rotate(-90deg)', transformOrigin: '60px 60px' }}>
                {total === 0 ? (
                    <circle cx={60} cy={60} r={R} fill="none" stroke="var(--mid)" strokeWidth={SW} />
                ) : (
                    categories.map((cat) => {
                        if (cat.rawBytes === 0) return null;
                        const dash   = (cat.rawBytes / total) * C;
                        const offset = C - (cumulative / total) * C;
                        cumulative  += cat.rawBytes;
                        return (
                            <circle
                                key={cat.label}
                                cx={60} cy={60} r={R}
                                fill="none"
                                stroke={cat.color}
                                strokeWidth={SW}
                                strokeDasharray={`${dash} ${C}`}
                                strokeDashoffset={offset}
                                strokeLinecap="butt"
                            />
                        );
                    })
                )}
            </g>
            <text x={60} y={57} textAnchor="middle" fill="var(--text)" fontSize={11} fontWeight={700} fontFamily="Inter, sans-serif">
                {total === 0 ? '0 o' : fmtSize(total)}
            </text>
            <text x={60} y={70} textAnchor="middle" fill="var(--muted)" fontSize={9} fontFamily="Inter, sans-serif">
                utilisé
            </text>
        </svg>
    );
};

// Composant principal

const DashboardPage = (): ReactElement => {
    const navigate     = useNavigate();
    const isMobile     = useIsMobile();
    const user         = useAuthStore((s) => s.user);
    const { openUpload, openNewFolder } = useUiStore();

    // ── Stats — GET /api/dashboard/stats
    const { data: stats, isLoading: loadingStats } = useDashboardStats();

    // ── Fichiers récents — GET /api/dashboard/recent
    const { data: recentFiles = [], isLoading: loadingRecent } = useRecentFiles();

    // Quota lu depuis les stats API (toujours à jour après un upload)
    // Fallback sur le store si les stats ne sont pas encore chargées
    const quotaUsed    = stats?.quotaUsed  ?? user?.quotaUsed  ?? 0;
    const quotaLimit   = stats?.quotaLimit ?? user?.quotaLimit ?? 1;
    const quotaPercent = Math.min(Math.round((quotaUsed / quotaLimit) * 100), 100);

    const categories: StorageCategory[] = buildStorageCategories(stats?.statsByType);

    // URL de l'avatar (backend stocke un chemin relatif comme "/storage/avatars/file.jpg")
    const avatarBaseUrl = (import.meta.env.VITE_API_URL as string).replace(/\/api$/, '');
    const avatarUrl     = user?.avatar ? `${avatarBaseUrl}${user.avatar}` : null;
    const avatarLetter  = user?.firstName?.charAt(0).toUpperCase()
        ?? user?.email?.charAt(0).toUpperCase()
        ?? '?';

    const quickActions: QuickAction[] = [
        { icon: 'create_new_folder', label: 'Nouveau dossier', color: '#34a853', onClick: openNewFolder },
        { icon: 'upload_file',       label: 'Upload',          color: '#005bbf', onClick: openUpload },
        { icon: 'share',             label: 'Partager',        color: '#9e4300', onClick: () => navigate('/shared') },
        { icon: 'folder_open',       label: 'Mon Drive',       color: '#7c3aed', onClick: () => navigate('/drive') },
    ];

    return (
        <div
            className="fade"
            style={{
                maxWidth:      '1060px',
                margin:        '0 auto',
                display:       'flex',
                flexDirection: 'column',
                gap:           '32px',
            }}
        >
            {/* ── Greeting  */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                {/* Avatar utilisateur (image ou initiale) */}
                <div
                    style={{
                        width:          '50px',
                        height:         '50px',
                        borderRadius:   '50%',
                        background:     avatarUrl ? 'transparent' : 'linear-gradient(135deg,#005bbf,#1a73e8)',
                        display:        'flex',
                        alignItems:     'center',
                        justifyContent: 'center',
                        flexShrink:     0,
                        overflow:       'hidden',
                        boxShadow:      '0 4px 14px rgba(0,91,191,.25)',
                        color:          'white',
                        fontSize:       '20px',
                        fontWeight:     700,
                    }}
                >
                    {avatarUrl
                        ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : avatarLetter
                    }
                </div>
                <div>
                    <div
                        style={{
                            fontSize:      '24px',
                            fontWeight:    800,
                            letterSpacing: '-0.02em',
                            color:         'var(--text)',
                        }}
                    >
                        Bonjour, {user?.firstName ?? 'vous'} 👋
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '2px' }}>
                        {user?.email ?? ''}
                    </div>
                </div>
            </div>

            {/* ── Statistiques */}
            <div
                style={{
                    display:             'grid',
                    gridTemplateColumns: isMobile ? '1fr' : '1fr 2fr',
                    gap:                 '18px',
                }}
            >
                {/* Carte quota */}
                <div
                    style={{
                        background:    'var(--surface)',
                        borderRadius:  '18px',
                        padding:       '22px',
                        border:        '1px solid var(--border)',
                        display:       'flex',
                        flexDirection: 'column',
                        gap:           '18px',
                    }}
                >
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div
                            style={{
                                width:          '44px',
                                height:         '44px',
                                borderRadius:   '12px',
                                background:     'linear-gradient(135deg,#005bbf,#1a73e8)',
                                display:        'flex',
                                alignItems:     'center',
                                justifyContent: 'center',
                                flexShrink:     0,
                            }}
                        >
                            <MaterialIcon n="cloud" s={22} c="white" />
                        </div>
                        <div>
                            <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 500 }}>
                                Espace utilisé
                            </div>
                            <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text)', lineHeight: 1.1 }}>
                                {loadingStats ? '…' : fmtSize(quotaUsed)}
                            </div>
                            <div style={{ fontSize: '12px', color: '#34a853', fontWeight: 700 }}>
                                / {fmtSize(quotaLimit)}
                            </div>
                        </div>
                    </div>

                    <div>
                        <div
                            style={{
                                background:   'var(--mid)',
                                borderRadius: '9999px',
                                height:       '7px',
                                overflow:     'hidden',
                            }}
                        >
                            <div className="progress" style={{ width: `${quotaPercent}%` }} />
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '6px' }}>
                            {quotaPercent}% utilisé
                        </div>
                    </div>
                </div>

                {/* Carte répartition */}
                <div
                    style={{
                        background:   'var(--surface)',
                        borderRadius: '18px',
                        padding:      '22px',
                        border:       '1px solid var(--border)',
                    }}
                >
                    <div
                        style={{
                            fontSize:      '11px',
                            fontWeight:    700,
                            textTransform: 'uppercase',
                            letterSpacing: '.08em',
                            color:         'var(--muted)',
                            marginBottom:  '16px',
                        }}
                    >
                        Répartition du stockage
                    </div>

                    {loadingStats ? (
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                            <div style={{ width: 116, height: 116, borderRadius: '50%', background: 'var(--low)', flexShrink: 0 }} />
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} style={{ height: '14px', borderRadius: '6px', background: 'var(--low)', opacity: 0.7 }} />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                            {/* Donut SVG */}
                            <DonutChart categories={categories} total={quotaUsed} />

                            {/* Légende */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '9px' }}>
                                {categories.map((cat) => (
                                    <div key={cat.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                width: '9px', height: '9px',
                                                borderRadius: '2px',
                                                background: cat.color,
                                                flexShrink: 0,
                                            }} />
                                            <span style={{ fontSize: '12px', color: 'var(--text)', fontWeight: 500 }}>
                                                {cat.label}
                                            </span>
                                        </div>
                                        <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600, flexShrink: 0 }}>
                                            {fmtSize(cat.rawBytes)}
                                        </span>
                                    </div>
                                ))}

                                {/* Barre proportionnelle */}
                                {quotaUsed > 0 && (
                                    <div style={{
                                        height:       '5px',
                                        borderRadius: '9999px',
                                        overflow:     'hidden',
                                        display:      'flex',
                                        background:   'var(--mid)',
                                        marginTop:    '4px',
                                    }}>
                                        {categories.filter((c) => c.rawBytes > 0).map((cat) => (
                                            <div
                                                key={cat.label}
                                                style={{
                                                    width:      `${(cat.rawBytes / quotaUsed) * 100}%`,
                                                    background: cat.color,
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Fichiers récents */}
            <div>
                <div
                    style={{
                        display:        'flex',
                        justifyContent: 'space-between',
                        alignItems:     'center',
                        marginBottom:   '12px',
                    }}
                >
                    <div
                        style={{
                            fontSize:      '11px',
                            fontWeight:    700,
                            textTransform: 'uppercase',
                            letterSpacing: '.12em',
                            color:         'var(--muted)',
                        }}
                    >
                        Fichiers récents
                    </div>
                    <button
                        onClick={() => navigate('/drive')}
                        style={{
                            background:    'none',
                            border:        'none',
                            cursor:        'pointer',
                            fontSize:      '11px',
                            fontWeight:    700,
                            textTransform: 'uppercase',
                            letterSpacing: '.08em',
                            color:         '#005bbf',
                            fontFamily:    'Inter, sans-serif',
                        }}
                    >
                        Voir tout
                    </button>
                </div>

                <div
                    style={{
                        background:   'var(--surface)',
                        borderRadius: '14px',
                        overflow:     'hidden',
                        border:       '1px solid var(--border)',
                    }}
                >
                    {loadingRecent ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <div
                                key={i}
                                style={{
                                    display:      'flex',
                                    alignItems:   'center',
                                    gap:          '12px',
                                    padding:      '13px 18px',
                                    borderBottom: i < 4 ? '1px solid var(--border)' : 'none',
                                }}
                            >
                                <div style={{ width: '38px', height: '38px', borderRadius: '9px', background: 'var(--mid)', flexShrink: 0 }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ height: '12px', background: 'var(--mid)', borderRadius: '4px', width: '55%', marginBottom: '6px' }} />
                                    <div style={{ height: '10px', background: 'var(--low)', borderRadius: '4px', width: '30%' }} />
                                </div>
                            </div>
                        ))
                    ) : recentFiles.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
                            <MaterialIcon n="folder_open" s={48} c="var(--muted)" />
                            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginTop: '10px' }}>
                                Aucun fichier récent
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                                Uploadez vos premiers fichiers depuis Mon Drive
                            </div>
                        </div>
                    ) : (
                        recentFiles.slice(0, 5).map((file: FileItem, idx: number) => {
                            const { icon, color } = getMimeInfo(file.mimeType);
                            const isLast = idx === Math.min(recentFiles.length, 5) - 1;
                            return (
                                <div
                                    key={file.id}
                                    className="row-hover"
                                    onClick={() => navigate(`/drive/preview/${file.id}`)}
                                    style={{
                                        display:      'flex',
                                        alignItems:   'center',
                                        gap:          '12px',
                                        padding:      '13px 18px',
                                        borderBottom: isLast ? 'none' : '1px solid var(--border)',
                                        cursor:       'pointer',
                                    }}
                                >
                                    <div
                                        style={{
                                            width:          '38px',
                                            height:         '38px',
                                            borderRadius:   '9px',
                                            background:     `${color}18`,
                                            display:        'flex',
                                            alignItems:     'center',
                                            justifyContent: 'center',
                                            flexShrink:     0,
                                        }}
                                    >
                                        <MaterialIcon n={icon} s={19} c={color} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div
                                            style={{
                                                fontSize:     '13px',
                                                fontWeight:   600,
                                                color:        'var(--text)',
                                                whiteSpace:   'nowrap',
                                                overflow:     'hidden',
                                                textOverflow: 'ellipsis',
                                            }}
                                        >
                                            {file.name}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                                            {fmtDate(file.updatedAt)} · {fmtSize(file.size)}
                                        </div>
                                    </div>
                                    <MaterialIcon n="open_in_new" s={15} c="var(--muted)" />
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ── Actions rapides */}
            <div>
                <div
                    style={{
                        fontSize:      '11px',
                        fontWeight:    700,
                        textTransform: 'uppercase',
                        letterSpacing: '.12em',
                        color:         'var(--muted)',
                        marginBottom:  '12px',
                    }}
                >
                    Actions rapides
                </div>
                <div
                    style={{
                        display:             'grid',
                        gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)',
                        gap:                 '10px',
                    }}
                >
                    {quickActions.map((action) => (
                        <button
                            key={action.label}
                            onClick={action.onClick}
                            style={{
                                background:    'var(--surface)',
                                border:        '1px solid var(--border)',
                                borderRadius:  '12px',
                                padding:       '16px 12px',
                                cursor:        'pointer',
                                display:       'flex',
                                flexDirection: 'column',
                                alignItems:    'center',
                                gap:           '8px',
                                transition:    'all .2s',
                                fontFamily:    'Inter, sans-serif',
                            }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.transform  = 'translateY(-3px)';
                                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 24px rgba(0,0,0,.08)';
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.transform  = '';
                                (e.currentTarget as HTMLButtonElement).style.boxShadow = '';
                            }}
                        >
                            <div
                                style={{
                                    width:          '40px',
                                    height:         '40px',
                                    borderRadius:   '10px',
                                    background:     `${action.color}15`,
                                    display:        'flex',
                                    alignItems:     'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <MaterialIcon n={action.icon} s={20} c={action.color} />
                            </div>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>
                                {action.label}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;