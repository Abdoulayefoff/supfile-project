// Page Mon Drive — navigation arborescence, liste fichiers/dossiers,
// upload, actions (renommer, déplacer, supprimer, télécharger, partager).

import { useState, useCallback }  from 'react';
import type { ReactElement }      from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { LayoutGrid, List }       from 'lucide-react';
import { useFileList, useDeleteFile, useDownloadFile, useMoveFile }   from '@/hooks/useFiles';
import { useFolderList, useFolderBreadcrumbs, useDeleteFolder, useDownloadFolder, useMoveFolder } from '@/hooks/useFolders';
import { getMimeInfo, fmtSize, fmtDate }                  from '@/lib/utils';
import { MaterialIcon }                                   from '@/components/ui/MaterialIcon';
import { ContextMenu }                                    from '@/components/ui/ContextMenu';
import { RenameModal }                                    from '@/components/ui/RenameModal';
import { MoveModal }                                      from '@/components/ui/MoveModal';
import { ShareModal }                                     from '@/components/ui/ShareModal';
import type { ContextMenuItem }                           from '@/components/ui/ContextMenu';
import type { FileItem, Folder }                          from '@/types';

// ── Types locaux 

interface ContextMenuState {
    x:        number;
    y:        number;
    type:     'file' | 'folder';
    targetId: number;
    name:     string;
    mimeType?: string;
}

interface RenameState {
    type:        'file' | 'folder';
    targetId:    number;
    currentName: string;
}

interface MoveState {
    type:       'file' | 'folder';
    targetId:   number;
    targetName: string;
}

interface ShareState {
    type:       'file' | 'folder';
    targetId:   number;
    name:       string;
}

type ViewMode = 'grid' | 'list';
type DateFilter = 'all' | 'today' | 'week' | 'month';

// ── Composant principal 

