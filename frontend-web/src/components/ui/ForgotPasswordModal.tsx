import { useState, type ReactElement } from 'react';
import { useForgotPassword } from '@/hooks/useAuth';

interface ForgotPasswordModalProps {
    onClose: () => void;
}

export const ForgotPasswordModal = ({ onClose }: ForgotPasswordModalProps): ReactElement => {
    const [email, setEmail]         = useState('');
    // submitted passe à true après l'envoi pour afficher l'écran de confirmation
    const [submitted, setSubmitted] = useState(false);
    const { mutate, isPending }     = useForgotPassword();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        mutate(email.trim(), {
            // On passe toujours à l'écran de confirmation, que l'email existe ou non.
            // C'est voulu : on ne révèle pas si l'email est connu (anti-énumération).
            onSuccess: () => setSubmitted(true),
        });
    };

    return (
        // Overlay sombre — clic en dehors du modal pour fermer
        <div
            onClick={onClose}
            style={{
                position:       'fixed',
                inset:          0,
                zIndex:         300,
                background:     'rgba(0,0,0,.50)',
                backdropFilter: 'blur(6px)',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                padding:        '24px',
            }}
        >
            {/* Conteneur du modal — stopPropagation pour éviter la fermeture au clic intérieur */}
            <div
                onClick={(e) => e.stopPropagation()}
                className="fade"
                style={{
                    background:    '#ffffff',
                    borderRadius:  '22px',
                    width:         '100%',
                    maxWidth:      '420px',
                    padding:       '36px 32px',
                    boxShadow:     '0 24px 80px rgba(0,0,0,.18)',
                    border:        '1px solid rgba(193,198,214,.3)',
                    display:       'flex',
                    flexDirection: 'column',
                    gap:           '20px',
                }}
            >
                {/* Icône cadenas */}
                <div style={{
                    width:          '52px',
                    height:         '52px',
                    borderRadius:   '14px',
                    background:     'rgba(0,91,191,.10)',
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                }}>
                    <span
                        className="material-symbols-outlined"
                        style={{ fontSize: '26px', color: '#005bbf', fontVariationSettings: "'FILL' 1" }}
                    >
                        lock_reset
                    </span>
                </div>

                {/* ── Formulaire (affiché avant envoi) ── */}
                {!submitted ? (
                    <>
                        <div>
                            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#191c1d', margin: '0 0 8px' }}>
                                Mot de passe oublié ?
                            </h2>
                            <p style={{ fontSize: '14px', color: '#414754', lineHeight: 1.6, margin: 0 }}>
                                Entrez l'adresse email associée à votre compte.
                                Vous recevrez un lien pour créer un nouveau mot de passe.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <label
                                    className="sf-label"
                                    htmlFor="forgot-email"
                                    style={{ color: '#414754' }}
                                >
                                    Adresse email
                                </label>
                                <div style={{ position: 'relative', marginTop: '6px' }}>
                                    {/* Icône email dans le champ */}
                                    <span
                                        className="material-symbols-outlined"
                                        style={{
                                            position:      'absolute',
                                            left:          '12px',
                                            top:           '50%',
                                            transform:     'translateY(-50%)',
                                            fontSize:      '17px',
                                            color:         '#9aa0ae',
                                            pointerEvents: 'none',
                                        }}
                                    >
                                        mail
                                    </span>
                                    <input
                                        id="forgot-email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="votre@email.com"
                                        required
                                        className="sf-input"
                                        style={{ paddingLeft: '38px', width: '100%', boxSizing: 'border-box' }}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {/* Bouton d'envoi — désactivé si champ vide ou requête en cours */}
                            <button
                                type="submit"
                                disabled={isPending || !email.trim()}
                                style={{
                                    width:        '100%',
                                    padding:      '12px',
                                    borderRadius: '9999px',
                                    background:   isPending || !email.trim()
                                        ? '#c8d8f0'
                                        : 'linear-gradient(135deg, #005bbf, #1a73e8)',
                                    color:        'white',
                                    border:       'none',
                                    cursor:       isPending || !email.trim() ? 'not-allowed' : 'pointer',
                                    fontSize:     '14px',
                                    fontWeight:   700,
                                    fontFamily:   'Inter, sans-serif',
                                    boxShadow:    isPending || !email.trim() ? 'none' : '0 4px 14px rgba(0,91,191,.28)',
                                    transition:   'all .2s',
                                }}
                            >
                                {isPending ? 'Envoi en cours…' : 'Envoyer le lien'}
                            </button>
                        </form>

                        {/* Bouton retour pour fermer le modal */}
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                background:  'none',
                                border:      'none',
                                cursor:      'pointer',
                                fontSize:    '13px',
                                color:       '#9aa0ae',
                                fontFamily:  'Inter, sans-serif',
                                padding:     0,
                                alignSelf:   'center',
                            }}
                        >
                            ← Retour à la connexion
                        </button>
                    </>
                ) : (
                    /* ── Écran de confirmation (affiché après envoi) ── */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Icône de succès */}
                        <div style={{
                            width:          '52px',
                            height:         '52px',
                            borderRadius:   '50%',
                            background:     'rgba(52,168,83,.12)',
                            display:        'flex',
                            alignItems:     'center',
                            justifyContent: 'center',
                        }}>
                            <span
                                className="material-symbols-outlined"
                                style={{ fontSize: '28px', color: '#34a853', fontVariationSettings: "'FILL' 1" }}
                            >
                                mark_email_read
                            </span>
                        </div>

                        <div>
                            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#191c1d', margin: '0 0 8px' }}>
                                Email envoyé !
                            </h2>
                            {/* Message générique — ne révèle pas si l'email existe en base */}
                            <p style={{ fontSize: '14px', color: '#414754', lineHeight: 1.6, margin: 0 }}>
                                Si l'adresse <strong>{email}</strong> est associée à un compte,
                                vous recevrez un lien de réinitialisation dans quelques instants.
                                Pensez à vérifier vos spams.
                            </p>
                        </div>

                        {/* Bouton de fermeture du modal */}
                        <button
                            type="button"
                            onClick={onClose}
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
                )}
            </div>
        </div>
    );
};