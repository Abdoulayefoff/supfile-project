// Page des paramètres utilisateur
// 3 onglets :
//   - Profil     : modification prénom/nom/email + upload avatar
//   - Sécurité   : changement de mot de passe
//   - Préférences: thème clair/sombre 
// Hooks utilisés :
//   useMe, useUpdateProfile, useChangePassword, useUploadAvatar, useChangeEmail

import { useState, useRef, useEffect } from 'react';
import type { ReactElement, ChangeEvent } from 'react';
import { useNavigate }     from 'react-router-dom';
import { MaterialIcon }    from '@/components/ui/MaterialIcon';
import { fmtSize }         from '@/lib/utils';
import { useAuthStore }    from '@/stores/authStore';
import {
    useMe,
    useUpdateProfile,
    useChangePassword,
    useUploadAvatar,
    useChangeEmail,
    useDeleteAccount,
} from '@/hooks/useUser';

// Types
type Tab = 'profile' | 'security' | 'preferences';

interface TabDef {
    key:   Tab;
    label: string;
    icon:  string;
}

const TABS: TabDef[] = [
    { key: 'profile',     label: 'Profil',      icon: 'person' },
    { key: 'security',    label: 'Sécurité',    icon: 'lock'   },
    { key: 'preferences', label: 'Préférences', icon: 'tune'   },
];