export const DrivePage = (): ReactElement => {
    const { folderId }   = useParams<{ folderId?: string }>();
    const [searchParams] = useSearchParams();
    const navigate       = useNavigate();

    const currentFolderId = folderId ? parseInt(folderId, 10) : undefined;

    // ── État local ──
    const [viewMode, setViewMode]       = useState<ViewMode>('grid');
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
    const [renameState, setRenameState] = useState<RenameState | null>(null);
    const [moveState, setMoveState]     = useState<MoveState | null>(null);
    const [shareState, setShareState]   = useState<ShareState | null>(null);
    const [typeFilter, setTypeFilter]   = useState<string>('all');
    const [dateFilter, setDateFilter]   = useState<DateFilter>('all');

    const searchQuery = searchParams.get('search') ?? '';

    // ── Breadcrumbs — GET /api/folders/{id}/breadcrumbs ──
    const { data: breadcrumbs = [] } = useFolderBreadcrumbs(currentFolderId);

    // ── Données dossiers — GET /api/folders?parentId=X ──
    const { data: folders = [], isLoading: loadingFolders } = useFolderList({
        parentId: currentFolderId ?? null,
    });

    // ── Données fichiers — GET /api/files?folderId=X&search=Y ──
    const { data: files = [], isLoading: loadingFiles } = useFileList({
        folderId: currentFolderId ?? null,
        search:   searchQuery || undefined,
    });

    // ── Mutations suppression / téléchargement / déplacement ──
    const deleteFichierMutation  = useDeleteFile();
    const deleteDossierMutation  = useDeleteFolder();
    const downloadFileMutation   = useDownloadFile();
    const downloadFolderMutation = useDownloadFolder();
    const moveFileMutation       = useMoveFile();
    const moveFolderMutation     = useMoveFolder();

    // ── Drag & drop ──
    const [dragOverFolderId, setDragOverFolderId] = useState<number | null>(null);

    const handleDragStart = useCallback(
        (e: React.DragEvent, type: 'file' | 'folder', id: number) => {
            e.dataTransfer.setData('text/plain', JSON.stringify({ type, id }));
            e.dataTransfer.effectAllowed = 'move';
        },
        []
    );

    const handleDragOver = useCallback((e: React.DragEvent, folderId: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverFolderId(folderId);
    }, []);

    const handleDragLeave = useCallback(() => setDragOverFolderId(null), []);

    const handleDrop = useCallback(
        (e: React.DragEvent, targetFolderId: number) => {
            e.preventDefault();
            setDragOverFolderId(null);
            try {
                const { type, id } = JSON.parse(
                    e.dataTransfer.getData('text/plain')
                ) as { type: 'file' | 'folder'; id: number };
                if (type === 'file') {
                    moveFileMutation.mutate({ fileId: id, params: { targetFolderId } });
                } else if (id !== targetFolderId) {
                    moveFolderMutation.mutate({ folderId: id, params: { targetParentId: targetFolderId } });
                }
            } catch {
                // données invalides, on ignore
            }
        },
        [moveFileMutation, moveFolderMutation]
    );

    // ── Menu contextuel ──
    const openContextMenu = useCallback(
        (e: React.MouseEvent, type: 'file' | 'folder', id: number, name: string, mimeType?: string) => {
            e.preventDefault();
            e.stopPropagation();
            setContextMenu({ x: e.clientX, y: e.clientY, type, targetId: id, name, mimeType });
        },
        []
    );

    const buildContextMenuItems = (ctx: ContextMenuState): ContextMenuItem[] => {
        const isFile = ctx.type === 'file';

        const items: ContextMenuItem[] = [
            {
                icon:    'visibility',
                label:   'Prévisualiser',
                color:   'var(--text)',
                onClick: () => isFile
                    ? navigate(`/drive/preview/${ctx.targetId}`)
                    : navigate(`/drive/folder/${ctx.targetId}`),
            },
            {
                icon:    'download',
                label:   'Télécharger',
                color:   'var(--text)',
                onClick: () => isFile
                    ? void downloadFileMutation.mutate({ fileId: ctx.targetId, fileName: ctx.name })
                    : void downloadFolderMutation.mutate({ folderId: ctx.targetId, folderName: ctx.name }),
            },
            {
                icon:    'share',
                label:   'Partager',
                color:   '#005bbf',
                onClick: () => setShareState({
                    type:     ctx.type,
                    targetId: ctx.targetId,
                    name:     ctx.name,
                }),
            },
            {
                icon:    'drive_file_rename_outline',
                label:   'Renommer',
                color:   'var(--text)',
                onClick: () => setRenameState({
                    type:        ctx.type,
                    targetId:    ctx.targetId,
                    currentName: ctx.name,
                }),
            },
            {
                icon:    'drive_file_move',
                label:   'Déplacer',
                color:   'var(--text)',
                onClick: () => setMoveState({
                    type:       ctx.type,
                    targetId:   ctx.targetId,
                    targetName: ctx.name,
                }),
            },
            {
                icon:      'delete',
                label:     'Supprimer',
                color:     '#ba1a1a',
                separator: true,
                onClick:   () => {
                    if (isFile) {
                        deleteFichierMutation.mutate(ctx.targetId);
                    } else {
                        deleteDossierMutation.mutate(ctx.targetId);
                    }
                },
            },
        ];

        return items;
    };

    // ── Filtrage type MIME ──
    const filteredByType = typeFilter === 'all'
        ? files
        : files.filter((f) => {
            if (typeFilter === 'image') return f.mimeType?.startsWith('image/');
            if (typeFilter === 'video') return f.mimeType?.startsWith('video/');
            if (typeFilter === 'audio') return f.mimeType?.startsWith('audio/');
            if (typeFilter === 'pdf')   return f.mimeType === 'application/pdf';
            if (typeFilter === 'text')  return f.mimeType?.startsWith('text/');
            return true;
        });

    // ── Filtrage par date ──
    const filteredFiles = (() => {
        if (dateFilter === 'all') return filteredByType;
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return filteredByType.filter((f) => {
            const updatedAt = new Date(f.updatedAt);
            if (dateFilter === 'today') return updatedAt >= startOfToday;
            if (dateFilter === 'week') {
                const weekAgo = new Date(startOfToday);
                weekAgo.setDate(weekAgo.getDate() - 6);
                return updatedAt >= weekAgo;
            }
            if (dateFilter === 'month') {
                const monthAgo = new Date(startOfToday);
                monthAgo.setDate(monthAgo.getDate() - 29);
                return updatedAt >= monthAgo;
            }
            return true;
        });
    })();

    // Filtrage des dossiers par nom côté client quand une recherche est active
    const filteredFolders = searchQuery
        ? folders.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : folders;

    const isLoading = loadingFolders || loadingFiles;

    return (
        <div
            className="fade"
            style={{ maxWidth: '1060px', margin: '0 auto' }}
            onClick={() => setContextMenu(null)}
        >
            {/* ── Header Drive ── */}
            <div
                style={{
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'space-between',
                    marginBottom:   '24px',
                }}
            >
                {/* ── Breadcrumb ── */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                    {/* Racine cliquable */}
                    <button
                        onClick={() => navigate('/drive')}
                        style={{
                            background: 'none',
                            border:     'none',
                            cursor:     'pointer',
                            fontSize:   currentFolderId ? '15px' : '21px',
                            fontWeight: currentFolderId ? 500 : 800,
                            color:      currentFolderId ? 'var(--muted)' : 'var(--text)',
                            fontFamily: 'Inter, sans-serif',
                            padding:    '2px 4px',
                            borderRadius: '6px',
                            transition: 'background .12s',
                        }}
                    >
                        Mon Drive
                    </button>

                    {/* Segments du breadcrumb API */}
                    {breadcrumbs.map((crumb, idx) => {
                        const isLast = idx === breadcrumbs.length - 1;
                        return (
                            <span key={crumb.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <MaterialIcon n="chevron_right" s={18} c="var(--muted)" />
                                <button
                                    onClick={() => !isLast && navigate(`/drive/folder/${crumb.id}`)}
                                    style={{
                                        background:  'none',
                                        border:      'none',
                                        cursor:      isLast ? 'default' : 'pointer',
                                        fontSize:    isLast ? '21px' : '15px',
                                        fontWeight:  isLast ? 800 : 500,
                                        color:       isLast ? 'var(--text)' : 'var(--muted)',
                                        fontFamily:  'Inter, sans-serif',
                                        padding:     '2px 4px',
                                        borderRadius: '6px',
                                        maxWidth:    '180px',
                                        overflow:    'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace:  'nowrap',
                                    }}
                                >
                                    {crumb.name}
                                </button>
                            </span>
                        );
                    })}
                </div>

                {/* Filtres droite */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="sf-input"
                        style={{
                            background: 'var(--low)',
                            color:      'var(--text)',
                            fontSize:   '12px',
                            padding:    '7px 10px',
                            cursor:     'pointer',
                        }}
                    >
                        <option value="all">Tous types</option>
                        <option value="image">Images</option>
                        <option value="video">Vidéos</option>
                        <option value="audio">Audio</option>
                        <option value="pdf">PDFs</option>
                        <option value="text">Textes</option>
                    </select>

                    <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                        className="sf-input"
                        style={{
                            background: 'var(--low)',
                            color:      'var(--text)',
                            fontSize:   '12px',
                            padding:    '7px 10px',
                            cursor:     'pointer',
                        }}
                    >
                        <option value="all">Toutes dates</option>
                        <option value="today">Aujourd'hui</option>
                        <option value="week">7 derniers jours</option>
                        <option value="month">30 derniers jours</option>
                    </select>

                    {/* Toggle grille / liste */}
                    <div
                        style={{
                            display:      'flex',
                            background:   'var(--low)',
                            borderRadius: '9px',
                            padding:      '3px',
                            gap:          '2px',
                        }}
                    >
                        <button
                            onClick={() => setViewMode('grid')}
                            style={{
                                background:   viewMode === 'grid' ? 'var(--surface)' : 'transparent',
                                border:       'none',
                                borderRadius: '7px',
                                padding:      '7px',
                                cursor:       'pointer',
                                display:      'flex',
                                color:        viewMode === 'grid' ? '#005bbf' : 'var(--muted)',
                                transition:   'all .15s',
                            }}
                        >
                            <LayoutGrid size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            style={{
                                background:   viewMode === 'list' ? 'var(--surface)' : 'transparent',
                                border:       'none',
                                borderRadius: '7px',
                                padding:      '7px',
                                cursor:       'pointer',
                                display:      'flex',
                                color:        viewMode === 'list' ? '#005bbf' : 'var(--muted)',
                                transition:   'all .15s',
                            }}
                        >
                            <List size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Skeleton chargement */}
            {isLoading && <DriveSkeletonLoader />}

            {/* Contenu */}
            {!isLoading && (
                <>
                    {/* Dossiers */}
                    {filteredFolders.length > 0 && (
                        <section style={{ marginBottom: '28px' }}>
                            <SectionLabel>Dossiers</SectionLabel>
                            <FolderGrid
                                folders={filteredFolders}
                                dragOverFolderId={dragOverFolderId}
                                onOpen={(id) => navigate(`/drive/folder/${id}`)}
                                onContextMenu={(e, folder) =>
                                    openContextMenu(e, 'folder', folder.id, folder.name)
                                }
                                onDragStart={handleDragStart}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            />
                        </section>
                    )}

                    {/* Fichiers */}
                    {filteredFiles.length > 0 && (
                        <section>
                            <SectionLabel>Fichiers</SectionLabel>
                            {viewMode === 'grid' ? (
                                <FileGrid
                                    files={filteredFiles}
                                    onOpen={(id) => navigate(`/drive/preview/${id}`)}
                                    onContextMenu={(e, file) =>
                                        openContextMenu(e, 'file', file.id, file.name, file.mimeType)
                                    }
                                    onDragStart={handleDragStart}
                                />
                            ) : (
                                <FileList
                                    files={filteredFiles}
                                    onOpen={(id) => navigate(`/drive/preview/${id}`)}
                                    onContextMenu={(e, file) =>
                                        openContextMenu(e, 'file', file.id, file.name, file.mimeType)
                                    }
                                    onDragStart={handleDragStart}
                                />
                            )}
                        </section>
                    )}

                    {/* État vide */}
                    {filteredFolders.length === 0 && filteredFiles.length === 0 && (
                        <EmptyDrive hasSearch={!!searchQuery} />
                    )}
                </>
            )}

            {/* ── Modals & menus ── */}
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    items={buildContextMenuItems(contextMenu)}
                    onClose={() => setContextMenu(null)}
                />
            )}

            {renameState && (
                <RenameModal
                    type={renameState.type}
                    targetId={renameState.targetId}
                    currentName={renameState.currentName}
                    onClose={() => setRenameState(null)}
                />
            )}

            {moveState && (
                <MoveModal
                    type={moveState.type}
                    targetId={moveState.targetId}
                    targetName={moveState.targetName}
                    currentFolderId={currentFolderId}
                    onClose={() => setMoveState(null)}
                />
            )}

            {shareState && (
                <ShareModal
                    type={shareState.type}
                    resourceId={shareState.targetId}
                    name={shareState.name}
                    onClose={() => setShareState(null)}
                />
            )}
        </div>
    );
};

