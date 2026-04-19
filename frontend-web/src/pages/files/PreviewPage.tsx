// Page de prévisualisation d'un fichier
// Route : /drive/preview/:fileId
// Fonctionnement :
//   1. Récupère les métadonnées via GET /api/files/{id}/info
//   2. Charge le contenu via GET /api/files/{id}/preview (blob → objectURL)
//      en passant le JWT dans le header Authorization via apiClient
//   3. Détecte le type MIME et affiche le bon composant de prévisualisation
//   4. Panneau d'informations latéral (nom, type, taille, date, propriétaire)

import { useState, useEffect, useCallback } from 'react';
import type { ReactElement }                from 'react';
import { useParams, useNavigate }           from 'react-router-dom';
import { useQuery }                         from '@tanstack/react-query';
import { MaterialIcon }              from '@/components/ui/MaterialIcon';
import { getMimeInfo, fmtSize, fmtDate } from '@/lib/utils';
import { useDownloadFile }           from '@/hooks/useFiles';
import apiClient                     from '@/lib/axios';

// Types

/** Réponse de GET /api/files/{id}/info */
interface FileInfo {
    id:        number;
    name:      string;
    size:      number;
    mimeType:  string;
    createdAt: string;
    updatedAt: string;
    owner:     string;
    folderId:  number | null;
}

/** Entrée minimale pour la navigation galerie */
interface SiblingFile {
    id:       number;
    mimeType: string;
}

// Hook interne — charge le blob de prévisualisation

/**
 * Charge le contenu du fichier via GET /api/files/{id}/preview
 * et retourne une objectURL utilisable dans les balises HTML.
 * Le JWT est envoyé via l'intercepteur Axios (header Authorization).
 */
