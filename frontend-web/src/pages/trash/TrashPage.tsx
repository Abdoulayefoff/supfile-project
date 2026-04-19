// Corbeille : liste fichiers/dossiers supprimés, restauration, suppression déf.
// GET    /api/trash
// POST   /api/trash/files/{id}/restore
// POST   /api/trash/folders/{id}/restore
// DELETE /api/trash/files/{id}
// DELETE /api/trash/folders/{id}

import { useState }          from 'react';
import type { ReactElement } from 'react';
import {
    useTrashList,
    useRestoreFile,
    useRestoreFolder,
    usePermanentDeleteFile,
    usePermanentDeleteFolder,
} from '@/hooks/useTrash';
import type { TrashItem } from '@/services/trashService';
import { getMimeInfo, fmtSize, fmtDate } from '@/lib/utils';
import { MaterialIcon }                  from '@/components/ui/MaterialIcon';

// ── Composant principal
export const TrashPage = (): ReactElement => {
    // ── GET /api/trash ──
    const { data, isLoading, isError } = useTrashList();

    const files   = data?.files   ?? [];
    const folders = data?.folders ?? [];
    const isEmpty = files.length === 0 && folders.length === 0;

    // ── Modal confirmation suppression définitive ──
    const [confirmItem, setConfirmItem] = useState<{
        id:   number;
        name: string;
        type: 'file' | 'folder';
    } | null>(null);

    // ── Hooks mutations ──
    const restoreFileMutation          = useRestoreFile();
    const restoreFolderMutation        = useRestoreFolder();
    const permanentDeleteFileMutation   = usePermanentDeleteFile();
    const permanentDeleteFolderMutation = usePermanentDeleteFolder();

    const handlePermanentDelete = () => {
        if (!confirmItem) return;
        if (confirmItem.type === 'file') {
            permanentDeleteFileMutation.mutate(confirmItem.id, {
                onSuccess: () => setConfirmItem(null),
            });
        } else {
            permanentDeleteFolderMutation.mutate(confirmItem.id, {
                onSuccess: () => setConfirmItem(null),
            });
        }
    };

    const isPendingDelete =
        permanentDeleteFileMutation.isPending || permanentDeleteFolderMutation.isPending;

    return (
        <div className="fade" style={{ maxWidth: '900px', margin: '0 auto' }}>
            {/* ── En-tête ── */}
            <div
                style={{
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'space-between',
                    marginBottom:   '28px',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                        style={{
                            width:          '40px',
                            height:         '40px',
                            borderRadius:   '12px',
                            background:     'rgba(186,26,26,.08)',
                            display:        'flex',
                            alignItems:     'center',
                            justifyContent: 'center',
                        }}
                    >
                        <MaterialIcon n="delete" s={22} c="#ba1a1a" />
                    </div>
                    <div>
                        <div style={{ fontSize: '21px', fontWeight: 800, color: 'var(--text)' }}>
                            Corbeille
                        </div>
                        {!isLoading && !isEmpty && (
                            <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '1px' }}>
                                {files.length + folders.length} élément{files.length + folders.length > 1 ? 's' : ''}
                            </div>
                        )}
                    </div>
                </div>

                {!isEmpty && !isLoading && (
                    <div
                        style={{
                            fontSize:     '12px',
                            color:        'var(--muted)',
                            padding:      '8px 14px',
                            background:   'var(--low)',
                            borderRadius: '9999px',
                            display:      'flex',
                            alignItems:   'center',
                            gap:          '6px',
                        }}
                    >
                        <MaterialIcon n="info" s={14} c="var(--muted)" />
                        Les éléments supprimés sont conservés indéfiniment
                    </div>
                )}
            </div>

            {/* ── Skeleton ── */}
            {isLoading && <TrashSkeleton />}

            {/* ── Erreur ── */}
            {isError && (
                <div
                    style={{
                        textAlign:    'center',
                        paddingTop:   '60px',
                        color:        '#ba1a1a',
                        display:      'flex',
                        flexDirection: 'column',
                        alignItems:   'center',
                        gap:          '10px',
                        opacity:      0.7,
                    }}
                >
                    <MaterialIcon n="error_outline" s={44} c="#ba1a1a" />
                    <div style={{ fontSize: '15px', fontWeight: 600 }}>
                        Impossible de charger la corbeille
                    </div>
                </div>
            )}

            {/* ── Corbeille vide ── */}
            {!isLoading && !isError && isEmpty && <EmptyTrash />}

            {/* ── Contenu ── */}
            {!isLoading && !isError && !isEmpty && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                    {/* Dossiers supprimés */}
                    {folders.length > 0 && (
                        <section>
                            <SectionLabel icon="folder" count={folders.length}>
                                Dossiers
                            </SectionLabel>
                            <TrashList
                                items={folders}
                                type="folder"
                                onRestore={(id) => restoreFolderMutation.mutate(id)}
                                onDelete={(item) => setConfirmItem({ ...item, type: 'folder' })}
                                restoringId={restoreFolderMutation.isPending
                                    ? (restoreFolderMutation.variables as number)
                                    : null}
                            />
                        </section>
                    )}

                    {/* Fichiers supprimés */}
                    {files.length > 0 && (
                        <section>
                            <SectionLabel icon="insert_drive_file" count={files.length}>
                                Fichiers
                            </SectionLabel>
                            <TrashList
                                items={files}
                                type="file"
                                onRestore={(id) => restoreFileMutation.mutate(id)}
                                onDelete={(item) => setConfirmItem({ ...item, type: 'file' })}
                                restoringId={restoreFileMutation.isPending
                                    ? (restoreFileMutation.variables as number)
                                    : null}
                            />
                        </section>
                    )}
                </div>
            )}

            {/* ── Modal confirmation suppression définitive ── */}
            {confirmItem && (
                <ConfirmDeleteModal
                    name={confirmItem.name}
                    type={confirmItem.type}
                    isPending={isPendingDelete}
                    onConfirm={handlePermanentDelete}
                    onCancel={() => setConfirmItem(null)}
                />
            )}
        </div>
    );
};