// Composant principal
const SettingsPage = (): ReactElement => {
    const [activeTab, setActiveTab] = useState<Tab>('profile');
    const navigate = useNavigate();
    const deleteAccount = useDeleteAccount();

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState('');
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const handleDeleteAccount = async () => {
        if (deleteConfirm !== 'SUPPRIMER') {
            setDeleteError('Tapez exactement SUPPRIMER pour confirmer');
            return;
        }
        try {
            await deleteAccount.mutateAsync();
            navigate('/auth');
        } catch {
            setDeleteError('Une erreur est survenue. Veuillez réessayer.');
        }
    };

    return (
        <div
            className="fade"
            style={{ maxWidth: '680px', margin: '0 auto' }}
        >
            {/* ── Titre ── */}
            <div
                style={{
                    fontSize:     '24px',
                    fontWeight:   800,
                    color:        'var(--text)',
                    marginBottom: '24px',
                }}
            >
                Paramètres
            </div>

            {/* ── Sélecteur d'onglets ── */}
            <div
                style={{
                    display:      'flex',
                    gap:          '3px',
                    background:   'var(--low)',
                    padding:      '4px',
                    borderRadius: '11px',
                    marginBottom: '24px',
                }}
            >
                {TABS.map(({ key, label, icon }) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        style={{
                            flex:           1,
                            display:        'flex',
                            alignItems:     'center',
                            justifyContent: 'center',
                            gap:            '7px',
                            padding:        '9px 12px',
                            borderRadius:   '8px',
                            border:         'none',
                            cursor:         'pointer',
                            fontFamily:     'Inter, sans-serif',
                            fontWeight:     600,
                            fontSize:       '13px',
                            transition:     'all .15s',
                            background:     activeTab === key
                                ? 'var(--surface)'
                                : 'transparent',
                            color:          activeTab === key
                                ? '#005bbf'
                                : 'var(--muted)',
                            boxShadow:      activeTab === key
                                ? '0 1px 4px rgba(0,0,0,.08)'
                                : 'none',
                        }}
                    >
                        <MaterialIcon
                            n={icon}
                            s={16}
                            c={activeTab === key ? '#005bbf' : 'var(--muted)'}
                        />
                        {label}
                    </button>
                ))}
            </div>

            {/* ── Contenu onglet ── */}
            <div
                style={{
                    background:   'var(--surface)',
                    borderRadius: '18px',
                    padding:      '28px',
                    border:       '1px solid var(--border)',
                }}
            >
                {activeTab === 'profile'     && <ProfileTab />}
                {activeTab === 'security'    && <SecurityTab />}
                {activeTab === 'preferences' && <PreferencesTab />}
            </div>

            {/* ── Zone de danger ── */}
            <div style={{
                marginTop:    '32px',
                borderRadius: '18px',
                border:       '1px solid rgba(186,26,26,.25)',
                background:   'rgba(186,26,26,.03)',
                padding:      '24px 28px',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <MaterialIcon n="warning" s={18} c="#ba1a1a" />
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#ba1a1a' }}>
                        Zone de danger
                    </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 16px' }}>
                    La suppression de votre compte est définitive et irréversible. Toutes vos données
                    (fichiers, dossiers, partages) seront supprimées conformément au RGPD.
                </p>
                <button
                    type="button"
                    onClick={() => { setShowDeleteModal(true); setDeleteError(null); setDeleteConfirm(''); }}
                    style={{
                        padding:      '9px 18px',
                        borderRadius: '10px',
                        border:       '1px solid rgba(186,26,26,.4)',
                        background:   'rgba(186,26,26,.07)',
                        color:        '#ba1a1a',
                        fontWeight:   600,
                        fontSize:     '13px',
                        cursor:       'pointer',
                        fontFamily:   'Inter, sans-serif',
                    }}
                >
                    Supprimer mon compte
                </button>
            </div>

            {/* ── Modal de confirmation suppression ── */}
            {showDeleteModal && (
                <div style={{
                    position:   'fixed',
                    inset:      0,
                    background: 'rgba(0,0,0,.45)',
                    display:    'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex:     200,
                    padding:    '16px',
                }}>
                    <div className="fade" style={{
                        background:   'var(--surface)',
                        borderRadius: '20px',
                        padding:      '32px',
                        maxWidth:     '420px',
                        width:        '100%',
                        boxShadow:    '0 16px 48px rgba(0,0,0,.18)',
                        border:       '1px solid var(--border)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <MaterialIcon n="delete_forever" s={22} c="#ba1a1a" />
                            <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>
                                Supprimer mon compte
                            </span>
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '20px', lineHeight: 1.6 }}>
                            Cette action est <strong>irréversible</strong>. Tapez{' '}
                            <strong style={{ color: '#ba1a1a' }}>SUPPRIMER</strong>{' '}
                            pour confirmer.
                        </p>
                        <input
                            type="text"
                            placeholder="SUPPRIMER"
                            value={deleteConfirm}
                            onChange={(e) => { setDeleteConfirm(e.target.value); setDeleteError(null); }}
                            className="sf-input"
                            style={{ width: '100%', marginBottom: '12px', boxSizing: 'border-box' }}
                        />
                        {deleteError && (
                            <div style={{
                                fontSize:     '12px',
                                color:        '#ba1a1a',
                                marginBottom: '12px',
                                padding:      '8px 12px',
                                background:   'rgba(186,26,26,.07)',
                                borderRadius: '8px',
                            }}>
                                {deleteError}
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(false)}
                                style={{
                                    padding:      '9px 18px',
                                    borderRadius: '10px',
                                    border:       '1px solid var(--border)',
                                    background:   'var(--mid)',
                                    color:        'var(--text)',
                                    fontWeight:   600,
                                    fontSize:     '13px',
                                    cursor:       'pointer',
                                    fontFamily:   'Inter, sans-serif',
                                }}
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteAccount}
                                disabled={deleteAccount.isPending}
                                style={{
                                    padding:      '9px 18px',
                                    borderRadius: '10px',
                                    border:       'none',
                                    background:   '#ba1a1a',
                                    color:        'white',
                                    fontWeight:   600,
                                    fontSize:     '13px',
                                    cursor:       deleteAccount.isPending ? 'not-allowed' : 'pointer',
                                    opacity:      deleteAccount.isPending ? 0.7 : 1,
                                    fontFamily:   'Inter, sans-serif',
                                }}
                            >
                                {deleteAccount.isPending ? 'Suppression…' : 'Confirmer la suppression'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Onglet Profil
const ProfileTab = (): ReactElement => {
    const { data: serverUser } = useMe();
    const storeUser            = useAuthStore((s) => s.user);

    // On préfère les données serveur, fallback sur le store
    const user = serverUser ?? storeUser;

    const updateProfile = useUpdateProfile();
    const changeEmail   = useChangeEmail();
    const uploadAvatar  = useUploadAvatar();

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Champs du formulaire
    const [firstName, setFirstName] = useState('');
    const [lastName,  setLastName]  = useState('');
    const [email,     setEmail]     = useState('');
    const [saved,     setSaved]     = useState(false);

    // Avatar
    const [avatarProgress, setAvatarProgress] = useState(0);
    const [avatarUploading, setAvatarUploading] = useState(false);

    // Initialise les champs quand les données sont disponibles
    useEffect(() => {
        if (user) {
            setFirstName(user.firstName ?? '');
            setLastName(user.lastName  ?? '');
            setEmail(user.email);
        }
    }, [user]);

    // ── Sauvegarde du profil ──
    const handleSave = () => {
        const profileChanged =
            firstName.trim() !== (user?.firstName ?? '') ||
            lastName.trim()  !== (user?.lastName  ?? '');

        const emailChanged = email.trim() !== user?.email;

        // Mise à jour profil (prénom/nom)
        if (profileChanged) {
            updateProfile.mutate(
                { firstName: firstName.trim(), lastName: lastName.trim() },
                {
                    onSuccess: () => {
                        if (!emailChanged) {
                            setSaved(true);
                            setTimeout(() => setSaved(false), 2500);
                        }
                    },
                },
            );
        }

        // Changement email séparé
        if (emailChanged) {
            changeEmail.mutate(
                email.trim(),
                {
                    onSuccess: () => {
                        setSaved(true);
                        setTimeout(() => setSaved(false), 2500);
                    },
                },
            );
        }

        // Rien n'a changé
        if (!profileChanged && !emailChanged) {
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        }
    };

    // ── Upload avatar ──
    const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setAvatarUploading(true);
        setAvatarProgress(0);

        uploadAvatar.mutate(
            {
                file,
                onUploadProgress: (percent) => setAvatarProgress(percent),
            },
            {
                onSettled: () => {
                    setAvatarUploading(false);
                    setAvatarProgress(0);
                    // Réinitialise l'input pour permettre un re-upload du même fichier
                    if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                    }
                },
            },
        );
    };

    // Initiale pour l'avatar (fallback si pas d'image)
    const initial = user?.firstName?.charAt(0).toUpperCase()
        ?? user?.email?.charAt(0).toUpperCase()
        ?? '?';

    // L'avatar est stocké en base64 directement en DB — utilisable directement comme src
    const avatarUrl = user?.avatar ?? null;

    const isSaving = updateProfile.isPending || changeEmail.isPending;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

            {/* ── Avatar + bouton ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>

                {/* Avatar */}
                <div
                    style={{
                        width:          '72px',
                        height:         '72px',
                        borderRadius:   '50%',
                        background:     avatarUrl
                            ? 'transparent'
                            : 'linear-gradient(135deg,#005bbf,#1a73e8)',
                        display:        'flex',
                        alignItems:     'center',
                        justifyContent: 'center',
                        color:          'white',
                        fontSize:       '26px',
                        fontWeight:     700,
                        boxShadow:      '0 8px 24px rgba(0,91,191,.3)',
                        flexShrink:     0,
                        overflow:       'hidden',
                    }}
                >
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt="Avatar"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : initial}
                </div>

                {/* Bouton + aide */}
                <div>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={avatarUploading}
                        style={{
                            display:      'flex',
                            alignItems:   'center',
                            gap:          '6px',
                            background:   'linear-gradient(135deg,#005bbf,#1a73e8)',
                            border:       'none',
                            borderRadius: '9999px',
                            padding:      '8px 16px',
                            cursor:       avatarUploading ? 'not-allowed' : 'pointer',
                            opacity:      avatarUploading ? 0.65 : 1,
                            fontSize:     '13px',
                            fontWeight:   600,
                            color:        'white',
                            fontFamily:   'Inter, sans-serif',
                            boxShadow:    '0 4px 16px rgba(0,91,191,.28)',
                        }}
                    >
                        {avatarUploading
                            ? <MaterialIcon n="hourglass_empty" s={14} c="white" />
                            : <MaterialIcon n="photo_camera" s={14} c="white" />
                        }
                        {avatarUploading
                            ? `Upload… ${avatarProgress}%`
                            : 'Changer l\'avatar'
                        }
                    </button>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '5px' }}>
                        JPG, PNG · Max 2 Mo
                    </div>
                </div>

                {/* Input file caché */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleAvatarChange}
                    style={{ display: 'none' }}
                />
            </div>

            {/* ── Champ Prénom ── */}
            <div>
                <label className="sf-label" style={{ color: 'var(--muted)' }}>
                    Prénom
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
                        <MaterialIcon n="person" s={17} c="var(--muted)" />
                    </span>
                    <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Votre prénom"
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

            {/* ── Champ Nom ── */}
            <div>
                <label className="sf-label" style={{ color: 'var(--muted)' }}>
                    Nom
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
                        <MaterialIcon n="person" s={17} c="var(--muted)" />
                    </span>
                    <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Votre nom"
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

            {/* ── Champ Email ── */}
            <div>
                <label className="sf-label" style={{ color: 'var(--muted)' }}>
                    Adresse email
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
                        <MaterialIcon n="mail" s={17} c="var(--muted)" />
                    </span>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="votre@email.com"
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

            {/* ── Quota ── */}
            {user && (
                <div
                    style={{
                        padding:      '14px 16px',
                        background:   'var(--low)',
                        borderRadius: '12px',
                    }}
                >
                    <div
                        style={{
                            display:        'flex',
                            justifyContent: 'space-between',
                            alignItems:     'center',
                            marginBottom:   '8px',
                        }}
                    >
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                            Stockage utilisé
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                            {fmtSize(user.quotaUsed)} / {fmtSize(user.quotaLimit)}
                        </span>
                    </div>
                    <div
                        style={{
                            height:       '6px',
                            background:   'var(--mid)',
                            borderRadius: '9999px',
                            overflow:     'hidden',
                        }}
                    >
                        <div
                            className="progress"
                            style={{
                                width: `${Math.min(
                                    (user.quotaUsed / user.quotaLimit) * 100,
                                    100,
                                )}%`,
                            }}
                        />
                    </div>
                </div>
            )}

            {/* ── Bouton Enregistrer ── */}
            <button
                onClick={handleSave}
                disabled={isSaving}
                style={{
                    alignSelf:    'flex-start',
                    display:      'flex',
                    alignItems:   'center',
                    gap:          '6px',
                    background:   'linear-gradient(135deg,#005bbf,#1a73e8)',
                    border:       'none',
                    borderRadius: '9999px',
                    padding:      '10px 22px',
                    cursor:       isSaving ? 'not-allowed' : 'pointer',
                    opacity:      isSaving ? 0.65 : 1,
                    fontSize:     '14px',
                    fontWeight:   600,
                    color:        'white',
                    fontFamily:   'Inter, sans-serif',
                    boxShadow:    '0 4px 16px rgba(0,91,191,.28)',
                    transition:   'all .2s',
                }}
            >
                {isSaving ? (
                    <MaterialIcon n="hourglass_empty" s={15} c="white" />
                ) : saved ? (
                    <MaterialIcon n="check" s={15} c="white" />
                ) : null}
                {isSaving ? 'Enregistrement…' : saved ? 'Sauvegardé !' : 'Enregistrer'}
            </button>
        </div>
    );
};

