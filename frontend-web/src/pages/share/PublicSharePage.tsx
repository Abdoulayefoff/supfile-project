// Page publique d'accès à un partage — accessible sans compte

import { useState, useCallback, useEffect } from 'react';
import type { ReactElement }                        from 'react';
import { useParams, useNavigate }           from 'react-router-dom';
import { MaterialIcon }                  from '@/components/ui/MaterialIcon';
import { fmtSize, fmtDate, getMimeInfo } from '@/lib/utils';
import {
    usePublicShare,
    useValidateSharePassword,
    useDownloadPublicShare,
    getPublicPreviewUrl,
} from '@/hooks/useShares';
import type { PublicShareResponse } from '@/services/shareService';

// Composant principal
const PublicSharePage = (): ReactElement => {
    const { token }  = useParams<{ token: string }>();
    const navigate   = useNavigate();
    const safeToken  = token ?? '';

    const { data, isLoading, isError, error } = usePublicShare(safeToken);
    const validateMutation = useValidateSharePassword(safeToken);
    const downloadMutation = useDownloadPublicShare();

    const [password, setPassword]           = useState('');
    const [passwordError, setPasswordError] = useState('');

    // ── Détermine si le partage est protégé et non encore validé ──
    const isProtected = data && 'protected' in data && data.protected === true;

    // ── Données complètes du partage (après accès ou validation) ──
    const shareData = (data && !('protected' in data))
        ? data as PublicShareResponse
        : null;

    // ── Validation du mot de passe ──
    const handleValidate = useCallback(() => {
        setPasswordError('');

        if (!password.trim()) {
            setPasswordError('Veuillez saisir le mot de passe.');
            return;
        }

        validateMutation.mutate(
            { password: password.trim() },
            {
                onError: () => {
                    setPasswordError('Mot de passe incorrect.');
                    setPassword('');
                },
            },
        );
    }, [password, validateMutation]);

    // ── Téléchargement ──
    const handleDownload = useCallback(() => {
        if (!shareData?.resource) return;

        const fileName = shareData.resourceType === 'folder'
            ? `${shareData.resource.name}.zip`
            : shareData.resource.name;

        downloadMutation.mutate({
            token:    safeToken,
            fileName,
            password: password.trim() || undefined,
        });
    }, [shareData, safeToken, password, downloadMutation]);

    // ── Status HTTP de l'erreur ──
    const httpStatus = (error as (Error & { status?: number }) | null)?.status;

    // Rendu
    return (
        <div
            style={{
                minHeight:      '100vh',
                background:     'var(--bg)',
                display:        'flex',
                flexDirection:  'column',
                alignItems:     'center',
                justifyContent: 'center',
                padding:        '24px',
            }}
        >
            {/* ── Logo ── */}
            <div
                onClick={() => navigate('/')}
                style={{
                    display:      'flex',
                    alignItems:   'center',
                    gap:          '10px',
                    marginBottom: '28px',
                    cursor:       'pointer',
                }}
            >
                <div
                    style={{
                        width:          '34px',
                        height:         '34px',
                        borderRadius:   '9px',
                        background:     'linear-gradient(135deg,#005bbf,#1a73e8)',
                        display:        'flex',
                        alignItems:     'center',
                        justifyContent: 'center',
                    }}
                >
                    <MaterialIcon n="cloud" s={19} c="white" />
                </div>
                <span
                    style={{
                        fontFamily:    'Inter, sans-serif',
                        fontWeight:    900,
                        fontSize:      '19px',
                        letterSpacing: '-0.03em',
                        color:         '#005bbf',
                    }}
                >
                    Supfile
                </span>
            </div>

            {/* ── Carte ── */}
            <div
                className="fade"
                style={{
                    background:   'var(--surface)',
                    borderRadius: '22px',
                    padding:      '32px',
                    width:        '100%',
                    maxWidth:     '420px',
                    boxShadow:    '0 16px 56px rgba(0,91,191,.10)',
                    border:       '1px solid var(--border)',
                }}
            >
                {/* ── État chargement ── */}
                {isLoading && <LoadingSkeleton />}

                {/* ── Erreur réseau / expiration / introuvable ── */}
                {isError && !isLoading && (
                    <ErrorState
                        status={httpStatus}
                        onNavigate={() => navigate('/')}
                    />
                )}

                {/* ── Partage protégé par mot de passe ── */}
                {!isLoading && !isError && isProtected && (
                    <ProtectedState
                        resourceType={
                            (data as { resourceType: 'file' | 'folder' }).resourceType
                        }
                        password={password}
                        passwordError={passwordError}
                        isPending={validateMutation.isPending}
                        onPasswordChange={setPassword}
                        onValidate={handleValidate}
                        onNavigate={() => navigate('/auth')}
                    />
                )}

                {/* ── Partage accessible ── */}
                {!isLoading && !isError && shareData && (
                    <AccessibleState
                        shareData={shareData}
                        password={password}
                        isDownloading={downloadMutation.isPending}
                        onDownload={handleDownload}
                        onNavigate={() => navigate('/auth')}
                    />
                )}
            </div>
        </div>
    );
};

