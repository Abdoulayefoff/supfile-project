import { useState, type ReactElement } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useResetPassword } from '@/hooks/useAuth';

export const ResetPasswordPage = (): ReactElement => {
    const navigate                    = useNavigate();
    // useSearchParams permet de lire le token dans l'URL : /reset-password?token=abc123
    const [searchParams]              = useSearchParams();
    const token                       = searchParams.get('token') ?? '';

    const [password, setPassword]     = useState('');
    const [confirm, setConfirm]       = useState('');
    const [showPassword, setShow]     = useState(false);
    // localError : erreurs de validation côté frontend (mots de passe différents, trop court)
    const [localError, setLocalError] = useState<string | null>(null);
    // success : true après réinitialisation réussie → affiche l'écran de confirmation
    const [success, setSuccess]       = useState(false);

    const { mutate, isPending, error } = useResetPassword();

    // Extraire le message d'erreur retourné par l'API (token invalide, expiré, etc.)
    const apiErrorMessage = error
        ? ((error as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Une erreur est survenue.')
        : null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);

        // Validation côté frontend — double sécurité avec le backend
        if (password.length < 8) {
            setLocalError('Le mot de passe doit contenir au moins 8 caractères.');
            return;
        }
        if (password !== confirm) {
            setLocalError('Les mots de passe ne correspondent pas.');
            return;
        }

        // Envoi au backend avec le token extrait de l'URL et le nouveau mot de passe
        mutate({ token, password }, {
            onSuccess: () => setSuccess(true),
        });
    };

    // ── Cas : token absent de l'URL (lien malformé ou accès direct à la page)
    if (!token) {
        return (
            <div style={{
                minHeight:      '100vh',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                background:     'linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 100%)',
                padding:        '24px',
            }}>
                <div style={{
                    background:    '#ffffff',
                    borderRadius:  '32px',
                    boxShadow:     '0 12px 40px rgba(0,91,191,.10)',
                    padding:       '44px 40px',
                    maxWidth:      '420px',
                    width:         '100%',
                    textAlign:     'center',
                    display:       'flex',
                    flexDirection: 'column',
                    gap:           '16px',
                }}>
                    {/* Icône d'erreur */}
                    <div style={{
                        width:          '52px',
                        height:         '52px',
                        borderRadius:   '50%',
                        background:     'rgba(186,26,26,.10)',
                        display:        'flex',
                        alignItems:     'center',
                        justifyContent: 'center',
                        margin:         '0 auto',
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '26px', color: '#ba1a1a', fontVariationSettings: "'FILL' 1" }}>
                            error
                        </span>
                    </div>
                    <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#191c1d', margin: 0 }}>
                        Lien invalide
                    </h2>
                    <p style={{ fontSize: '14px', color: '#414754', lineHeight: 1.6, margin: 0 }}>
                        Ce lien de réinitialisation est invalide ou incomplet.
                        Veuillez faire une nouvelle demande.
                    </p>
                    <button
                        onClick={() => navigate('/auth')}
                        style={{
                            width:        '100%',
                            padding:      '12px',
                            borderRadius: '9999px',
                            background:   'linear-gradient(135deg, #005bbf, #1a73e8)',
                            color:        'white',
                            border:       'none',
                            cursor:       'pointer',
                            fontSize:     '14px',
                            fontWeight:   700,
                            fontFamily:   'Inter, sans-serif',
                            boxShadow:    '0 4px 14px rgba(0,91,191,.28)',
                        }}
                    >
                        Retour à la connexion
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight:      '100vh',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            background:     'linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 100%)',
            padding:        '24px',
        }}>
            {/* Logo SUPFile en haut de page */}
            <div style={{ position: 'absolute', top: '32px', left: '40px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                    width:          '36px',
                    height:         '36px',
                    borderRadius:   '10px',
                    background:     'linear-gradient(135deg, #005bbf, #1a73e8)',
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    fontSize:       '18px',
                }}>
                    ☁️
                </div>
                <span style={{ fontSize: '20px', fontWeight: 900, color: '#191c1d', letterSpacing: '-0.03em' }}>
                    SUPFile
                </span>
            </div>

            {/* Carte centrale */}
            <div style={{
                background:    '#ffffff',
                borderRadius:  '32px',
                width:         '100%',
                maxWidth:      '420px',
                boxShadow:     '0 12px 40px rgba(0,91,191,.10)',
                padding:       '44px 40px',
                zIndex:        10,
                display:       'flex',
                flexDirection: 'column',
                gap:           '24px',
            }}>
                {!success ? (
                    <>
                        {/* En-tête de la carte */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{
                                width:          '52px',
                                height:         '52px',
                                borderRadius:   '14px',
                                background:     'rgba(0,91,191,.10)',
                                display:        'flex',
                                alignItems:     'center',
                                justifyContent: 'center',
                                marginBottom:   '4px',
                            }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '26px', color: '#005bbf', fontVariationSettings: "'FILL' 1" }}>
                                    lock_reset
                                </span>
                            </div>
                            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#191c1d', margin: 0 }}>
                                Nouveau mot de passe
                            </h1>
                            <p style={{ fontSize: '14px', color: '#414754', margin: 0, lineHeight: 1.6 }}>
                                Choisissez un mot de passe sécurisé d'au moins 8 caractères.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                            {/* Champ nouveau mot de passe */}
                            <div>
                                <label className="sf-label" htmlFor="new-password" style={{ color: '#414754' }}>
                                    Nouveau mot de passe
                                </label>
                                <div style={{ position: 'relative', marginTop: '6px' }}>
                                    <span className="material-symbols-outlined" style={{
                                        position:      'absolute',
                                        left:          '12px',
                                        top:           '50%',
                                        transform:     'translateY(-50%)',
                                        fontSize:      '17px',
                                        color:         '#9aa0ae',
                                        pointerEvents: 'none',
                                    }}>
                                        lock
                                    </span>
                                    <input
                                        id="new-password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="sf-input"
                                        style={{ paddingLeft: '38px', paddingRight: '42px', width: '100%', boxSizing: 'border-box' }}
                                        autoFocus
                                    />
                                    {/* Bouton afficher/masquer le mot de passe */}
                                    <button
                                        type="button"
                                        onClick={() => setShow(!showPassword)}
                                        style={{
                                            position:   'absolute',
                                            right:      '10px',
                                            top:        '50%',
                                            transform:  'translateY(-50%)',
                                            background: 'none',
                                            border:     'none',
                                            cursor:     'pointer',
                                            padding:    '2px',
                                            display:    'flex',
                                        }}
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#9aa0ae' }}>
                                            {showPassword ? 'visibility_off' : 'visibility'}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* Champ confirmation du mot de passe */}
                            <div>
                                <label className="sf-label" htmlFor="confirm-password" style={{ color: '#414754' }}>
                                    Confirmer le mot de passe
                                </label>
                                <div style={{ position: 'relative', marginTop: '6px' }}>
                                    <span className="material-symbols-outlined" style={{
                                        position:      'absolute',
                                        left:          '12px',
                                        top:           '50%',
                                        transform:     'translateY(-50%)',
                                        fontSize:      '17px',
                                        color:         '#9aa0ae',
                                        pointerEvents: 'none',
                                    }}>
                                        lock_open
                                    </span>
                                    <input
                                        id="confirm-password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirm}
                                        onChange={(e) => setConfirm(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="sf-input"
                                        style={{ paddingLeft: '38px', width: '100%', boxSizing: 'border-box' }}
                                    />
                                </div>
                            </div>

                            {/* Affichage des erreurs — frontend ou API */}
                            {(localError ?? apiErrorMessage) && (
                                <div style={{
                                    padding:    '10px 14px',
                                    borderRadius: '10px',
                                    background: 'rgba(186,26,26,.08)',
                                    border:     '1px solid rgba(186,26,26,.2)',
                                    fontSize:   '13px',
                                    color:      '#ba1a1a',
                                }}>
                                    {localError ?? apiErrorMessage}
                                </div>
                            )}

                            {/* Bouton de soumission */}
                            <button
                                type="submit"
                                disabled={isPending}
                                style={{
                                    width:        '100%',
                                    padding:      '13px',
                                    borderRadius: '9999px',
                                    background:   isPending ? '#c8d8f0' : 'linear-gradient(135deg, #005bbf, #1a73e8)',
                                    color:        'white',
                                    border:       'none',
                                    cursor:       isPending ? 'not-allowed' : 'pointer',
                                    fontSize:     '14px',
                                    fontWeight:   700,
                                    fontFamily:   'Inter, sans-serif',
                                    boxShadow:    isPending ? 'none' : '0 4px 14px rgba(0,91,191,.28)',
                                    transition:   'all .2s',
                                    marginTop:    '4px',
                                }}
                            >
                                {isPending ? 'Réinitialisation…' : 'Confirmer le nouveau mot de passe'}
                            </button>
                        </form>

                        {/* Lien retour connexion */}
                        <button
                            type="button"
                            onClick={() => navigate('/auth')}
                            style={{
                                background: 'none',
                                border:     'none',
                                cursor:     'pointer',
                                fontSize:   '13px',
                                color:      '#9aa0ae',
                                fontFamily: 'Inter, sans-serif',
                                padding:    0,
                                alignSelf:  'center',
                            }}
                        >
                            ← Retour à la connexion
                        </button>
                    </>
                ) : (
                    /* ── Écran de succès après réinitialisation ── */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', textAlign: 'center' }}>
                        {/* Icône de succès */}
                        <div style={{
                            width:          '64px',
                            height:         '64px',
                            borderRadius:   '50%',
                            background:     'rgba(52,168,83,.12)',
                            display:        'flex',
                            alignItems:     'center',
                            justifyContent: 'center',
                        }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '34px', color: '#34a853', fontVariationSettings: "'FILL' 1" }}>
                                check_circle
                            </span>
                        </div>
                        <div>
                            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#191c1d', margin: '0 0 10px' }}>
                                Mot de passe modifié !
                            </h2>
                            <p style={{ fontSize: '14px', color: '#414754', lineHeight: 1.65, margin: 0 }}>
                                Votre mot de passe a été réinitialisé avec succès.<br />
                                Vous pouvez maintenant vous connecter.
                            </p>
                        </div>
                        {/* Bouton redirection vers la page de connexion */}
                        <button
                            onClick={() => navigate('/auth')}
                            style={{
                                width:        '100%',
                                padding:      '13px',
                                borderRadius: '9999px',
                                background:   'linear-gradient(135deg, #005bbf, #1a73e8)',
                                color:        'white',
                                border:       'none',
                                cursor:       'pointer',
                                fontSize:     '14px',
                                fontWeight:   700,
                                fontFamily:   'Inter, sans-serif',
                                boxShadow:    '0 4px 14px rgba(0,91,191,.28)',
                            }}
                        >
                            Se connecter
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};