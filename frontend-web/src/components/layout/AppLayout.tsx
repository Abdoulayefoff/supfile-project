// Layout principal de l'application connectée
// Gère le thème clair/sombre, les modals Upload / Nouveau dossier,
// et le drag & drop global (déposer des fichiers n'importe où dans le drive)

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ReactElement }                        from 'react';
import { Outlet, useParams }                        from 'react-router-dom';

import { useAuthStore }    from '@/stores/authStore';
import { useUiStore }      from '@/stores/uiStore';
import { useUpdateProfile } from '@/hooks/useUser';
import { Header }          from './Header';
import { Sidebar }         from './Sidebar';
import { UploadModal }     from '@/components/ui/UploadModal';
import { NewFolderModal }  from '@/components/ui/NewFolderModal';

export const AppLayout = (): ReactElement => {
    const user    = useAuthStore((s) => s.user);
    const setUser = useAuthStore((s) => s.setUser);

    const updateProfile = useUpdateProfile();

    // ── Thème : 
    // isDark est dérivé — pas de useState local pour rester synchronisé avec
    // l'onglet Préférences qui modifie user.theme via l'API.
    const isDark = (user?.theme ?? localStorage.getItem('sf_theme') ?? 'light') === 'dark';

    useEffect(() => {
        const theme = isDark ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('sf_theme', theme);
    }, [isDark]);

    // Bascule thème depuis le bouton Header → met à jour store + localStorage + API
    const handleToggleDark = () => {
        const newTheme = isDark ? 'light' : 'dark';
        localStorage.setItem('sf_theme', newTheme);
        if (user) {
            setUser({ ...user, theme: newTheme });
            updateProfile.mutate({ theme: newTheme });
        }
    };

    // ── Modals via uiStore (partagé avec DashboardPage et Sidebar) ──
    const { showUpload, showNewFolder, openUpload, closeUpload, closeNewFolder } = useUiStore();

    // Fichiers pré-chargés depuis un drag & drop extérieur au modal
    const droppedFilesRef = useRef<File[]>([]);

    // Récupère le folderId courant depuis l'URL pour le passer aux modals
    const { folderId } = useParams<{ folderId?: string }>();
    const currentFolderId = folderId ? parseInt(folderId, 10) : undefined;

    // ── Drag & drop global sur la zone principale ──
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const dragCounter = useRef(0);

    const handleGlobalDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        dragCounter.current += 1;
        if (e.dataTransfer.types.includes('Files')) {
            setIsDraggingOver(true);
        }
    }, []);

    const handleGlobalDragLeave = useCallback(() => {
        dragCounter.current -= 1;
        if (dragCounter.current === 0) {
            setIsDraggingOver(false);
        }
    }, []);

    const handleGlobalDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
    }, []);

    const handleGlobalDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        dragCounter.current = 0;
        setIsDraggingOver(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            droppedFilesRef.current = files;
            openUpload();
        }
    }, [openUpload]);

    const handleCloseUpload = useCallback(() => {
        closeUpload();
        droppedFilesRef.current = [];
    }, [closeUpload]);

    return (
        <div
            style={{
                minHeight:     '100vh',
                background:    'var(--bg)',
                color:         'var(--text)',
                fontFamily:    "'Inter', sans-serif",
                display:       'flex',
                flexDirection: 'column',
            }}
        >
            {/* ── Header sticky ── */}
            <Header isDark={isDark} onToggleDark={handleToggleDark} />

            {/* ── Corps : Sidebar + Contenu principal ── */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                <Sidebar />

                {/* Zone de contenu principal avec drag & drop global */}
                <main
                    className="fade"
                    onDragEnter={handleGlobalDragEnter}
                    onDragLeave={handleGlobalDragLeave}
                    onDragOver={handleGlobalDragOver}
                    onDrop={handleGlobalDrop}
                    style={{
                        flex:       1,
                        overflowY:  'auto',
                        padding:    '30px 34px',
                        background: 'var(--bg)',
                        position:   'relative',
                    }}
                >
                    <Outlet />

                    {/* Overlay drop visible quand on survole avec des fichiers */}
                    {isDraggingOver && (
                        <div
                            style={{
                                position:       'absolute',
                                inset:          0,
                                zIndex:         150,
                                background:     'rgba(0,91,191,.10)',
                                border:         '3px dashed #005bbf',
                                borderRadius:   '16px',
                                display:        'flex',
                                flexDirection:  'column',
                                alignItems:     'center',
                                justifyContent: 'center',
                                gap:            '12px',
                                pointerEvents:  'none',
                            }}
                        >
                            <span
                                className="material-symbols-outlined"
                                style={{ fontSize: '56px', color: '#005bbf' }}
                            >
                                cloud_upload
                            </span>
                            <div style={{ fontSize: '18px', fontWeight: 700, color: '#005bbf' }}>
                                Déposez vos fichiers ici
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* ── Modals (portails fixes) ── */}
            {showUpload && (
                <UploadModal
                    folderId={currentFolderId}
                    initialFiles={droppedFilesRef.current.length > 0 ? droppedFilesRef.current : undefined}
                    onClose={handleCloseUpload}
                />
            )}

            {showNewFolder && (
                <NewFolderModal
                    parentId={currentFolderId}
                    onClose={closeNewFolder}
                />
            )}
        </div>
    );
};