const usePreviewBlob = (fileId: number, mimeType: string) => {
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState(false);

    useEffect(() => {
        // On ne charge le blob que pour les types prévisualisables
        const previewable = (
            mimeType.startsWith('image/')        ||
            mimeType.startsWith('video/')        ||
            mimeType.startsWith('audio/')        ||
            mimeType.startsWith('text/')         ||
            mimeType === 'application/pdf'
        );

        if (!previewable || !fileId) {
            setLoading(false);
            return;
        }

        let objectUrl: string | null = null;

        const load = async () => {
            try {
                setLoading(true);
                setError(false);

                // Axios retourne un ArrayBuffer qu'on convertit en Blob
                const response = await apiClient.get<ArrayBuffer>(
                    `/files/${fileId}/preview`,
                    { responseType: 'arraybuffer' },
                );

                const blob = new Blob([response.data], { type: mimeType });
                objectUrl  = URL.createObjectURL(blob);
                setBlobUrl(objectUrl);
            } catch {
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        void load();

        // Nettoyage : libère la mémoire quand le composant se démonte
        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [fileId, mimeType]);

    return { blobUrl, loading, error };
};

// Composant principal
const PreviewPage = (): ReactElement => {
    const { fileId }               = useParams<{ fileId: string }>();
    const navigate                 = useNavigate();
    const { mutate: downloadFile } = useDownloadFile();

    const [showInfo, setShowInfo] = useState(true);

    // ── Récupération des métadonnées ──
    const {
        data:      fileInfo,
        isLoading: infoLoading,
        isError:   infoError,
    } = useQuery({
        queryKey: ['files', 'info', fileId],
        queryFn:  async () => {
            const response = await apiClient.get<FileInfo>(
                `/files/${Number(fileId)}/info`,
            );
            return response.data;
        },
        enabled: !!fileId && !isNaN(Number(fileId)),
        retry:   false,
    });

    const { blobUrl, loading: blobLoading } = usePreviewBlob(
        Number(fileId),
        fileInfo?.mimeType ?? '',
    );

    // ── Fichiers frères — galerie image ──
    const isImage = fileInfo?.mimeType.startsWith('image/') ?? false;
    const { data: siblingFiles = [] } = useQuery({
        queryKey: ['files', 'siblings', fileInfo?.folderId],
        queryFn:  async () => {
            const res = await apiClient.get<SiblingFile[]>('/files', {
                params: { folderId: fileInfo!.folderId ?? '' },
            });
            return res.data;
        },
        enabled: isImage && !!fileInfo,
    });

    const imageFiles  = siblingFiles.filter((f) => f.mimeType.startsWith('image/'));
    const currentIdx  = imageFiles.findIndex((f) => f.id === fileInfo?.id);
    const prevImageId = currentIdx > 0                      ? imageFiles[currentIdx - 1].id : null;
    const nextImageId = currentIdx < imageFiles.length - 1  ? imageFiles[currentIdx + 1].id : null;

    // ── Navigation clavier ──
    useEffect(() => {
        if (!isImage) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft'  && prevImageId !== null) navigate(`/drive/preview/${prevImageId}`);
            if (e.key === 'ArrowRight' && nextImageId !== null) navigate(`/drive/preview/${nextImageId}`);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isImage, prevImageId, nextImageId, navigate]);

    // ── Téléchargement ──
    const handleDownload = useCallback(() => {
        if (!fileInfo) return;
        downloadFile({
            fileId:   fileInfo.id,
            fileName: fileInfo.name,
        });
    }, [fileInfo, downloadFile]);

    // ── Retour ──
    const handleBack = () => navigate(-1);

    // ── État de chargement ──
    if (infoLoading) {
        return <PreviewSkeleton />;
    }

    // ── État d'erreur ──
    if (infoError || !fileInfo) {
        return (
            <div
                style={{
                    maxWidth:       '1060px',
                    margin:         '0 auto',
                    display:        'flex',
                    flexDirection:  'column',
                    alignItems:     'center',
                    justifyContent: 'center',
                    minHeight:      '400px',
                    gap:            '16px',
                    opacity:        0.6,
                }}
            >
                <MaterialIcon n="error_outline" s={56} c="var(--muted)" />
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>
                    Fichier introuvable
                </div>
                <button
                    onClick={handleBack}
                    style={{
                        background:   'none',
                        border:       '1px solid var(--border)',
                        borderRadius: '9999px',
                        padding:      '8px 18px',
                        cursor:       'pointer',
                        fontSize:     '13px',
                        fontWeight:   600,
                        color:        'var(--text)',
                        fontFamily:   'Inter, sans-serif',
                    }}
                >
                    Retour
                </button>
            </div>
        );
    }

    const { icon: mimeIcon, color: mimeColor } = getMimeInfo(fileInfo.mimeType);

    return (
        <div
            className="fade"
            style={{
                maxWidth:      '1060px',
                margin:        '0 auto',
                display:       'flex',
                flexDirection: 'column',
                gap:           '20px',
            }}
        >
            {/* ── Toolbar ── */}
            <div
                style={{
                    display:        'flex',
                    justifyContent: 'space-between',
                    alignItems:     'center',
                    flexWrap:       'wrap',
                    gap:            '10px',
                }}
            >
                {/* Gauche : bouton retour + nom fichier */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        onClick={handleBack}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = 'var(--low)';
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = 'none';
                        }}
                        style={{
                            display:      'flex',
                            alignItems:   'center',
                            gap:          '7px',
                            background:   'none',
                            border:       '1px solid var(--border)',
                            borderRadius: '9999px',
                            padding:      '7px 15px',
                            cursor:       'pointer',
                            fontSize:     '13px',
                            fontWeight:   600,
                            color:        'var(--text)',
                            fontFamily:   'Inter, sans-serif',
                            transition:   'all .2s',
                        }}
                    >
                        <MaterialIcon n="arrow_back" s={16} c="var(--text)" />
                        Retour
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MaterialIcon n={mimeIcon} s={20} c={mimeColor} />
                        <span
                            style={{
                                fontSize:     '15px',
                                fontWeight:   600,
                                color:        'var(--text)',
                                maxWidth:     '320px',
                                overflow:     'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace:   'nowrap',
                            }}
                        >
                            {fileInfo.name}
                        </span>
                    </div>
                </div>

                {/* Droite : télécharger + toggle info */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                        onClick={handleDownload}
                        style={{
                            display:      'flex',
                            alignItems:   'center',
                            gap:          '6px',
                            background:   'linear-gradient(135deg,#005bbf,#1a73e8)',
                            border:       'none',
                            borderRadius: '9999px',
                            padding:      '8px 16px',
                            cursor:       'pointer',
                            fontSize:     '13px',
                            fontWeight:   600,
                            color:        'white',
                            fontFamily:   'Inter, sans-serif',
                            boxShadow:    '0 4px 16px rgba(0,91,191,.28)',
                            transition:   'all .2s',
                        }}
                    >
                        <MaterialIcon n="download" s={15} c="white" />
                        Télécharger
                    </button>

                    {/* Bouton toggle panneau info */}
                    <button
                        onClick={() => setShowInfo((v) => !v)}
                        style={{
                            display:        'flex',
                            alignItems:     'center',
                            justifyContent: 'center',
                            background:     'none',
                            border:         '1px solid var(--border)',
                            borderRadius:   '9999px',
                            padding:        '7px 12px',
                            cursor:         'pointer',
                            color:          showInfo ? '#005bbf' : 'var(--muted)',
                            transition:     'all .15s',
                        }}
                    >
                        <MaterialIcon
                            n="info"
                            s={15}
                            c={showInfo ? '#005bbf' : 'var(--muted)'}
                        />
                    </button>
                </div>
            </div>

            {/* ── Zone viewer + panneau info ── */}
            <div style={{ display: 'flex', gap: '18px', flex: 1 }}>

                {/* ── FileViewer ── */}
                <div
                    style={{
                        flex:           1,
                        background:     'var(--surface)',
                        borderRadius:   '18px',
                        border:         '1px solid var(--border)',
                        overflow:       'hidden',
                        display:        'flex',
                        alignItems:     'center',
                        justifyContent: 'center',
                        minHeight:      '480px',
                        position:       'relative',
                    }}
                >
                    {blobLoading ? (
                        <ViewerSkeleton />
                    ) : (
                        <FileViewer
                            mimeType={fileInfo.mimeType}
                            name={fileInfo.name}
                            size={fileInfo.size}
                            blobUrl={blobUrl}
                            onDownload={handleDownload}
                        />
                    )}

                    {/* ── Navigation galerie (images uniquement) ── */}
                    {isImage && prevImageId !== null && (
                        <button
                            onClick={() => navigate(`/drive/preview/${prevImageId}`)}
                            title="Image précédente (←)"
                            style={{
                                position:       'absolute',
                                left:           '12px',
                                top:            '50%',
                                transform:      'translateY(-50%)',
                                background:     'rgba(0,0,0,.45)',
                                border:         'none',
                                borderRadius:   '50%',
                                width:          '42px',
                                height:         '42px',
                                display:        'flex',
                                alignItems:     'center',
                                justifyContent: 'center',
                                cursor:         'pointer',
                                color:          'white',
                                backdropFilter: 'blur(6px)',
                                transition:     'background .15s',
                            }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,.7)'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,.45)'; }}
                        >
                            <MaterialIcon n="chevron_left" s={26} c="white" />
                        </button>
                    )}
                    {isImage && nextImageId !== null && (
                        <button
                            onClick={() => navigate(`/drive/preview/${nextImageId}`)}
                            title="Image suivante (→)"
                            style={{
                                position:       'absolute',
                                right:          '12px',
                                top:            '50%',
                                transform:      'translateY(-50%)',
                                background:     'rgba(0,0,0,.45)',
                                border:         'none',
                                borderRadius:   '50%',
                                width:          '42px',
                                height:         '42px',
                                display:        'flex',
                                alignItems:     'center',
                                justifyContent: 'center',
                                cursor:         'pointer',
                                color:          'white',
                                backdropFilter: 'blur(6px)',
                                transition:     'background .15s',
                            }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,.7)'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,.45)'; }}
                        >
                            <MaterialIcon n="chevron_right" s={26} c="white" />
                        </button>
                    )}

                    {/* Compteur position galerie */}
                    {isImage && imageFiles.length > 1 && (
                        <div
                            style={{
                                position:     'absolute',
                                bottom:       '12px',
                                left:         '50%',
                                transform:    'translateX(-50%)',
                                background:   'rgba(0,0,0,.45)',
                                backdropFilter: 'blur(6px)',
                                borderRadius: '9999px',
                                padding:      '4px 12px',
                                fontSize:     '12px',
                                fontWeight:   600,
                                color:        'white',
                                pointerEvents: 'none',
                            }}
                        >
                            {currentIdx + 1} / {imageFiles.length}
                        </div>
                    )}
                </div>

                {/* ── Panneau info ── */}
                {showInfo && (
                    <div
                        className="fade"
                        style={{
                            width:         '256px',
                            flexShrink:    0,
                            background:    'var(--surface)',
                            borderRadius:  '18px',
                            border:        '1px solid var(--border)',
                            padding:       '22px',
                            display:       'flex',
                            flexDirection: 'column',
                            gap:           '18px',
                        }}
                    >
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
                            Détails
                        </div>

                        {([
                            { label: 'Nom',         value: fileInfo.name               },
                            { label: 'Type',         value: fileInfo.mimeType           },
                            { label: 'Taille',       value: fmtSize(fileInfo.size)      },
                            { label: 'Modifié',      value: fmtDate(fileInfo.updatedAt) },
                            { label: 'Propriétaire', value: fileInfo.owner              },
                        ] as { label: string; value: string }[]).map(({ label, value }) => (
                            <div key={label}>
                                <div
                                    style={{
                                        fontSize:      '11px',
                                        fontWeight:    700,
                                        textTransform: 'uppercase',
                                        letterSpacing: '.08em',
                                        color:         'var(--muted)',
                                        marginBottom:  '3px',
                                    }}
                                >
                                    {label}
                                </div>
                                <div
                                    style={{
                                        fontSize:  '13px',
                                        color:     'var(--text)',
                                        wordBreak: 'break-all',
                                    }}
                                >
                                    {value}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// Sous-composant — FileViewer
// Sélectionne le bon rendu selon le type MIME

interface FileViewerProps {
    mimeType:   string;
    name:       string;
    size:       number;
    blobUrl:    string | null;
    onDownload: () => void;
}

const FileViewer = ({
    mimeType,
    name,
    size,
    blobUrl,
    onDownload,
}: FileViewerProps): ReactElement => {
    const { icon: mimeIcon, color: mimeColor } = getMimeInfo(mimeType);

    // ── Image ──
    if (mimeType.startsWith('image/')) {
        return (
            <div
                style={{
                    width:          '100%',
                    padding:        '24px',
                    display:        'flex',
                    justifyContent: 'center',
                    alignItems:     'center',
                }}
            >
                {blobUrl ? (
                    <img
                        src={blobUrl}
                        alt={name}
                        loading="lazy"
                        style={{
                            maxWidth:     '100%',
                            maxHeight:    '520px',
                            borderRadius: '12px',
                            objectFit:    'contain',
                        }}
                    />
                ) : (
                    <ImagePlaceholder name={name} />
                )}
            </div>
        );
    }

    // ── Vidéo ──
    if (mimeType.startsWith('video/')) {
        return (
            <div style={{ width: '100%', padding: '24px' }}>
                {blobUrl ? (
                    <video
                        src={blobUrl}
                        controls
                        style={{
                            width:        '100%',
                            borderRadius: '12px',
                            background:   '#000',
                        }}
                    />
                ) : (
                    <VideoPlaceholder name={name} />
                )}
            </div>
        );
    }

    // ── Audio ──
    if (mimeType.startsWith('audio/')) {
        return (
            <div
                style={{
                    padding:        '48px',
                    display:        'flex',
                    flexDirection:  'column',
                    alignItems:     'center',
                    gap:            '24px',
                    width:          '100%',
                }}
            >
                {/* Vinyle animé */}
                <div
                    className="float"
                    style={{
                        width:          '110px',
                        height:         '110px',
                        borderRadius:   '50%',
                        background:     'linear-gradient(135deg,#9e4300,#f97316)',
                        boxShadow:      '0 16px 48px rgba(158,67,0,.3)',
                        display:        'flex',
                        alignItems:     'center',
                        justifyContent: 'center',
                    }}
                >
                    <MaterialIcon n="music_note" s={48} c="white" fill />
                </div>

                {/* Nom + taille */}
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
                        {name}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                        {fmtSize(size)}
                    </div>
                </div>

                {/* Lecteur audio natif */}
                {blobUrl && (
                    <audio
                        src={blobUrl}
                        controls
                        style={{ width: '65%' }}
                    />
                )}
            </div>
        );
    }

    // ── PDF ──
    if (mimeType === 'application/pdf') {
        return (
            <div
                style={{
                    padding:        '36px',
                    display:        'flex',
                    flexDirection:  'column',
                    alignItems:     'center',
                    gap:            '18px',
                    width:          '100%',
                    height:         '100%',
                }}
            >
                {blobUrl ? (
                    <iframe
                        src={blobUrl}
                        title={name}
                        style={{
                            width:        '100%',
                            height:       '520px',
                            border:       'none',
                            borderRadius: '12px',
                        }}
                    />
                ) : (
                    <>
                        <MaterialIcon n="picture_as_pdf" s={64} c="#ba1a1a" />
                        <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
                            {name}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                            {fmtSize(size)} · PDF
                        </div>
                        <button
                            onClick={onDownload}
                            style={{
                                display:      'flex',
                                alignItems:   'center',
                                gap:          '6px',
                                background:   'linear-gradient(135deg,#005bbf,#1a73e8)',
                                border:       'none',
                                borderRadius: '9999px',
                                padding:      '9px 20px',
                                cursor:       'pointer',
                                fontSize:     '13px',
                                fontWeight:   600,
                                color:        'white',
                                fontFamily:   'Inter, sans-serif',
                                boxShadow:    '0 4px 16px rgba(0,91,191,.28)',
                            }}
                        >
                            <MaterialIcon n="open_in_new" s={15} c="white" />
                            Ouvrir la visionneuse
                        </button>
                    </>
                )}
            </div>
        );
    }

    // ── Texte / Markdown ──
    if (mimeType.startsWith('text/')) {
        return <TextViewer blobUrl={blobUrl} />;
    }

    // ── Fallback — type non prévisualisable ──
    return (
        <div
            style={{
                display:       'flex',
                flexDirection: 'column',
                alignItems:    'center',
                gap:           '14px',
                opacity:       0.6,
            }}
        >
            <MaterialIcon n={mimeIcon} s={68} c={mimeColor} />
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
                Aperçu non disponible
            </div>
            <button
                onClick={onDownload}
                style={{
                    display:      'flex',
                    alignItems:   'center',
                    gap:          '6px',
                    background:   'linear-gradient(135deg,#005bbf,#1a73e8)',
                    border:       'none',
                    borderRadius: '9999px',
                    padding:      '9px 20px',
                    cursor:       'pointer',
                    fontSize:     '13px',
                    fontWeight:   600,
                    color:        'white',
                    fontFamily:   'Inter, sans-serif',
                    boxShadow:    '0 4px 16px rgba(0,91,191,.28)',
                }}
            >
                <MaterialIcon n="download" s={15} c="white" />
                Télécharger
            </button>
        </div>
    );
};

// Sous-composant — TextViewer
// Charge et affiche le contenu texte depuis le blobUrl

const TextViewer = ({ blobUrl }: { blobUrl: string | null }): ReactElement => {
    const [text, setText] = useState<string>('');

    useEffect(() => {
        if (!blobUrl) return;

        const load = async () => {
            try {
                const response = await fetch(blobUrl);
                const content  = await response.text();
                setText(content);
            } catch {
                setText('Impossible de charger le contenu.');
            }
        };

        void load();
    }, [blobUrl]);

    return (
        <div
            style={{
                width:     '100%',
                height:    '100%',
                padding:   '32px',
                overflowY: 'auto',
            }}
        >
            <pre
                style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize:   '13px',
                    lineHeight: 1.8,
                    color:      'var(--text)',
                    whiteSpace: 'pre-wrap',
                    wordBreak:  'break-word',
                    margin:     0,
                }}
            >
                {text || 'Fichier vide.'}
            </pre>
        </div>
    );
};

// Placeholders visuels
const ImagePlaceholder = ({ name }: { name: string }): ReactElement => (
    <div
        style={{
            maxWidth:       '480px',
            width:          '100%',
            aspectRatio:    '4/3',
            borderRadius:   '12px',
            background:     'linear-gradient(135deg,rgba(0,91,191,.10),rgba(26,115,232,.06))',
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            '12px',
        }}
    >
        <MaterialIcon n="image" s={68} c="#005bbf55" />
        <span style={{ fontSize: '13px', color: 'var(--muted)' }}>{name}</span>
    </div>
);

const VideoPlaceholder = ({ name }: { name: string }): ReactElement => (
    <div
        style={{
            width:          '100%',
            aspectRatio:    '16/9',
            background:     '#000',
            borderRadius:   '12px',
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            '16px',
        }}
    >
        <div
            style={{
                width:          '58px',
                height:         '58px',
                borderRadius:   '50%',
                border:         '2px solid rgba(255,255,255,.4)',
                background:     'rgba(255,255,255,.15)',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
            }}
        >
            <MaterialIcon n="play_arrow" s={30} c="white" fill />
        </div>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,.6)' }}>{name}</span>
    </div>
);

// Skeletons de chargement
const PreviewSkeleton = (): ReactElement => (
    <div
        style={{
            maxWidth:      '1060px',
            margin:        '0 auto',
            display:       'flex',
            flexDirection: 'column',
            gap:           '20px',
        }}
    >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ width: '80px',  height: '34px', borderRadius: '9999px', background: 'var(--mid)' }} />
                <div style={{ width: '200px', height: '34px', borderRadius: '10px',   background: 'var(--mid)' }} />
            </div>
            <div style={{ width: '120px', height: '34px', borderRadius: '9999px', background: 'var(--mid)' }} />
        </div>
        <div style={{ height: '480px', borderRadius: '18px', background: 'var(--mid)' }} />
    </div>
);

const ViewerSkeleton = (): ReactElement => (
    <div
        style={{
            width:          '100%',
            height:         '100%',
            minHeight:      '480px',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            flexDirection:  'column',
            gap:            '16px',
            opacity:        0.5,
        }}
    >
        <MaterialIcon n="hourglass_empty" s={36} c="var(--muted)" />
        <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Chargement…</span>
    </div>
);

export default PreviewPage;