// ── Sous-composants

const SectionLabel = ({ children }: { children: React.ReactNode }): ReactElement => (
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
        {children}
    </div>
);

interface FolderGridProps {
    folders:          Folder[];
    dragOverFolderId: number | null;
    onOpen:           (id: number) => void;
    onContextMenu:    (e: React.MouseEvent, folder: Folder) => void;
    onDragStart:      (e: React.DragEvent, type: 'file' | 'folder', id: number) => void;
    onDragOver:       (e: React.DragEvent, folderId: number) => void;
    onDragLeave:      () => void;
    onDrop:           (e: React.DragEvent, folderId: number) => void;
}

const FolderGrid = ({ folders, dragOverFolderId, onOpen, onContextMenu, onDragStart, onDragOver, onDragLeave, onDrop }: FolderGridProps): ReactElement => (
    <div
        style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))',
            gap:                 '9px',
        }}
    >
        {folders.map((folder) => (
            <div
                key={folder.id}
                className="card-hover"
                draggable
                onDragStart={(e) => onDragStart(e, 'folder', folder.id)}
                onDragOver={(e) => onDragOver(e, folder.id)}
                onDragLeave={onDragLeave}
                onDrop={(e) => onDrop(e, folder.id)}
                onDoubleClick={() => onOpen(folder.id)}
                onContextMenu={(e) => onContextMenu(e, folder)}
                style={{
                    display:      'flex',
                    alignItems:   'center',
                    gap:          '10px',
                    padding:      '11px 13px',
                    borderRadius: '11px',
                    background:   dragOverFolderId === folder.id ? 'rgba(0,91,191,.10)' : 'var(--low)',
                    border:       dragOverFolderId === folder.id
                        ? '1px solid rgba(0,91,191,.5)'
                        : folder.isShared ? '1px solid rgba(0,91,191,.25)' : '1px solid transparent',
                    cursor:       'pointer',
                    transition:   'background .12s, border-color .12s',
                    position:     'relative',
                }}
            >
                <MaterialIcon
                    n={folder.isShared ? 'folder_shared' : 'folder'}
                    s={21}
                    c={folder.isShared ? '#005bbf' : 'var(--muted)'}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                        style={{
                            fontSize:     '13px',
                            fontWeight:   500,
                            color:        'var(--text)',
                            whiteSpace:   'nowrap',
                            overflow:     'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {folder.name}
                    </div>
                    {folder.isShared && folder.sharedBy && (
                        <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '1px' }}>
                            Par {folder.sharedBy.fullName || folder.sharedBy.email}
                        </div>
                    )}
                </div>

                {/* Bouton ⋮ — ouvre le menu contextuel */}
                <button
                    className="menu-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        onContextMenu(e, folder);
                    }}
                    title="Options"
                    style={{
                        background:   'none',
                        border:       'none',
                        cursor:       'pointer',
                        padding:      '2px 4px',
                        borderRadius: '6px',
                        color:        'var(--muted)',
                        fontSize:     '16px',
                        lineHeight:   1,
                        fontWeight:   700,
                        display:      'flex',
                        alignItems:   'center',
                        flexShrink:   0,
                    }}
                >
                    ⋮
                </button>
            </div>
        ))}
    </div>
);

