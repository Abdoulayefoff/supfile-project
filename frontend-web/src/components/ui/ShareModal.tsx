// Modal de partage d'un fichier ou d'un dossier
// Onglet "Lien public"   → POST /api/shares (isPublic: true)
// Onglet "Partage privé" → POST /api/shares (isPublic: false + sharedWithEmail)

import { useState }          from 'react';
import type { ReactElement } from 'react';
import { useCreateShare } from '@/hooks/useShares';
import { MaterialIcon }   from '@/components/ui/MaterialIcon';

// Types
interface ShareModalProps {
    type:       'file' | 'folder';
    resourceId: number;
    name:       string;
    onClose:    () => void;
}
type Tab = 'public' | 'private';

// Composant principal
export const ShareModal = ({
    type,
    resourceId,
    name,
    onClose,
}: ShareModalProps): ReactElement => {
    const createShareMutation = useCreateShare();

    const [tab, setTab]                   = useState<Tab>('public');
    const [password, setPassword]         = useState('');
    const [expiresAt, setExpiresAt]       = useState('');
    const [email, setEmail]               = useState('');
    const [shareLink, setShareLink]       = useState('');
    const [shareCreated, setShareCreated] = useState(false);
    const [error, setError]               = useState('');
    const [copied, setCopied]             = useState(false);

    // ── Soumission ──
    const handleSubmit = () => {
        setError('');

        if (tab === 'private' && !email.trim()) {
            setError("L'adresse email est requise pour un partage privé.");
            return;
        }

        // Le backend attend type + resourceId (vérifié dans ShareController)
        const tabPayload = tab === 'private'
            ? {
                isPublic:        false,
                sharedWithEmail: email.trim(),
            }
            : {
                isPublic:  true,
                ...(password.trim()  ? { password:  password.trim()  } : {}),
                ...(expiresAt.trim() ? { expiresAt: expiresAt.trim() } : {}),
            };

        createShareMutation.mutate(
            {
                type,
                resourceId,
                ...tabPayload,
            },
            {
                onSuccess: (data) => {
                    if (tab === 'public') {
                        const base = window.location.origin;
                        setShareLink(`${base}/share/${data.token}`);
                    }
                    setShareCreated(true);
                    setError('');
                },
                onError: () => {
                    setError('Une erreur est survenue. Vérifiez les données saisies.');
                },
            },
        );
    };

    // ── Copie du lien ──
    const copyLink = () => {
        void navigator.clipboard.writeText(shareLink).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    // ── Réinitialisation après un partage ──
    const handleReset = () => {
        setShareCreated(false);
        setShareLink('');
        setPassword('');
        setExpiresAt('');
        setEmail('');
        setError('');
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
                    width:        '480px',
                    boxShadow:    '0 24px 80px rgba(0,0,0,.2)',
                    border:       '1px solid var(--border)',
                }}
            >
                {/* ── Header ── */}
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
                            <MaterialIcon n="share" s={20} c="#005bbf" />
                        </div>
                        <div>
                            <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)' }}>
                                Partager
                            </div>
                            <div
                                style={{
                                    fontSize:     '12px',
                                    color:        'var(--muted)',
                                    maxWidth:     '280px',
                                    overflow:     'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace:   'nowrap',
                                }}
                            >
                                {isFolder ? 'Dossier' : 'Fichier'} : {name}
                            </div>
                        </div>
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

                {/* ── Onglets (masqués après création) ── */}
                {!shareCreated && (
                    <div
                        style={{
                            display:      'flex',
                            background:   'var(--low)',
                            borderRadius: '12px',
                            padding:      '4px',
                            marginBottom: '20px',
                            gap:          '4px',
                        }}
                    >
                        {([
                            { key: 'public',  icon: 'link',       label: 'Lien public'   },
                            { key: 'private', icon: 'person_add', label: 'Partage privé' },
                        ] as { key: Tab; icon: string; label: string }[]).map(({ key, icon, label }) => (
                            <button
                                key={key}
                                onClick={() => {
                                    setTab(key);
                                    setError('');
                                    setShareCreated(false);
                                    setShareLink('');
                                }}
                                style={{
                                    flex:           1,
                                    padding:        '9px 10px',
                                    borderRadius:   '9px',
                                    border:         'none',
                                    cursor:         'pointer',
                                    background:     tab === key ? 'var(--surface)' : 'transparent',
                                    color:          tab === key ? '#005bbf' : 'var(--muted)',
                                    fontWeight:     tab === key ? 700 : 500,
                                    fontSize:       '13px',
                                    fontFamily:     'Inter, sans-serif',
                                    display:        'flex',
                                    alignItems:     'center',
                                    justifyContent: 'center',
                                    gap:            '7px',
                                    boxShadow:      tab === key ? '0 1px 6px rgba(0,0,0,.08)' : 'none',
                                    transition:     'all .15s',
                                }}
                            >
                                <MaterialIcon
                                    n={icon}
                                    s={16}
                                    c={tab === key ? '#005bbf' : 'var(--muted)'}
                                />
                                {label}
                            </button>
                        ))}
                    </div>
                )}

                {/* ── Contenu principal ── */}
                {!shareCreated ? (
                    <>
                        {tab === 'public' ? (
                            <PublicShareForm
                                password={password}
                                expiresAt={expiresAt}
                                onPasswordChange={setPassword}
                                onExpiresAtChange={setExpiresAt}
                            />
                        ) : (
                            <PrivateShareForm
                                email={email}
                                onEmailChange={setEmail}
                            />
                        )}

                        {/* ── Message d'erreur ── */}
                        {error && (
                            <div
                                style={{
                                    marginTop:    '14px',
                                    padding:      '10px 14px',
                                    borderRadius: '10px',
                                    background:   'rgba(186,26,26,.08)',
                                    color:        '#ba1a1a',
                                    fontSize:     '13px',
                                    display:      'flex',
                                    alignItems:   'center',
                                    gap:          '8px',
                                }}
                            >
                                <MaterialIcon n="error_outline" s={16} c="#ba1a1a" />
                                {error}
                            </div>
                        )}

                        {/* ── Footer ── */}
                        <div
                            style={{
                                display:        'flex',
                                justifyContent: 'flex-end',
                                gap:            '10px',
                                marginTop:      '22px',
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
                                disabled={createShareMutation.isPending}
                                style={{
                                    background:   'linear-gradient(135deg,#005bbf,#1a73e8)',
                                    border:       'none',
                                    borderRadius: '9999px',
                                    padding:      '9px 22px',
                                    fontSize:     '14px',
                                    fontWeight:   600,
                                    color:        'white',
                                    cursor:       createShareMutation.isPending ? 'not-allowed' : 'pointer',
                                    opacity:      createShareMutation.isPending ? 0.65 : 1,
                                    display:      'inline-flex',
                                    alignItems:   'center',
                                    gap:          '6px',
                                    fontFamily:   'Inter, sans-serif',
                                    boxShadow:    '0 4px 16px rgba(0,91,191,.28)',
                                    transition:   'all .2s',
                                }}
                            >
                                {createShareMutation.isPending
                                    ? <MaterialIcon n="hourglass_empty" s={16} c="white" />
                                    : <MaterialIcon n="share" s={16} c="white" />
                                }
                                {tab === 'public' ? 'Créer le lien' : "Envoyer l'invitation"}
                            </button>
                        </div>
                    </>
                ) : (
                    /* ── État succès ── */
                    <ShareSuccess
                        tab={tab}
                        shareLink={shareLink}
                        email={email}
                        copied={copied}
                        onCopy={copyLink}
                        onClose={onClose}
                        onReset={handleReset}
                    />
                )}
            </div>
        </div>
    );
};

