// Modal d'upload de fichiers avec drag & drop et barre de progression.
// API : POST /api/files  (multipart/form-data)

import { useState, useRef, useCallback, useEffect } from 'react';
import type { ReactElement }                        from 'react';
import { useQueryClient }                           from '@tanstack/react-query';
import { uploadFile }    from '@/services/fileService';
import { MaterialIcon }  from '@/components/ui/MaterialIcon';
import { fmtSize }       from '@/lib/utils';

// Types
interface UploadModalProps {
    /** ID du dossier courant (undefined = racine) */
    folderId?:     number;
    onClose:       () => void;
    /** Fichiers pré-chargés depuis un drag & drop extérieur */
    initialFiles?: File[];
}

interface FileEntry {
    file:     File;
    progress: number;
    status:   'pending' | 'uploading' | 'done' | 'error';
    error?:   string;
}

// Composant
export const UploadModal = ({
    folderId,
    onClose,
    initialFiles,
}: UploadModalProps): ReactElement => {
    const qc      = useQueryClient();
    const inputRef = useRef<HTMLInputElement>(null);

    const [entries,     setEntries]     = useState<FileEntry[]>([]);
    const [isDragging,  setIsDrag]      = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Charge les fichiers initiaux (drag & drop depuis AppLayout)
    useEffect(() => {
        if (initialFiles && initialFiles.length > 0) {
            setEntries(initialFiles.map((file) => ({
                file,
                progress: 0,
                status:   'pending',
            })));
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Ajout de fichiers à la liste ──
    const addFiles = useCallback((fileList: FileList | null) => {
        if (!fileList) return;
        const newEntries: FileEntry[] = Array.from(fileList).map((file) => ({
            file,
            progress: 0,
            status:   'pending',
        }));
        setEntries((prev) => [...prev, ...newEntries]);
    }, []);

    // ── Drag & drop handlers (zone interne) ──
    const handleDragOver  = (e: React.DragEvent) => { e.preventDefault(); setIsDrag(true); };
    const handleDragLeave = () => setIsDrag(false);
    const handleDrop      = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDrag(false);
        addFiles(e.dataTransfer.files);
    };

    // ── Mise à jour du statut d'un fichier dans la liste ──
    const updateEntry = useCallback((index: number, patch: Partial<FileEntry>) => {
        setEntries((prev) =>
            prev.map((entry, i) => (i === index ? { ...entry, ...patch } : entry))
        );
    }, []);

    // ── Upload d'un fichier individuel directement via le service ──
    const uploadOne = async (entry: FileEntry, index: number): Promise<void> => {
        updateEntry(index, { status: 'uploading', progress: 0 });
        try {
            await uploadFile({
                file:     entry.file,
                folderId: folderId ?? null,
                onUploadProgress: (percent: number) =>
                    updateEntry(index, { progress: percent }),
            });
            updateEntry(index, { status: 'done', progress: 100 });
        } catch {
            updateEntry(index, { status: 'error', error: "Échec de l'upload" });
        }
    };

    // ── Lancement de tous les uploads en parallèle ──
    const handleUpload = async () => {
        const pending = entries
            .map((entry, index) => ({ entry, index }))
            .filter(({ entry }) => entry.status === 'pending');

        if (pending.length === 0) return;

        setIsUploading(true);
        await Promise.all(pending.map(({ entry, index }) => uploadOne(entry, index)));
        setIsUploading(false);

        // Invalide les caches après tous les uploads
        void qc.refetchQueries({ queryKey: ['files'] });
        void qc.refetchQueries({ queryKey: ['dashboard', 'stats'] });
        void qc.refetchQueries({ queryKey: ['dashboard', 'recent'] });

        // Auto-fermeture si aucune erreur
        setEntries((current) => {
            const hasError = current.some((e) => e.status === 'error');
            if (!hasError) {
                setTimeout(onClose, 600);
            }
            return current;
        });
    };

    const allDone      = entries.length > 0 && entries.every((e) => e.status === 'done' || e.status === 'error');
    const hasPending   = entries.some((e) => e.status === 'pending');
    const pendingCount = entries.filter((e) => e.status === 'pending').length;

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
                            <MaterialIcon n="upload_file" s={20} c="#005bbf" />
                        </div>
                        <span style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)' }}>
                            Importer des fichiers
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

                {/* Zone drag & drop */}
                <div
                    className={`upload-zone${isDragging ? ' drag' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                    style={{
                        borderColor:  isDragging ? '#005bbf' : 'var(--border)',
                        background:   isDragging ? 'rgba(0,91,191,.05)' : 'var(--low)',
                        color:        'var(--muted)',
                        marginBottom: entries.length > 0 ? '16px' : '0',
                    }}
                >
                    <MaterialIcon n="cloud_upload" s={36} c={isDragging ? '#005bbf' : 'var(--muted)'} />
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
                        Glissez vos fichiers ici
                    </div>
                    <div style={{ fontSize: '12px' }}>
                        ou <span style={{ color: '#005bbf', fontWeight: 600 }}>parcourir</span>
                    </div>
                    <input
                        ref={inputRef}
                        type="file"
                        multiple
                        style={{ display: 'none' }}
                        onChange={(e) => addFiles(e.target.files)}
                    />
                </div>

                {/* Liste des fichiers sélectionnés */}
                {entries.length > 0 && (
                    <div
                        style={{
                            display:       'flex',
                            flexDirection: 'column',
                            gap:           '8px',
                            maxHeight:     '220px',
                            overflowY:     'auto',
                            marginBottom:  '16px',
                        }}
                    >
                        {entries.map((entry, idx) => (
                            <FileUploadRow key={idx} entry={entry} />
                        ))}
                    </div>
                )}

                {/* Footer */}
                <div
                    style={{
                        display:        'flex',
                        justifyContent: 'flex-end',
                        gap:            '10px',
                        marginTop:      entries.length > 0 ? '4px' : '20px',
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
                        {allDone ? 'Fermer' : 'Annuler'}
                    </button>

                    {!allDone && (
                        <button
                            onClick={() => void handleUpload()}
                            disabled={!hasPending || isUploading}
                            style={{
                                background:   'linear-gradient(135deg,#005bbf,#1a73e8)',
                                border:       'none',
                                borderRadius: '9999px',
                                padding:      '9px 22px',
                                fontSize:     '14px',
                                fontWeight:   600,
                                color:        'white',
                                cursor:       (!hasPending || isUploading) ? 'not-allowed' : 'pointer',
                                opacity:      (!hasPending || isUploading) ? 0.65 : 1,
                                display:      'inline-flex',
                                alignItems:   'center',
                                gap:          '6px',
                                fontFamily:   'Inter, sans-serif',
                                boxShadow:    '0 4px 16px rgba(0,91,191,.28)',
                                transition:   'all .2s',
                            }}
                        >
                            {isUploading
                                ? <MaterialIcon n="hourglass_empty" s={16} c="white" />
                                : <MaterialIcon n="upload" s={16} c="white" />
                            }
                            {isUploading
                                ? 'Upload en cours…'
                                : `Uploader (${pendingCount})`
                            }
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// Sous-composant : ligne d'un fichier dans la liste d'upload
interface FileUploadRowProps {
    entry: FileEntry;
}

const FileUploadRow = ({ entry }: FileUploadRowProps): ReactElement => {
    const statusIcon = entry.status === 'done'
        ? 'check_circle'
        : entry.status === 'error'
            ? 'error'
            : 'schedule';

    const statusColor = entry.status === 'done'
        ? '#34a853'
        : entry.status === 'error'
            ? '#ba1a1a'
            : 'var(--muted)';

    return (
        <div
            style={{
                background:   'var(--low)',
                borderRadius: '10px',
                padding:      '10px 12px',
            }}
        >
            <div
                style={{
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'space-between',
                    marginBottom:   entry.status === 'uploading' ? '6px' : '0',
                }}
            >
                <div
                    style={{
                        fontSize:     '13px',
                        fontWeight:   500,
                        color:        'var(--text)',
                        whiteSpace:   'nowrap',
                        overflow:     'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth:     '300px',
                    }}
                >
                    {entry.file.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                        {fmtSize(entry.file.size)}
                    </span>
                    <MaterialIcon n={statusIcon} s={16} c={statusColor} />
                </div>
            </div>

            {/* Barre de progression */}
            {entry.status === 'uploading' && (
                <div
                    style={{
                        background:   'var(--mid)',
                        borderRadius: '9999px',
                        height:       '4px',
                        overflow:     'hidden',
                    }}
                >
                    <div className="progress" style={{ width: `${entry.progress}%` }} />
                </div>
            )}

            {/* Message d'erreur */}
            {entry.status === 'error' && entry.error && (
                <div style={{ fontSize: '11px', color: '#ba1a1a', marginTop: '4px' }}>
                    {entry.error}
                </div>
            )}
        </div>
    );
};