// Sous-composant — Chargement
const LoadingSkeleton = (): ReactElement => (
    <div
        style={{
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            gap:            '16px',
            padding:        '16px 0',
        }}
    >
        <div style={{ width: '52px',  height: '52px',  borderRadius: '50%',    background: 'var(--mid)' }} />
        <div style={{ width: '160px', height: '18px',  borderRadius: '8px',    background: 'var(--mid)' }} />
        <div style={{ width: '120px', height: '14px',  borderRadius: '8px',    background: 'var(--mid)' }} />
        <div style={{ width: '100%',  height: '44px',  borderRadius: '9999px', background: 'var(--mid)', marginTop: '8px' }} />
    </div>
);

// Sous-composant — Erreur (404 / 410 / réseau)
interface ErrorStateProps {
    status?:    number;
    onNavigate: () => void;
}

const ErrorState = ({ status, onNavigate }: ErrorStateProps): ReactElement => {
    const isExpired  = status === 410;
    const isNotFound = status === 404;

    const icon    = isExpired ? 'timer_off' : 'link_off';
    const title   = isExpired ? 'Lien expiré' : 'Lien introuvable';
    const message = isExpired
        ? "Ce lien de partage a expiré et n'est plus accessible."
        : isNotFound
            ? 'Ce lien de partage est invalide ou a été révoqué.'
            : 'Une erreur est survenue. Vérifiez votre connexion.';

    return (
        <div
            style={{
                display:       'flex',
                flexDirection: 'column',
                alignItems:    'center',
                gap:           '14px',
                textAlign:     'center',
                padding:       '8px 0',
            }}
        >
            <div
                style={{
                    width:          '64px',
                    height:         '64px',
                    borderRadius:   '50%',
                    background:     'rgba(186,26,26,.10)',
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                }}
            >
                <MaterialIcon n={icon} s={30} c="#ba1a1a" />
            </div>

            <div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
                    {title}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5 }}>
                    {message}
                </div>
            </div>

            <button
                onClick={onNavigate}
                style={{
                    marginTop:    '8px',
                    background:   'linear-gradient(135deg,#005bbf,#1a73e8)',
                    border:       'none',
                    borderRadius: '9999px',
                    padding:      '11px 28px',
                    cursor:       'pointer',
                    fontSize:     '14px',
                    fontWeight:   600,
                    color:        'white',
                    fontFamily:   'Inter, sans-serif',
                    boxShadow:    '0 4px 16px rgba(0,91,191,.28)',
                }}
            >
                Retour à l'accueil
            </button>
        </div>
    );
};