// Onglet Sécurité
const SecurityTab = (): ReactElement => {
    const changePassword = useChangePassword();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword,     setNewPassword]     = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error,           setError]           = useState('');
    const [saved,           setSaved]           = useState(false);

    const handleSubmit = () => {
        setError('');

        if (!currentPassword.trim()) {
            setError('Le mot de passe actuel est requis.');
            return;
        }
        if (newPassword.length < 8) {
            setError('Le nouveau mot de passe doit contenir au moins 8 caractères.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }

        changePassword.mutate(
            { currentPassword: currentPassword.trim(), newPassword },
            {
                onSuccess: () => {
                    setSaved(true);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setTimeout(() => setSaved(false), 2500);
                },
                onError: () => {
                    setError('Mot de passe actuel incorrect.');
                },
            },
        );
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* ── Titre section ── */}
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>
                Changer le mot de passe
            </div>

            {/* ── Champ mot de passe actuel ── */}
            <PasswordField
                label="Mot de passe actuel"
                value={currentPassword}
                onChange={setCurrentPassword}
                placeholder="Saisir votre mot de passe actuel"
            />

            {/* ── Champ nouveau mot de passe ── */}
            <PasswordField
                label="Nouveau mot de passe"
                value={newPassword}
                onChange={setNewPassword}
                placeholder="8 caractères minimum"
            />

            {/* ── Champ confirmation ── */}
            <PasswordField
                label="Confirmer le nouveau mot de passe"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Confirmer le nouveau mot de passe"
            />

            {/* ── Erreur ── */}
            {error && (
                <div
                    style={{
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

            {/* ── Bouton mettre à jour ── */}
            <button
                onClick={handleSubmit}
                disabled={changePassword.isPending}
                style={{
                    alignSelf:    'flex-start',
                    display:      'flex',
                    alignItems:   'center',
                    gap:          '6px',
                    background:   'linear-gradient(135deg,#005bbf,#1a73e8)',
                    border:       'none',
                    borderRadius: '9999px',
                    padding:      '10px 22px',
                    cursor:       changePassword.isPending ? 'not-allowed' : 'pointer',
                    opacity:      changePassword.isPending ? 0.65 : 1,
                    fontSize:     '14px',
                    fontWeight:   600,
                    color:        'white',
                    fontFamily:   'Inter, sans-serif',
                    boxShadow:    '0 4px 16px rgba(0,91,191,.28)',
                    transition:   'all .2s',
                }}
            >
                {changePassword.isPending ? (
                    <MaterialIcon n="hourglass_empty" s={15} c="white" />
                ) : saved ? (
                    <MaterialIcon n="check" s={15} c="white" />
                ) : null}
                {changePassword.isPending
                    ? 'Mise à jour…'
                    : saved
                        ? 'Mis à jour !'
                        : 'Mettre à jour le mot de passe'
                }
            </button>
        </div>
    );
};

// Sous-composant — Champ mot de passe avec toggle visibilité
interface PasswordFieldProps {
    label:       string;
    value:       string;
    onChange:    (v: string) => void;
    placeholder: string;
}

const PasswordField = ({
    label,
    value,
    onChange,
    placeholder,
}: PasswordFieldProps): ReactElement => {
    const [visible, setVisible] = useState(false);

    return (
        <div>
            <label className="sf-label" style={{ color: 'var(--muted)' }}>
                {label}
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
                    type={visible ? 'text' : 'password'}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="sf-input"
                    style={{
                        width:        '100%',
                        paddingLeft:  '40px',
                        paddingRight: '42px',
                        background:   'var(--low)',
                        color:        'var(--text)',
                        border:       'none',
                    }}
                />
                <button
                    type="button"
                    onClick={() => setVisible((v) => !v)}
                    style={{
                        position:   'absolute',
                        right:      '12px',
                        top:        '50%',
                        transform:  'translateY(-50%)',
                        background: 'none',
                        border:     'none',
                        cursor:     'pointer',
                        display:    'flex',
                        padding:    '2px',
                        color:      'var(--muted)',
                    }}
                >
                    <MaterialIcon
                        n={visible ? 'visibility_off' : 'visibility'}
                        s={18}
                        c="var(--muted)"
                    />
                </button>
            </div>
        </div>
    );
};

// Onglet Préférences
const PreferencesTab = (): ReactElement => {
    const user          = useAuthStore((s) => s.user);
    const setUser       = useAuthStore((s) => s.setUser);
    const updateProfile = useUpdateProfile();

    // Thème : lit depuis le store, fallback sur 'light'
    const currentTheme = (user?.theme ?? 'light') as 'light' | 'dark';
    const isDark       = currentTheme === 'dark';

    const handleThemeToggle = () => {
        const newTheme = isDark ? 'light' : 'dark';

        // Mise à jour immédiate du store ET du DOM (pas d'attente de la réponse API)
        if (user) setUser({ ...user, theme: newTheme });
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('sf_theme', newTheme);

        updateProfile.mutate({ theme: newTheme });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div
                style={{
                    display:        'flex',
                    justifyContent: 'space-between',
                    alignItems:     'center',
                    padding:        '15px 0',
                }}
            >
                {/* Gauche */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <MaterialIcon
                        n={isDark ? 'dark_mode' : 'light_mode'}
                        s={21}
                        c="#005bbf"
                    />
                    <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
                            {isDark ? 'Thème Sombre' : 'Thème Clair'}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                            Basculer clair / sombre
                        </div>
                    </div>
                </div>

                {/* Toggle */}
                <div
                    className="toggle"
                    onClick={handleThemeToggle}
                    style={{
                        background: isDark ? '#005bbf' : 'var(--mid)',
                        cursor:     'pointer',
                    }}
                >
                    <div
                        className="toggle-knob"
                        style={{ left: isDark ? '23px' : '3px' }}
                    />
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;