// Sous-composant — Formulaire partage public
interface PublicShareFormProps {
    password:          string;
    expiresAt:         string;
    onPasswordChange:  (v: string) => void;
    onExpiresAtChange: (v: string) => void;
}

const PublicShareForm = ({
    password,
    expiresAt,
    onPasswordChange,
    onExpiresAtChange,
}: PublicShareFormProps): ReactElement => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* ── Info ── */}
        <div
            style={{
                padding:      '11px 14px',
                borderRadius: '10px',
                background:   'rgba(0,91,191,.07)',
                display:      'flex',
                gap:          '10px',
                alignItems:   'flex-start',
            }}
        >
            <MaterialIcon n="info" s={17} c="#005bbf" />
            <span style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.4 }}>
                Un lien unique sera généré. Toute personne avec ce lien pourra accéder au contenu.
            </span>
        </div>

        {/* ── Mot de passe (optionnel) ── */}
        <div>
            <label className="sf-label" style={{ color: 'var(--muted)' }}>
                Mot de passe (optionnel)
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
                    type="password"
                    value={password}
                    onChange={(e) => onPasswordChange(e.target.value)}
                    placeholder="Laisser vide pour un accès libre"
                    className="sf-input"
                    style={{
                        width:       '100%',
                        paddingLeft: '40px',
                        background:  'var(--low)',
                        color:       'var(--text)',
                        border:      'none',
                    }}
                />
            </div>
        </div>

        {/* ── Date d'expiration (optionnel) ── */}
        <div>
            <label className="sf-label" style={{ color: 'var(--muted)' }}>
                Date d'expiration (optionnel)
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
                    <MaterialIcon n="schedule" s={17} c="var(--muted)" />
                </span>
                <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => onExpiresAtChange(e.target.value)}
                    className="sf-input"
                    style={{
                        width:       '100%',
                        paddingLeft: '40px',
                        background:  'var(--low)',
                        color:       'var(--text)',
                        border:      'none',
                    }}
                />
            </div>
        </div>
    </div>
);

// Sous-composant — Formulaire partage privé
interface PrivateShareFormProps {
    email:         string;
    onEmailChange: (v: string) => void;
}