// Sous-composant — Partage protégé par mot de passe
interface ProtectedStateProps {
    resourceType:     'file' | 'folder';
    password:         string;
    passwordError:    string;
    isPending:        boolean;
    onPasswordChange: (v: string) => void;
    onValidate:       () => void;
    onNavigate:       () => void;
}

const ProtectedState = ({
    resourceType,
    password,
    passwordError,
    isPending,
    onPasswordChange,
    onValidate,
    onNavigate,
}: ProtectedStateProps): ReactElement => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* ── En-tête ── */}
        <div style={{ textAlign: 'center' }}>
            <div
                style={{
                    width:          '56px',
                    height:         '56px',
                    borderRadius:   '50%',
                    background:     'rgba(0,91,191,.10)',
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    margin:         '0 auto 12px',
                }}
            >
                <MaterialIcon
                    n={resourceType === 'folder' ? 'folder_zip' : 'lock'}
                    s={26}
                    c="#005bbf"
                />
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
                Contenu protégé
            </div>
            <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                Ce partage est protégé par un mot de passe.
            </div>
        </div>

        {/* ── Champ mot de passe ── */}
        <div>
            <label className="sf-label" style={{ color: 'var(--muted)' }}>
                Mot de passe requis
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
                    <MaterialIcon n="lock" s={17} c="var(--muted)" />
                </span>
                <input
                    autoFocus
                    type="password"
                    value={password}
                    onChange={(e) => onPasswordChange(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && onValidate()}
                    placeholder="Saisir le mot de passe…"
                    className="sf-input"
                    style={{
                        width:       '100%',
                        paddingLeft: '40px',
                        background:  'var(--low)',
                        color:       'var(--text)',
                        border:      'none',
                        boxShadow:   passwordError
                            ? '0 0 0 2px #ba1a1a'
                            : undefined,
                    }}
                />
            </div>
            {passwordError && (
                <div style={{ fontSize: '12px', color: '#ba1a1a', marginTop: '6px' }}>
                    {passwordError}
                </div>
            )}
        </div>

        {/* ── Bouton accéder ── */}
        <button
            onClick={onValidate}
            disabled={isPending}
            style={{
                width:          '100%',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                gap:            '8px',
                background:     'linear-gradient(135deg,#005bbf,#1a73e8)',
                border:         'none',
                borderRadius:   '9999px',
                padding:        '12px',
                cursor:         isPending ? 'not-allowed' : 'pointer',
                opacity:        isPending ? 0.65 : 1,
                fontSize:       '14px',
                fontWeight:     600,
                color:          'white',
                fontFamily:     'Inter, sans-serif',
                boxShadow:      '0 4px 16px rgba(0,91,191,.28)',
                transition:     'all .2s',
            }}
        >
            {isPending
                ? <MaterialIcon n="hourglass_empty" s={16} c="white" />
                : <MaterialIcon n="lock_open" s={15} c="white" />
            }
            Accéder au fichier
        </button>

        {/* ── Lien connexion ── */}
        <button
            onClick={onNavigate}
            style={{
                width:        '100%',
                padding:      '11px',
                borderRadius: '9999px',
                border:       '1px solid var(--border)',
                background:   'none',
                cursor:       'pointer',
                color:        'var(--muted)',
                fontSize:     '13px',
                fontWeight:   600,
                fontFamily:   'Inter, sans-serif',
            }}
        >
            Se connecter pour plus de fonctionnalités
        </button>
    </div>
);

// Sous-composant — Partage accessible (déverrouillé)
interface AccessibleStateProps {
    shareData:     PublicShareResponse;
    password:      string;
    isDownloading: boolean;
    onDownload:    () => void;
    onNavigate:    () => void;
}

