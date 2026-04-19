// Modal de création d'un nouveau dossier.
// API : POST /api/folders

import { useState }          from 'react';
import type { ReactElement } from 'react';
import { useCreateFolder } from '@/hooks/useFolders';
import { MaterialIcon }    from '@/components/ui/MaterialIcon';

// Types
interface NewFolderModalProps {
    /** ID du dossier parent courant (undefined = racine) */
    parentId?: number;
    onClose:   () => void;
}

// Composant
export const NewFolderModal = ({ parentId, onClose }: NewFolderModalProps): ReactElement => {
    const createFolderMutation = useCreateFolder();
    const [name, setName]      = useState('');
    const [error, setError]    = useState('');

    const mutation = {
        isPending: createFolderMutation.isPending,
        mutate: () => {
            createFolderMutation.mutate(
                { name: name.trim(), parentId },
                {
                    onSuccess: onClose,
                    onError:   () => setError('Une erreur est survenue. Veuillez réessayer.'),
                }
            );
        },
    };

    const handleSubmit = () => {
        if (!name.trim()) {
            setError('Le nom du dossier est requis.');
            return;
        }
        setError('');
        mutation.mutate();
    };

    // Soumission via touche Entrée ou fermeture via Escape
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter')  handleSubmit();
        if (e.key === 'Escape') onClose();
    };

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
                                background:     'rgba(52,168,83,.12)',
                                display:        'flex',
                                alignItems:     'center',
                                justifyContent: 'center',
                            }}
                        >
                            <MaterialIcon n="create_new_folder" s={20} c="#34a853" />
                        </div>
                        <span
                            style={{
                                fontSize:   '17px',
                                fontWeight: 700,
                                color:      'var(--text)',
                            }}
                        >
                            Nouveau dossier
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
                        Nom du dossier
                    </label>
                    <div style={{ position: 'relative' }}>
                        {/* Icône folder positionnée dans le champ */}
                        <span
                            style={{
                                position:  'absolute',
                                left:      '13px',
                                top:       '50%',
                                transform: 'translateY(-50%)',
                                display:   'flex',
                            }}
                        >
                            <MaterialIcon n="folder" s={17} c="var(--muted)" />
                        </span>
                        <input
                            autoFocus
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setError('');
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder="Mon dossier"
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
                            background:    'linear-gradient(135deg,#005bbf,#1a73e8)',
                            border:        'none',
                            borderRadius:  '9999px',
                            padding:       '9px 22px',
                            fontSize:      '14px',
                            fontWeight:    600,
                            color:         'white',
                            cursor:        mutation.isPending ? 'not-allowed' : 'pointer',
                            opacity:       mutation.isPending ? 0.65 : 1,
                            display:       'inline-flex',
                            alignItems:    'center',
                            gap:           '6px',
                            fontFamily:    'Inter, sans-serif',
                            boxShadow:     '0 4px 16px rgba(0,91,191,.28)',
                            transition:    'all .2s',
                        }}
                    >
                        {mutation.isPending
                            ? <MaterialIcon n="hourglass_empty" s={16} c="white" />
                            : <MaterialIcon n="create_new_folder" s={16} c="white" />
                        }
                        Créer
                    </button>
                </div>
            </div>
        </div>
    );
};