const PrivateShareForm = ({
    email,
    onEmailChange,
}: PrivateShareFormProps): ReactElement => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* ── Info ── */}
        <div
            style={{
                padding:      '11px 14px',
                borderRadius: '10px',
                background:   'rgba(0,91,191,.07)',
                display:      'flex',
                gap:          '10px',
                alignItems:   'flex-start',
            }}
        >
            <MaterialIcon n="info" s={17} c="#005bbf" />
            <span style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.4 }}>
                Le contenu apparaîtra dans la section "Partagés" du destinataire.
                Il doit avoir un compte SUPFile.
            </span>
        </div>

        {/* ── Email du destinataire ── */}
        <div>
            <label className="sf-label" style={{ color: 'var(--muted)' }}>
                Adresse email du destinataire *
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
                    <MaterialIcon n="email" s={17} c="var(--muted)" />
                </span>
                <input
                    autoFocus
                    type="email"
                    value={email}
                    onChange={(e) => onEmailChange(e.target.value)}
                    placeholder="exemple@email.com"
                    className="sf-input"
                    style={{
                        width:       '100%',
                        paddingLeft: '40px',
                        background:  'var(--low)',
                        color:       'var(--text)',
                        border:      'none',
                    }}
                />
            </div>
        </div>
    </div>
);

// Sous-composant — État succès
interface ShareSuccessProps {
    tab:       Tab;
    shareLink: string;
    email:     string;
    copied:    boolean;
    onCopy:    () => void;
    onClose:   () => void;
    onReset:   () => void;
}

const ShareSuccess = ({
    tab,
    shareLink,
    email,
    copied,
    onCopy,
    onClose,
    onReset,
}: ShareSuccessProps): ReactElement => (
    <div
        style={{
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            gap:            '18px',
            padding:        '8px 0 4px',
        }}
    >
        {/* ── Icône succès ── */}
        <div
            style={{
                width:          '56px',
                height:         '56px',
                borderRadius:   '50%',
                background:     'rgba(52,168,83,.12)',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
            }}
        >
            <MaterialIcon n="check_circle" s={30} c="#34a853" fill />
        </div>

        <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
                {tab === 'public' ? 'Lien créé !' : 'Invitation envoyée !'}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                {tab === 'public'
                    ? 'Copiez le lien ci-dessous pour le partager.'
                    : `${email} peut maintenant accéder au contenu.`
                }
            </div>
        </div>

        {/* ── Lien copiable (partage public uniquement) ── */}
        {tab === 'public' && shareLink && (
            <div
                style={{
                    display:      'flex',
                    alignItems:   'center',
                    gap:          '8px',
                    background:   'var(--low)',
                    borderRadius: '12px',
                    padding:      '10px 14px',
                    width:        '100%',
                }}
            >
                <MaterialIcon n="link" s={16} c="var(--muted)" />
                <span
                    style={{
                        flex:         1,
                        fontSize:     '12px',
                        color:        'var(--text)',
                        overflow:     'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace:   'nowrap',
                        fontFamily:   'monospace',
                    }}
                >
                    {shareLink}
                </span>
                <button
                    onClick={onCopy}
                    style={{
                        background:   copied ? 'rgba(52,168,83,.12)' : 'rgba(0,91,191,.10)',
                        border:       'none',
                        borderRadius: '8px',
                        padding:      '6px 12px',
                        cursor:       'pointer',
                        display:      'flex',
                        alignItems:   'center',
                        gap:          '5px',
                        fontSize:     '12px',
                        fontWeight:   600,
                        color:        copied ? '#34a853' : '#005bbf',
                        fontFamily:   'Inter, sans-serif',
                        transition:   'all .2s',
                        whiteSpace:   'nowrap',
                    }}
                >
                    <MaterialIcon
                        n={copied ? 'check' : 'content_copy'}
                        s={14}
                        c={copied ? '#34a853' : '#005bbf'}
                    />
                    {copied ? 'Copié !' : 'Copier'}
                </button>
            </div>
        )}

        {/* ── Actions ── */}
        <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
            <button
                onClick={onReset}
                style={{
                    flex:         1,
                    background:   'none',
                    border:       '1px solid var(--border)',
                    borderRadius: '9999px',
                    padding:      '9px 16px',
                    fontSize:     '13px',
                    fontWeight:   600,
                    color:        'var(--muted)',
                    cursor:       'pointer',
                    fontFamily:   'Inter, sans-serif',
                }}
            >
                Nouveau partage
            </button>
            <button
                onClick={onClose}
                style={{
                    flex:         1,
                    background:   'linear-gradient(135deg,#005bbf,#1a73e8)',
                    border:       'none',
                    borderRadius: '9999px',
                    padding:      '9px 16px',
                    fontSize:     '13px',
                    fontWeight:   600,
                    color:        'white',
                    cursor:       'pointer',
                    fontFamily:   'Inter, sans-serif',
                    boxShadow:    '0 4px 16px rgba(0,91,191,.28)',
                }}
            >
                Fermer
            </button>
        </div>
    </div>
);