// ── Sous-composants

// Libellé de section
interface SectionLabelProps {
    icon:     string;
    count:    number;
    children: React.ReactNode;
}

const SectionLabel = ({ icon, count, children }: SectionLabelProps): ReactElement => (
    <div
        style={{
            display:      'flex',
            alignItems:   'center',
            gap:          '8px',
            marginBottom: '12px',
        }}
    >
        <MaterialIcon n={icon} s={16} c="var(--muted)" />
        <span
            style={{
                fontSize:      '11px',
                fontWeight:    700,
                textTransform: 'uppercase',
                letterSpacing: '.12em',
                color:         'var(--muted)',
            }}
        >
            {children}
        </span>
        <span
            style={{
                fontSize:     '11px',
                fontWeight:   600,
                color:        'var(--muted)',
                background:   'var(--low)',
                borderRadius: '9999px',
                padding:      '1px 8px',
            }}
        >
            {count}
        </span>
    </div>
);

// Liste des éléments de la corbeille
interface TrashListProps {
    items:       TrashItem[];
    type:        'file' | 'folder';
    onRestore:   (id: number) => void;
    onDelete:    (item: { id: number; name: string }) => void;
    restoringId: number | null;
}

const TrashList = ({
    items,
    type,
    onRestore,
    onDelete,
    restoringId,
}: TrashListProps): ReactElement => (
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
                gridTemplateColumns: '1fr 130px 150px',
                padding:             '11px 18px',
                background:          'var(--low)',
                borderBottom:        '1px solid var(--border)',
            }}
        >
            {['Nom', 'Supprimé le', 'Actions'].map((col) => (
                <div
                    key={col}
                    style={{
                        fontSize:      '11px',
                        fontWeight:    700,
                        textTransform: 'uppercase',
                        letterSpacing: '.10em',
                        color:         'var(--muted)',
                        textAlign:     col === 'Actions' ? 'right' : 'left',
                    }}
                >
                    {col}
                </div>
            ))}
        </div>

        {/* Lignes */}
        {items.map((item, idx) => {
            const isLast      = idx === items.length - 1;
            const isRestoring = restoringId === item.id;
            const { icon, color } = type === 'file'
                ? getMimeInfo(item.mimeType ?? '')
                : { icon: 'folder', color: 'var(--muted)' };

            return (
                <div
                    key={item.id}
                    style={{
                        display:             'grid',
                        gridTemplateColumns: '1fr 130px 150px',
                        padding:             '13px 18px',
                        alignItems:          'center',
                        borderBottom:        isLast ? 'none' : '1px solid var(--border)',
                        opacity:             isRestoring ? 0.5 : 1,
                        transition:          'opacity .2s',
                    }}
                >
                    {/* Nom */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <MaterialIcon n={icon} s={19} c={color} />
                        <div style={{ minWidth: 0 }}>
                            <div
                                style={{
                                    fontSize:     '13px',
                                    fontWeight:   500,
                                    color:        'var(--text)',
                                    whiteSpace:   'nowrap',
                                    overflow:     'hidden',
                                    textOverflow: 'ellipsis',
                                    maxWidth:     '320px',
                                }}
                            >
                                {item.name}
                            </div>
                            {type === 'file' && item.size !== undefined && (
                                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '1px' }}>
                                    {fmtSize(item.size)}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Date suppression */}
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                        {item.deletedAt ? fmtDate(item.deletedAt) : '—'}
                    </div>

                    {/* Actions */}
                    <div
                        style={{
                            display:        'flex',
                            justifyContent: 'flex-end',
                            gap:            '6px',
                        }}
                    >
                        {/* Restaurer */}
                        <button
                            onClick={() => onRestore(item.id)}
                            disabled={isRestoring}
                            title="Restaurer"
                            style={{
                                display:      'flex',
                                alignItems:   'center',
                                gap:          '5px',
                                padding:      '6px 13px',
                                borderRadius: '9999px',
                                border:       'none',
                                background:   'rgba(0,91,191,.08)',
                                color:        '#005bbf',
                                cursor:       isRestoring ? 'not-allowed' : 'pointer',
                                fontSize:     '12px',
                                fontWeight:   600,
                                fontFamily:   'Inter, sans-serif',
                                transition:   'background .15s',
                            }}
                        >
                            <MaterialIcon
                                n={isRestoring ? 'hourglass_empty' : 'restore'}
                                s={14}
                                c="#005bbf"
                            />
                            {isRestoring ? 'Restauration…' : 'Restaurer'}
                        </button>

                        {/* Supprimer définitivement */}
                        <button
                            onClick={() => onDelete({ id: item.id, name: item.name })}
                            title="Supprimer définitivement"
                            style={{
                                display:      'flex',
                                alignItems:   'center',
                                justifyContent: 'center',
                                width:        '32px',
                                height:       '32px',
                                borderRadius: '9999px',
                                border:       'none',
                                background:   'rgba(186,26,26,.07)',
                                cursor:       'pointer',
                                transition:   'background .15s',
                            }}
                        >
                            <MaterialIcon n="delete_forever" s={16} c="#ba1a1a" />
                        </button>
                    </div>
                </div>
            );
        })}
    </div>
);