interface FileGridProps {
    files:         FileItem[];
    onOpen:        (id: number) => void;
    onContextMenu: (e: React.MouseEvent, file: FileItem) => void;
    onDragStart:   (e: React.DragEvent, type: 'file' | 'folder', id: number) => void;
}

const FileGrid = ({ files, onOpen, onContextMenu, onDragStart }: FileGridProps): ReactElement => (
    <div
        style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))',
            gap:                 '12px',
        }}
    >
        {files.map((file) => {
            const { icon, color } = getMimeInfo(file.mimeType);
            return (
                <div
                    key={file.id}
                    className="card-hover"
                    draggable
                    onDragStart={(e) => onDragStart(e, 'file', file.id)}
                    onDoubleClick={() => onOpen(file.id)}
                    onContextMenu={(e) => onContextMenu(e, file)}
                    style={{
                        background:   'var(--surface)',
                        borderRadius: '12px',
                        padding:      '13px',
                        border:       '1px solid var(--border)',
                        cursor:       'pointer',
                        position:     'relative',
                    }}
                >
                    <div
                        style={{
                            display:        'flex',
                            justifyContent: 'space-between',
                            alignItems:     'flex-start',
                            marginBottom:   '9px',
                        }}
                    >
                        <MaterialIcon n={icon} s={28} c={color} />

                        {/* Bouton ⋮ — ouvre le menu contextuel */}
                        <button
                            className="menu-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                onContextMenu(e, file);
                            }}
                            title="Options"
                            style={{
                                background:   'none',
                                border:       'none',
                                cursor:       'pointer',
                                padding:      '2px 4px',
                                borderRadius: '6px',
                                color:        'var(--muted)',
                                fontSize:     '16px',
                                lineHeight:   1,
                                fontWeight:   700,
                                display:      'flex',
                                alignItems:   'center',
                            }}
                        >
                            ⋮
                        </button>
                    </div>
                    <div
                        style={{
                            fontSize:     '12px',
                            fontWeight:   600,
                            color:        'var(--text)',
                            whiteSpace:   'nowrap',
                            overflow:     'hidden',
                            textOverflow: 'ellipsis',
                            marginBottom: '2px',
                        }}
                    >
                        {file.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                        {fmtSize(file.size)}
                    </div>
                </div>
            );
        })}
    </div>
);