const AccessibleState = ({
    shareData,
    password,
    isDownloading,
    onDownload,
    onNavigate,
}: AccessibleStateProps): ReactElement => {
    const resource = shareData.resource;
    const isFolder = shareData.resourceType === 'folder';
    const mimeType = resource?.mimeType ?? '';
    const { icon: mimeIcon, color: mimeColor } = getMimeInfo(mimeType);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* ── En-tête fichier ── */}
            <div style={{ textAlign: 'center', marginBottom: '6px' }}>
                <MaterialIcon
                    n={isFolder ? 'folder_zip' : mimeIcon}
                    s={52}
                    c={isFolder ? '#005bbf' : mimeColor}
                />
                <div
                    style={{
                        fontSize:     '19px',
                        fontWeight:   700,
                        color:        'var(--text)',
                        marginTop:    '10px',
                        marginBottom: '4px',
                        wordBreak:    'break-all',
                    }}
                >
                    {resource?.name ?? 'Ressource partagée'}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                    {resource?.size ? fmtSize(resource.size) : ''}
                    {shareData.expiresAt
                        ? ` · Expire le ${fmtDate(shareData.expiresAt)}`
                        : ''
                    }
                </div>
            </div>

            {/* ── Badge accès autorisé ── */}
            <div
                style={{
                    background:   'rgba(52,168,83,.12)',
                    border:       '1px solid rgba(52,168,83,.30)',
                    borderRadius: '10px',
                    padding:      '10px 14px',
                    display:      'flex',
                    alignItems:   'center',
                    gap:          '8px',
                }}
            >
                <MaterialIcon n="check_circle" s={19} c="#34a853" fill />
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#34a853' }}>
                    Accès autorisé
                </span>
            </div>

            {/* ── Viewer inline (fichiers uniquement) ── */}
            {resource && !isFolder && (
                <InlineViewer
                    token={shareData.token}
                    mimeType={mimeType}
                    name={resource.name}
                    password={password}
                />
            )}

            {/* ── Viewer dossier ── */}
            {isFolder && (
                <div
                    style={{
                        background:     'var(--low)',
                        borderRadius:   '14px',
                        minHeight:      '120px',
                        display:        'flex',
                        flexDirection:  'column',
                        alignItems:     'center',
                        justifyContent: 'center',
                        gap:            '8px',
                        padding:        '24px',
                    }}
                >
                    <MaterialIcon n="folder_zip" s={52} c="#005bbf" />
                    <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
                        Archive ZIP — {resource?.name ?? ''}.zip
                    </span>
                </div>
            )}

            {/* ── Bouton télécharger ── */}
            <button
                onClick={onDownload}
                disabled={isDownloading}
                style={{
                    width:          '100%',
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    gap:            '8px',
                    background:     'linear-gradient(135deg,#005bbf,#1a73e8)',
                    border:         'none',
                    borderRadius:   '9999px',
                    padding:        '12px',
                    cursor:         isDownloading ? 'not-allowed' : 'pointer',
                    opacity:        isDownloading ? 0.65 : 1,
                    fontSize:       '14px',
                    fontWeight:     600,
                    color:          'white',
                    fontFamily:     'Inter, sans-serif',
                    boxShadow:      '0 4px 16px rgba(0,91,191,.28)',
                    transition:     'all .2s',
                }}
            >
                {isDownloading
                    ? <MaterialIcon n="hourglass_empty" s={16} c="white" />
                    : <MaterialIcon n="download" s={15} c="white" />
                }
                {isDownloading ? 'Téléchargement…' : 'Télécharger'}
            </button>

            {/* ── Lien connexion ── */}
            <button
                onClick={onNavigate}
                style={{
                    width:        '100%',
                    padding:      '11px',
                    borderRadius: '9999px',
                    border:       '1px solid var(--border)',
                    background:   'none',
                    cursor:       'pointer',
                    color:        'var(--muted)',
                    fontSize:     '13px',
                    fontWeight:   600,
                    fontFamily:   'Inter, sans-serif',
                }}
            >
                Se connecter pour plus de fonctionnalités
            </button>
        </div>
    );
};

// Sous-composant — InlineViewer
// Prévisualisation inline selon le type MIME
interface InlineViewerProps {
    token:    string;
    mimeType: string;
    name:     string;
    password: string;
}

