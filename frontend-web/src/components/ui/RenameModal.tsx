// Modal de renommage d'un fichier ou d'un dossier.
// API fichier  : PATCH /api/files/{id}/rename
// API dossier  : PATCH /api/folders/{id}/rename

import { useState, useEffect } from 'react';
import type { ReactElement }   from 'react';

import { useRenameFile }   from '@/hooks/useFiles';
import { useRenameFolder } from '@/hooks/useFolders';
import { MaterialIcon }    from '@/components/ui/MaterialIcon';

// Types
interface RenameModalProps {
    type:       'file' | 'folder';
    targetId:   number;
    currentName: string;
    onClose:    () => void;
}

// Composant
export const RenameModal = ({
    type,
    targetId,
    currentName,
    onClose,
}: RenameModalProps): ReactElement => {
    const renameFileMutation   = useRenameFile();
    const renameFolderMutation = useRenameFolder();
    const [name, setName]      = useState(currentName);
    const [error, setError]    = useState('');

    // Sélectionne le nom sans l'extension au focus initial
    useEffect(() => {
        const input = document.getElementById('rename-input') as HTMLInputElement | null;
        if (!input) return;
        const dotIndex = currentName.lastIndexOf('.');
        if (type === 'file' && dotIndex > 0) {
            input.setSelectionRange(0, dotIndex);
        } else {
            input.select();
        }
    }, [currentName, type]);

    const mutation = {
        isPending: renameFileMutation.isPending || renameFolderMutation.isPending,
        mutate: () => {
            const callbacks = {
                onSuccess: onClose,
                onError:   () => setError('Une erreur est survenue. Veuillez réessayer.'),
            };
            if (type === 'file') {
                renameFileMutation.mutate({ fileId: targetId, params: { name: name.trim() } }, callbacks);
            } else {
                renameFolderMutation.mutate({ folderId: targetId, params: { name: name.trim() } }, callbacks);
            }
        },
    };

    const handleSubmit = () => {
        if (!name.trim()) {
            setError('Le nom est requis.');
            return;
        }
        if (name.trim() === currentName) {
            onClose();
            return;
        }
        setError('');
        mutation.mutate();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter')  handleSubmit();
        if (e.key === 'Escape') onClose();
    };

    const isFolder = type === 'folder';

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
                    width:        '440px',
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
                        {/* Container icône */}
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
                            <MaterialIcon n="drive_file_rename_outline" s={20} c="#005bbf" />
                        </div>
                        <span style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)' }}>
                            Renommer {isFolder ? 'le dossier' : 'le fichier'}
                        </span>
                    </div>

                    {/* Bouton fermer */}
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

                {/* Champ nom */}
                <div style={{ marginBottom: '6px' }}>
                    <label className="sf-label" style={{ color: 'var(--muted)' }}>
                        Nouveau nom
                    </label>
                    <div style={{ position: 'relative' }}>
                        <span
                            style={{
                                position:  'absolute',
                                left:      '13px',
                                top:       '50%',
                                transform: 'translateY(-50%)',
                                display:   'flex',
                            }}
                        >
                            <MaterialIcon
                                n={isFolder ? 'folder' : 'insert_drive_file'}
                                s={17}
                                c="var(--muted)"
                            />
                        </span>
                        <input
                            id="rename-input"
                            autoFocus
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setError('');
                            }}
                            onKeyDown={handleKeyDown}
                            className="sf-input"
                            style={{
                                width:       '100%',
                                paddingLeft: '40px',
                                background:  'var(--low)',
                                color:       'var(--text)',
                                border:      error ? '1px solid #ba1a1a' : 'none',
                            }}
                        />
                    </div>
                </div>

                {/* Message d'erreur */}
                {error && (
                    <div style={{ fontSize: '12px', color: '#ba1a1a', marginTop: '4px' }}>
                        {error}
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
                        onClick={handleSubmit}
                        disabled={mutation.isPending}
                        style={{
                            background:   'linear-gradient(135deg,#005bbf,#1a73e8)',
                            border:       'none',
                            borderRadius: '9999px',
                            padding:      '9px 22px',
                            fontSize:     '14px',
                            fontWeight:   600,
                            color:        'white',
                            cursor:       mutation.isPending ? 'not-allowed' : 'pointer',
                            opacity:      mutation.isPending ? 0.65 : 1,
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
                            : <MaterialIcon n="drive_file_rename_outline" s={16} c="white" />
                        }
                        Renommer
                    </button>
                </div>
            </div>
        </div>
    );
};