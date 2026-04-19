// Page des partages reçus — fichiers/dossiers partagés avec l'utilisateur
// Route : /shared
// API   : GET /api/shares/received → partages privés reçus par l'utilisateur

import type { ReactElement }  from 'react';
import { useNavigate }        from 'react-router-dom';
import { MaterialIcon }       from '@/components/ui/MaterialIcon';
import { fmtDate, getMimeInfo } from '@/lib/utils';
import { useReceivedShares }  from '@/hooks/useShares';
import type { ReceivedShare } from '@/services/shareService';

// Composant principal
export const SharedPage = (): ReactElement => {
    const navigate                          = useNavigate();
    const { data: shares = [], isLoading }  = useReceivedShares();

    return (
        <div
            className="fade"
            style={{ maxWidth: '860px', margin: '0 auto' }}
        >
            {/* ── Titre ── */}
            <div
                style={{
                    fontSize:     '24px',
                    fontWeight:   800,
                    color:        'var(--text)',
                    marginBottom: '22px',
                }}
            >
                Partagés avec moi
            </div>

            {/* ── Skeleton ── */}
            {isLoading && <SharedSkeleton />}

            {/* ── État vide ── */}
            {!isLoading && shares.length === 0 && (
                <EmptyState />
            )}

            {/* ── Tableau ── */}
            {!isLoading && shares.length > 0 && (
                <div
                    style={{
                        background:   'var(--surface)',
                        borderRadius: '14px',
                        overflow:     'hidden',
                        border:       '1px solid var(--border)',
                    }}
                >
                    {/* En-tête */}
                    <div
                        style={{
                            display:             'grid',
                            gridTemplateColumns: '1fr 140px 120px 36px',
                            padding:             '11px 18px',
                            background:          'var(--low)',
                            borderBottom:        '1px solid var(--border)',
                        }}
                    >
                        {(['Nom', 'Partagé par', 'Modifié', ''] as const).map((col) => (
                            <div
                                key={col}
                                style={{
                                    fontSize:      '11px',
                                    fontWeight:    700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '.10em',
                                    color:         'var(--muted)',
                                }}
                            >
                                {col}
                            </div>
                        ))}
                    </div>

                    {/* Lignes */}
                    {shares.map((share, idx) => (
                        <SharedRow
                            key={share.id}
                            share={share}
                            isLast={idx === shares.length - 1}
                            onOpen={() => {
                                if (!share.resource) return;
                                if (share.resourceType === 'file') {
                                    navigate(`/drive/preview/${share.resource.id}`);
                                } else {
                                    navigate(`/drive/folder/${share.resource.id}`);
                                }
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// Sous-composant — Ligne de partage
interface SharedRowProps {
    share:  ReceivedShare;
    isLast: boolean;
    onOpen: () => void;
}

const SharedRow = ({ share, isLast, onOpen }: SharedRowProps): ReactElement => {
    const isFolder = share.resourceType === 'folder';
    const mimeType = share.resource?.mimeType ?? '';
    const { icon: mimeIcon, color: mimeColor } = getMimeInfo(mimeType);

    // Initiale de la personne qui a partagé (createdBy = l'expéditeur)
    const ownerInitial = share.createdBy.fullName?.charAt(0).toUpperCase() ?? '?';

    // Nom de la personne qui a partagé
    const ownerName = share.createdBy.fullName || share.createdBy.email;

    return (
        <div
            className="row-hover"
            onClick={onOpen}
            style={{
                display:             'grid',
                gridTemplateColumns: '1fr 140px 120px 36px',
                padding:             '12px 18px',
                alignItems:          'center',
                borderBottom:        isLast ? 'none' : '1px solid var(--border)',
                cursor:              share.resource ? 'pointer' : 'default',
            }}
            onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background =
                    'rgba(0,91,191,.03)';
            }}
            onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = 'transparent';
            }}
        >
            {/* ── Colonne Nom ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <MaterialIcon
                    n={isFolder ? 'folder' : mimeIcon}
                    s={19}
                    c={isFolder ? 'var(--muted)' : mimeColor}
                />
                <span
                    style={{
                        fontSize:     '13px',
                        fontWeight:   500,
                        color:        'var(--text)',
                        overflow:     'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace:   'nowrap',
                    }}
                >
                    {share.resource?.name ?? '—'}
                </span>
            </div>

            {/* ── Colonne Partagé par ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Avatar mini */}
                <div
                    style={{
                        width:          '22px',
                        height:         '22px',
                        borderRadius:   '50%',
                        background:     'linear-gradient(135deg,#005bbf,#1a73e8)',
                        display:        'flex',
                        alignItems:     'center',
                        justifyContent: 'center',
                        color:          'white',
                        fontSize:       '10px',
                        fontWeight:     700,
                        flexShrink:     0,
                    }}
                >
                    {ownerInitial}
                </div>
                <span
                    style={{
                        fontSize:     '12px',
                        color:        'var(--muted)',
                        overflow:     'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace:   'nowrap',
                    }}
                >
                    {ownerName}
                </span>
            </div>

            {/* ── Colonne Modifié ── */}
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                {fmtDate(share.createdAt)}
            </div>

            {/* ── Colonne action ── */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <MaterialIcon n="open_in_new" s={15} c="var(--muted)" />
            </div>
        </div>
    );
};

// Sous-composant — État vide
const EmptyState = (): ReactElement => (
    <div
        style={{
            textAlign:   'center',
            paddingTop:  '72px',
            paddingBottom: '72px',
            opacity:     0.5,
        }}
    >
        <MaterialIcon n="folder_shared" s={60} c="var(--muted)" />
        <div
            style={{
                fontSize:   '15px',
                fontWeight: 600,
                color:      'var(--text)',
                marginTop:  '14px',
            }}
        >
            Aucun partage reçu
        </div>
        <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>
            Les fichiers partagés avec vous apparaîtront ici.
        </div>
    </div>
);

// Sous-composant — Skeleton chargement
const SharedSkeleton = (): ReactElement => (
    <div
        style={{
            background:   'var(--surface)',
            borderRadius: '14px',
            overflow:     'hidden',
            border:       '1px solid var(--border)',
        }}
    >
        {/* En-tête skeleton */}
        <div
            style={{
                padding:    '11px 18px',
                background: 'var(--low)',
                borderBottom: '1px solid var(--border)',
            }}
        >
            <div style={{ width: '200px', height: '12px', borderRadius: '6px', background: 'var(--mid)' }} />
        </div>

        {/* Lignes skeleton */}
        {Array.from({ length: 4 }).map((_, i) => (
            <div
                key={i}
                style={{
                    display:             'grid',
                    gridTemplateColumns: '1fr 140px 120px 36px',
                    padding:             '14px 18px',
                    alignItems:          'center',
                    borderBottom:        i < 3 ? '1px solid var(--border)' : 'none',
                    gap:                 '12px',
                }}
            >
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ width: '19px', height: '19px', borderRadius: '4px', background: 'var(--mid)', flexShrink: 0 }} />
                    <div style={{ flex: 1, height: '13px', borderRadius: '6px', background: 'var(--mid)' }} />
                </div>
                <div style={{ height: '13px', borderRadius: '6px', background: 'var(--mid)' }} />
                <div style={{ height: '13px', borderRadius: '6px', background: 'var(--mid)' }} />
                <div style={{ width: '15px', height: '15px', borderRadius: '4px', background: 'var(--mid)' }} />
            </div>
        ))}
    </div>
);