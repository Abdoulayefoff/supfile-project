// Modal de déplacement d'un fichier ou dossier vers un autre dossier.
// API fichier  : PATCH /api/files/{id}/move    { targetFolderId: id | null }
// API dossier  : PATCH /api/folders/{id}/move  { targetParentId: id | null }
// Navigation   : GET /api/folders?parentId=X

import { useState }          from 'react';
import type { ReactElement } from 'react';

import { useFolderBrowse, useMoveFolder } from '@/hooks/useFolders';
import { useMoveFile }                    from '@/hooks/useFiles';
import { MaterialIcon }                   from '@/components/ui/MaterialIcon';
import type { Folder }                    from '@/types';

// Types
interface MoveModalProps {
    type:        'file' | 'folder';
    targetId:    number;
    targetName:  string;
    /** ID du dossier parent actuel (undefined = racine) */
    currentFolderId?: number;
    onClose:     () => void;
}

interface BreadcrumbItem {
    id:   number | null;   // null = racine
    name: string;
}

// Composant

export const MoveModal = ({
    type,
    targetId,
    targetName,
    currentFolderId,
    onClose,
}: MoveModalProps): ReactElement => {
    const moveFileMutation   = useMoveFile();
    const moveFolderMutation = useMoveFolder();

    // ── Navigation dans l'arborescence ──
    const [browseFolderId, setBrowseFolderId] = useState<number | null>(null);
    const [breadcrumb, setBreadcrumb]         = useState<BreadcrumbItem[]>([]);
    const [selectedId, setSelectedId]         = useState<number | null | undefined>(undefined);

    // ── Dossiers du niveau courant — GET /api/folders?parentId=X ──
    const { data: folders = [], isLoading } = useFolderBrowse(browseFolderId);

    // Exclut le dossier qu'on déplace lui-même de la liste
    const visibleFolders = type === 'folder'
        ? folders.filter((f: Folder) => f.id !== targetId)
        : folders;

    // ── Mutation déplacement ──
    const mutation = {
        isPending: moveFileMutation.isPending || moveFolderMutation.isPending,
        mutate: () => {
            if (type === 'file') {
                moveFileMutation.mutate(
                    { fileId: targetId, params: { targetFolderId: selectedId ?? null } },
                    { onSuccess: onClose }
                );
            } else {
                moveFolderMutation.mutate(
                    { folderId: targetId, params: { targetParentId: selectedId ?? null } },
                    { onSuccess: onClose }
                );
            }
        },
    };

    // ── Navigation : entrer dans un dossier ──
    const enterFolder = (folder: Folder) => {
        setBrowseFolderId(folder.id);
        setBreadcrumb((prev) => [...prev, { id: folder.id, name: folder.name }]);
        setSelectedId(undefined);
    };

    // ── Navigation : breadcrumb vers un niveau précédent ──
    const navigateTo = (index: number) => {
        const item = index === -1
            ? { id: null, name: 'Mon Drive' }
            : breadcrumb[index];

        setBrowseFolderId(item.id);
        setBreadcrumb((prev) => prev.slice(0, index + 1));
        setSelectedId(undefined);
    };

    // La destination sélectionnée est-elle identique à l'emplacement actuel ?
    const isSameLocation = selectedId === undefined
        ? browseFolderId === (currentFolderId ?? null)
        : selectedId === (currentFolderId ?? null);

    // Libellé de la destination pour l'affichage
    const destinationLabel = selectedId === null || (selectedId === undefined && browseFolderId === null)
        ? 'Mon Drive (racine)'
        : selectedId !== undefined
            ? breadcrumb.find((b) => b.id === selectedId)?.name ?? 'Dossier sélectionné'
            : breadcrumb[breadcrumb.length - 1]?.name ?? 'Mon Drive (racine)';

    return (
        // ── Overlay ──
        <div
            onClick={onClose}
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
            {/* ── Carte ── */}
            <div
                className="fade"
                onClick={(e) => e.stopPropagation()}
                style={{
                    background:   'var(--surface)',
                    borderRadius: '22px',
                    padding:      '28px',
                    width:        '480px',
                    boxShadow:    '0 24px 80px rgba(0,0,0,.2)',
                    border:       '1px solid var(--border)',
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display:        'flex',
                        justifyContent: 'space-between',
                        alignItems:     'center',
                        marginBottom:   '20px',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                            style={{
                                width:          '36px',
                                height:         '36px',
                                borderRadius:   '10px',
                                background:     'rgba(0,91,191,.10)',
                                display:        'flex',
                                alignItems:     'center',
                                justifyContent: 'center',
                            }}
                        >
                            <MaterialIcon n="drive_file_move" s={20} c="#005bbf" />
                        </div>
                        <span style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)' }}>
                            Déplacer vers…
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background:   'none',
                            border:       'none',
                            cursor:       'pointer',
                            padding:      '4px',
                            borderRadius: '9999px',
                            display:      'flex',
                        }}
                    >
                        <MaterialIcon n="close" s={18} c="var(--muted)" />
                    </button>
                </div>

                {/* Élément déplacé */}
                <div
                    style={{
                        display:      'flex',
                        alignItems:   'center',
                        gap:          '8px',
                        padding:      '10px 12px',
                        background:   'var(--low)',
                        borderRadius: '10px',
                        marginBottom: '14px',
                    }}
                >
                    <MaterialIcon
                        n={type === 'folder' ? 'folder' : 'insert_drive_file'}
                        s={16}
                        c="var(--muted)"
                    />
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                        Déplacement de : <strong style={{ color: 'var(--text)' }}>{targetName}</strong>
                    </span>
                </div>

                {/* Navigateur de dossiers */}
                <div
                    style={{
                        border:       '1px solid var(--border)',
                        borderRadius: '12px',
                        overflow:     'hidden',
                        maxHeight:    '280px',
                        overflowY:    'auto',
                    }}
                >
                    {/* En-tête breadcrumb */}
                    <div
                        style={{
                            display:      'flex',
                            alignItems:   'center',
                            gap:          '6px',
                            padding:      '10px 14px',
                            background:   'var(--low)',
                            borderBottom: '1px solid var(--border)',
                            flexWrap:     'wrap',
                        }}
                    >
                        {/* Lien racine */}
                        <button
                            onClick={() => navigateTo(-1)}
                            style={{
                                background:  'none',
                                border:      'none',
                                cursor:      'pointer',
                                fontSize:    '12px',
                                fontWeight:  600,
                                color:       '#005bbf',
                                fontFamily:  'Inter, sans-serif',
                                padding:     0,
                            }}
                        >
                            Mon Drive
                        </button>

                        {/* Niveaux du breadcrumb */}
                        {breadcrumb.map((item, idx) => (
                            <span
                                key={item.id}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                                <MaterialIcon n="chevron_right" s={13} c="var(--muted)" />
                                <button
                                    onClick={() => navigateTo(idx)}
                                    style={{
                                        background: 'none',
                                        border:     'none',
                                        cursor:     'pointer',
                                        fontSize:   '12px',
                                        fontWeight: 500,
                                        color:      'var(--muted)',
                                        fontFamily: 'Inter, sans-serif',
                                        padding:    0,
                                    }}
                                >
                                    {item.name}
                                </button>
                            </span>
                        ))}
                    </div>

                    {/* Ligne racine */}
                    <div
                        onClick={() => setSelectedId(null)}
                        style={{
                            padding:     '11px 16px',
                            display:     'flex',
                            alignItems:  'center',
                            gap:         '10px',
                            background:  selectedId === null ? 'rgba(0,91,191,.06)' : 'transparent',
                            borderLeft:  selectedId === null ? '3px solid #005bbf' : '3px solid transparent',
                            cursor:      'pointer',
                            borderBottom:'1px solid var(--border)',
                        }}
                    >
                        <MaterialIcon
                            n="home"
                            s={17}
                            c={selectedId === null ? '#005bbf' : 'var(--muted)'}
                        />
                        <span
                            style={{
                                fontSize:   '13px',
                                fontWeight: 600,
                                color:      selectedId === null ? '#005bbf' : 'var(--muted)',
                            }}
                        >
                            Mon Drive (racine)
                        </span>
                    </div>

                    {/* Chargement */}
                    {isLoading && (
                        <div style={{ padding: '16px', textAlign: 'center' }}>
                            <MaterialIcon n="hourglass_empty" s={20} c="var(--muted)" />
                        </div>
                    )}

                    {/* Liste des dossiers */}
                    {!isLoading && visibleFolders.length === 0 && (
                        <div
                            style={{
                                padding:   '24px',
                                textAlign: 'center',
                                opacity:   0.5,
                            }}
                        >
                            <MaterialIcon n="folder_open" s={36} c="var(--muted)" />
                            <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '6px' }}>
                                Dossier vide
                            </div>
                        </div>
                    )}

                    {!isLoading && visibleFolders.map((folder, idx) => {
                        const isSelected = selectedId === folder.id;
                        const isLast     = idx === visibleFolders.length - 1;
                        return (
                            <div
                                key={folder.id}
                                onClick={() => setSelectedId(folder.id)}
                                style={{
                                    padding:      '11px 16px',
                                    display:      'flex',
                                    alignItems:   'center',
                                    gap:          '10px',
                                    background:   isSelected ? 'rgba(0,91,191,.08)' : 'transparent',
                                    borderLeft:   isSelected ? '3px solid #005bbf' : '3px solid transparent',
                                    borderBottom: isLast ? 'none' : '1px solid var(--border)',
                                    cursor:       'pointer',
                                    transition:   'background .12s',
                                }}
                                onMouseEnter={(e) => {
                                    if (!isSelected) {
                                        (e.currentTarget as HTMLDivElement).style.background = 'rgba(0,91,191,.04)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isSelected) {
                                        (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                                    }
                                }}
                            >
                                <MaterialIcon n="folder" s={17} c="var(--muted)" />
                                <span
                                    style={{
                                        fontSize:   '13px',
                                        fontWeight: 500,
                                        color:      'var(--text)',
                                        flex:       1,
                                    }}
                                >
                                    {folder.name}
                                </span>
                                {/* Flèche pour naviguer dans le dossier */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        enterFolder(folder);
                                    }}
                                    title="Ouvrir ce dossier"
                                    style={{
                                        background:   'none',
                                        border:       'none',
                                        cursor:       'pointer',
                                        display:      'flex',
                                        padding:      '2px',
                                        borderRadius: '4px',
                                    }}
                                >
                                    <MaterialIcon n="chevron_right" s={15} c="var(--muted)" />
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* Destination sélectionnée */}
                {(selectedId !== undefined || browseFolderId !== null) && (
                    <div
                        style={{
                            display:      'flex',
                            alignItems:   'center',
                            gap:          '6px',
                            padding:      '8px 12px',
                            background:   'rgba(0,91,191,.06)',
                            borderRadius: '8px',
                            marginTop:    '10px',
                        }}
                    >
                        <MaterialIcon n="arrow_forward" s={13} c="#005bbf" />
                        <span style={{ fontSize: '12px', color: '#005bbf' }}>
                            Vers : {destinationLabel}
                        </span>
                    </div>
                )}

                {/* Footer */}
                <div
                    style={{
                        display:        'flex',
                        justifyContent: 'flex-end',
                        gap:            '10px',
                        marginTop:      '20px',
                    }}
                >
                    <button
                        onClick={onClose}
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
                        onClick={() => mutation.mutate()}
                        disabled={mutation.isPending || isSameLocation || selectedId === undefined}
                        style={{
                            background:   'linear-gradient(135deg,#005bbf,#1a73e8)',
                            border:       'none',
                            borderRadius: '9999px',
                            padding:      '9px 22px',
                            fontSize:     '14px',
                            fontWeight:   600,
                            color:        'white',
                            cursor:       (mutation.isPending || isSameLocation || selectedId === undefined)
                                ? 'not-allowed' : 'pointer',
                            opacity:      (mutation.isPending || isSameLocation || selectedId === undefined)
                                ? 0.65 : 1,
                            display:      'inline-flex',
                            alignItems:   'center',
                            gap:          '6px',
                            fontFamily:   'Inter, sans-serif',
                            boxShadow:    '0 4px 16px rgba(0,91,191,.28)',
                            transition:   'all .2s',
                        }}
                    >
                        {mutation.isPending
                            ? <MaterialIcon n="hourglass_empty" s={16} c="white" />
                            : <MaterialIcon n="drive_file_move" s={16} c="white" />
                        }
                        Déplacer ici
                    </button>
                </div>
            </div>
        </div>
    );
};