// Corbeille vide
const EmptyTrash = (): ReactElement => (
    <div style={{ textAlign: 'center', paddingTop: '80px', opacity: 0.45 }}>
        <MaterialIcon n="delete_sweep" s={64} c="var(--muted)" />
        <div
            style={{
                fontSize:   '15px',
                fontWeight: 600,
                color:      'var(--text)',
                marginTop:  '16px',
            }}
        >
            Corbeille vide
        </div>
        <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>
            Les fichiers et dossiers supprimés apparaîtront ici
        </div>
    </div>
);

// Skeleton loader
const TrashSkeleton = (): ReactElement => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {Array.from({ length: 5 }).map((_, i) => (
            <div
                key={i}
                style={{
                    height:       '54px',
                    borderRadius: '12px',
                    background:   'var(--low)',
                    opacity:      0.6,
                }}
            />
        ))}
    </div>
);

// Modal de confirmation de suppression définitive
interface ConfirmDeleteModalProps {
    name:      string;
    type:      'file' | 'folder';
    isPending: boolean;
    onConfirm: () => void;
    onCancel:  () => void;
}

const ConfirmDeleteModal = ({
    name,
    type,
    isPending,
    onConfirm,
    onCancel,
}: ConfirmDeleteModalProps): ReactElement => (
    <div
        onClick={onCancel}
        style={{
            position:       'fixed',
            inset:          0,
            zIndex:         200,
            background:     'rgba(0,0,0,.45)',
            backdropFilter: 'blur(6px)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
        }}
    >
        <div
            className="fade"
            onClick={(e) => e.stopPropagation()}
            style={{
                background:   'var(--surface)',
                borderRadius: '22px',
                padding:      '28px',
                width:        '420px',
                boxShadow:    '0 24px 80px rgba(0,0,0,.2)',
                border:       '1px solid var(--border)',
            }}
        >
            {/* Icône */}
            <div
                style={{
                    width:          '48px',
                    height:         '48px',
                    borderRadius:   '14px',
                    background:     'rgba(186,26,26,.10)',
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    marginBottom:   '18px',
                }}
            >
                <MaterialIcon n="delete_forever" s={26} c="#ba1a1a" />
            </div>

            <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
                Suppression définitive
            </div>
            <div style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.5, marginBottom: '22px' }}>
                {`Êtes-vous sûr de vouloir supprimer définitivement `}
                <strong style={{ color: 'var(--text)' }}>{name}</strong>
                {` ? Cette action est `}
                <strong style={{ color: '#ba1a1a' }}>irréversible</strong>.
                {type === 'folder' && ' Tous les fichiers contenus seront également supprimés.'}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                    onClick={onCancel}
                    style={{
                        background:   'none',
                        border:       '1px solid var(--border)',
                        borderRadius: '9999px',
                        padding:      '9px 20px',
                        fontSize:     '14px',
                        fontWeight:   600,
                        color:        'var(--muted)',
                        cursor:       'pointer',
                        fontFamily:   'Inter, sans-serif',
                    }}
                >
                    Annuler
                </button>
                <button
                    onClick={onConfirm}
                    disabled={isPending}
                    style={{
                        background:   'linear-gradient(135deg,#ba1a1a,#d63031)',
                        border:       'none',
                        borderRadius: '9999px',
                        padding:      '9px 22px',
                        fontSize:     '14px',
                        fontWeight:   600,
                        color:        'white',
                        cursor:       isPending ? 'not-allowed' : 'pointer',
                        opacity:      isPending ? 0.65 : 1,
                        display:      'inline-flex',
                        alignItems:   'center',
                        gap:          '6px',
                        fontFamily:   'Inter, sans-serif',
                        boxShadow:    '0 4px 16px rgba(186,26,26,.3)',
                        transition:   'all .2s',
                    }}
                >
                    {isPending
                        ? <MaterialIcon n="hourglass_empty" s={16} c="white" />
                        : <MaterialIcon n="delete_forever" s={16} c="white" />
                    }
                    {isPending ? 'Suppression…' : 'Supprimer'}
                </button>
            </div>
        </div>
    </div>
);