interface FileListProps {
    files:         FileItem[];
    onOpen:        (id: number) => void;
    onContextMenu: (e: React.MouseEvent, file: FileItem) => void;
    onDragStart:   (e: React.DragEvent, type: 'file' | 'folder', id: number) => void;
}

const FileList = ({ files, onOpen, onContextMenu, onDragStart }: FileListProps): ReactElement => (
    <div
        style={{
            background:   'var(--surface)',
            borderRadius: '14px',
            overflow:     'hidden',
            border:       '1px solid var(--border)',
        }}
    >
        <div
            style={{
                display:             'grid',
                gridTemplateColumns: '1fr 120px 120px 80px 32px',
                padding:             '11px 18px',
                background:          'var(--low)',
                borderBottom:        '1px solid var(--border)',
            }}
        >
            {['Nom', 'Propriétaire', 'Modifié', 'Taille', ''].map((col) => (
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
        {files.map((file, idx) => {
            const { icon, color } = getMimeInfo(file.mimeType);
            const isLast = idx === files.length - 1;
            return (
                <div
                    key={file.id}
                    className="row-hover"
                    draggable
                    onDragStart={(e) => onDragStart(e, 'file', file.id)}
                    onDoubleClick={() => onOpen(file.id)}
                    onContextMenu={(e) => onContextMenu(e, file)}
                    style={{
                        display:             'grid',
                        gridTemplateColumns: '1fr 120px 120px 80px 32px',
                        padding:             '12px 18px',
                        alignItems:          'center',
                        borderBottom:        isLast ? 'none' : '1px solid var(--border)',
                        cursor:              'pointer',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <MaterialIcon n={icon} s={19} c={color} />
                        <span
                            style={{
                                fontSize:     '13px',
                                fontWeight:   500,
                                color:        'var(--text)',
                                whiteSpace:   'nowrap',
                                overflow:     'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth:     '180px',
                            }}
                        >
                            {file.name}
                        </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Moi</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{fmtDate(file.updatedAt)}</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{fmtSize(file.size)}</div>
                    {/* Bouton ⋮ */}
                    <button
                        className="menu-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            onContextMenu(e, file);
                        }}
                        title="Options"
                        style={{
                            background:   'none',
                            border:       'none',
                            cursor:       'pointer',
                            padding:      '2px 5px',
                            borderRadius: '6px',
                            color:        'var(--muted)',
                            fontSize:     '16px',
                            fontWeight:   700,
                            lineHeight:   1,
                        }}
                    >
                        ⋮
                    </button>
                </div>
            );
        })}
    </div>
);

const DriveSkeletonLoader = (): ReactElement => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div
            style={{
                display:             'grid',
                gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))',
                gap:                 '9px',
            }}
        >
            {Array.from({ length: 4 }).map((_, i) => (
                <div
                    key={i}
                    style={{
                        height:       '46px',
                        borderRadius: '11px',
                        background:   'var(--low)',
                        opacity:      0.6,
                    }}
                />
            ))}
        </div>
        <div
            style={{
                display:             'grid',
                gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))',
                gap:                 '12px',
            }}
        >
            {Array.from({ length: 8 }).map((_, i) => (
                <div
                    key={i}
                    style={{
                        height:       '90px',
                        borderRadius: '12px',
                        background:   'var(--low)',
                        opacity:      0.6,
                    }}
                />
            ))}
        </div>
    </div>
);

const EmptyDrive = ({ hasSearch }: { hasSearch: boolean }): ReactElement => (
    <div style={{ textAlign: 'center', paddingTop: '72px', opacity: 0.5 }}>
        <MaterialIcon n="folder_open" s={60} c="var(--muted)" />
        <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginTop: '14px' }}>
            {hasSearch ? 'Aucun résultat' : 'Dossier vide'}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>
            {hasSearch
                ? 'Essayez avec un autre terme de recherche'
                : 'Importez des fichiers ou créez un dossier via le bouton "Nouveau"'
            }
        </div>
    </div>
);