const MIME_BY_EXT: Record<string, string> = {
    mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', avi: 'video/x-msvideo',
    mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', flac: 'audio/flac', aac: 'audio/aac', m4a: 'audio/mp4',
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp',
    pdf: 'application/pdf',
    txt: 'text/plain', md: 'text/plain', csv: 'text/csv', html: 'text/html',
};

const InlineViewer = ({
    token,
    mimeType: rawMime,
    name,
    password,
}: InlineViewerProps): ReactElement | null => {
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    const mimeType = (rawMime && rawMime !== 'application/octet-stream')
        ? rawMime
        : (MIME_BY_EXT[ext] ?? rawMime ?? '');

    const previewUrl = getPublicPreviewUrl(
        token,
        password.trim() || undefined,
    );

    // ── Image ──
    if (mimeType.startsWith('image/')) {
        return (
            <div
                style={{
                    background:     'var(--low)',
                    borderRadius:   '14px',
                    overflow:       'hidden',
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    minHeight:      '200px',
                }}
            >
                <img
                    src={previewUrl}
                    alt={name}
                    loading="lazy"
                    style={{
                        maxWidth:     '100%',
                        maxHeight:    '340px',
                        borderRadius: '10px',
                        objectFit:    'contain',
                    }}
                />
            </div>
        );
    }

    // ── Vidéo ── (CSP media-src autorise https://api.supfile-cloud.fr)
    if (mimeType.startsWith('video/')) {
        return (
            <div style={{ background: 'var(--low)', borderRadius: '14px', overflow: 'hidden' }}>
                <video
                    controls
                    style={{ width: '100%', display: 'block', maxHeight: '400px' }}
                    preload="metadata"
                >
                    <source src={previewUrl} type={mimeType} />
                </video>
            </div>
        );
    }

    // ── Audio ── (CSP media-src autorise https://api.supfile-cloud.fr)
    if (mimeType.startsWith('audio/')) {
        return (
            <div
                style={{
                    background:    'var(--low)',
                    borderRadius:  '14px',
                    padding:       '24px',
                    display:       'flex',
                    flexDirection: 'column',
                    alignItems:    'center',
                    gap:           '16px',
                }}
            >
                <MaterialIcon n="music_note" s={48} c="#9e4300" />
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>{name}</div>
                <audio controls src={previewUrl} style={{ width: '100%' }} preload="metadata" />
            </div>
        );
    }

    // ── PDF ── (CSP frame-src autorise https://api.supfile-cloud.fr)
    if (mimeType === 'application/pdf') {
        return (
            <div style={{ borderRadius: '14px', overflow: 'hidden', background: 'var(--low)' }}>
                <iframe
                    src={previewUrl}
                    title={name}
                    style={{ width: '100%', height: '600px', border: 'none', display: 'block' }}
                />
            </div>
        );
    }

    // ── Texte ──
    if (mimeType.startsWith('text/')) {
        return <TextPreview previewUrl={previewUrl} />;
    }

    return null;
};

// Sous-composant — TextPreview
// Charge le texte depuis l'URL de preview et l'affiche
const TextPreview = ({ previewUrl }: { previewUrl: string }): ReactElement => {
    const [text, setText] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const response = await fetch(previewUrl);
                const content  = await response.text();
                setText(content);
            } catch {
                setText('Impossible de charger le contenu.');
            }
        };
        void load();
    }, [previewUrl]);

    return (
        <div
            style={{
                background:    'var(--low)',
                borderRadius:  '14px',
                overflow:      'hidden',
                maxHeight:     '200px',
                overflowY:     'auto',
            }}
        >
            <pre
                style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize:   '12px',
                    lineHeight: 1.7,
                    color:      'var(--text)',
                    padding:    '16px',
                    whiteSpace: 'pre-wrap',
                    margin:     0,
                }}
            >
                {text || '…'}
            </pre>
        </div>
    );
};

export default PublicSharePage;