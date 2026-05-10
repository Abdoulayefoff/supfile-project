import { useState, type ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useLogin }    from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { OAuthButtons } from '@/components/ui/OAuthButtons';
import { ForgotPasswordModal } from '@/components/ui/ForgotPasswordModal';

// ── Schéma de validation Zod
// Validation du format uniquement — la logique métier reste côté API
const loginSchema = z.object({
    email: z.string().email('Email invalide'),
    password: z.string().min(1, 'Mot de passe requis'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
    onSwitchMode: () => void;
}

export const LoginForm = ({ onSwitchMode }: LoginFormProps): ReactElement => {
    const navigate      = useNavigate();
    const loginMutation = useLogin();

    // État local pour afficher/masquer le mot de passe
    const [showPassword, setShowPassword] = useState(false);

    // "Se souvenir de moi" — décoché = session only (sessionStorage)
    const [rememberMe, setRememberMe] = useState(true);

    // Erreur retournée par l'API (ex: "Identifiants incorrects")
    const [apiError, setApiError] = useState<string | null>(null);

    // Contrôle l'ouverture/fermeture du modal "Mot de passe oublié"
    const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

    // ── React Hook Form ──
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    // ── Soumission du formulaire
    // Envoie les identifiants à l'API — le hook stocke le token JWT si succès
    const onSubmit = async (data: LoginFormData) => {
        setApiError(null);
        try {
            await loginMutation.mutateAsync({ ...data, rememberMe });
            navigate('/dashboard');
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            setApiError(err.response?.data?.message ?? 'Identifiants incorrects');
        }
    };

    // ── Styles partagés ──
    const inputContainerStyle: React.CSSProperties = {
        position: 'relative',
    };

    const iconStyle: React.CSSProperties = {
        position:      'absolute',
        left:          '14px',
        top:           '50%',
        transform:     'translateY(-50%)',
        fontSize:      '18px',
        color:         '#9aa0ae',
        pointerEvents: 'none',
    };

    const inputStyle: React.CSSProperties = {
        width:       '100%',
        padding:     '11px 14px 11px 42px',
        borderRadius: '12px',
        border:      'none',
        background:  '#f3f4f5',
        fontSize:    '14px',
        color:       '#191c1d',
        fontFamily:  'Inter, sans-serif',
    };

    return (
        <>
            {/* ── Titre et sous-titre ── */}
            <div>
                <h1 style={{
                    fontSize:      '32px',
                    fontWeight:    800,
                    letterSpacing: '-0.025em',
                    color:         '#191c1d',
                    marginBottom:  '6px',
                }}>
                    Bienvenue
                </h1>
                <p style={{ fontSize: '14px', color: '#414754' }}>
                    Connectez-vous pour accéder à vos fichiers
                </p>
            </div>

            {/* ── Boutons OAuth (Google, GitHub, Microsoft) ── */}
            <OAuthButtons />

            {/* ── Séparateur "ou via email" ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(193,198,214,.4)' }} />
                <span style={{
                    fontSize:      '10px',
                    fontWeight:    700,
                    textTransform: 'uppercase',
                    letterSpacing: '.14em',
                    color:         '#727785',
                }}>
                    ou via email
                </span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(193,198,214,.4)' }} />
            </div>

            {/* ── Formulaire email/password ── */}
            <form
                onSubmit={handleSubmit(onSubmit)}
                style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
                {/* Champ Email */}
                <div>
                    <label className="sf-label" style={{ color: '#414754' }}>Email</label>
                    <div style={inputContainerStyle}>
                        <span className="material-symbols-outlined" style={iconStyle}>mail</span>
                        <input
                            {...register('email')}
                            type="email"
                            placeholder="vous@exemple.com"
                            className="sf-input"
                            style={inputStyle}
                            autoComplete="email"
                        />
                    </div>
                    {errors.email && (
                        <span style={{ fontSize: '12px', color: '#ba1a1a', marginTop: '4px', display: 'block' }}>
                            {errors.email.message}
                        </span>
                    )}
                </div>

                {/* Champ Mot de passe */}
                <div>
                    <label className="sf-label" style={{ color: '#414754' }}>Mot de passe</label>
                    <div style={inputContainerStyle}>
                        <span className="material-symbols-outlined" style={iconStyle}>lock</span>
                        <input
                            {...register('password')}
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            className="sf-input"
                            style={{ ...inputStyle, paddingRight: '42px' }}
                            autoComplete="current-password"
                        />
                        {/* Bouton œil pour afficher/masquer le mot de passe */}
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position:  'absolute',
                                right:     '14px',
                                top:       '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border:    'none',
                                cursor:    'pointer',
                                color:     '#727785',
                                padding:   0,
                            }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                                {showPassword ? 'visibility_off' : 'visibility'}
                            </span>
                        </button>
                    </div>
                    {errors.password && (
                        <span style={{ fontSize: '12px', color: '#ba1a1a', marginTop: '4px', display: 'block' }}>
                            {errors.password.message}
                        </span>
                    )}
                </div>

                {/* Ligne "Se souvenir / Mot de passe oublié" */}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 2px' }}>
                    <label style={{
                        display:    'flex',
                        alignItems: 'center',
                        gap:        '8px',
                        fontSize:   '13px',
                        fontWeight: 500,
                        color:      '#414754',
                        cursor:     'pointer',
                    }}>
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            style={{ width: '15px', height: '15px', accentColor: '#005bbf' }}
                        />
                        Se souvenir de moi
                    </label>

                    {/* Bouton "Mot de passe oublié" — ouvre le modal ForgotPasswordModal */}
                    <button
                        type="button"
                        onClick={() => setForgotPasswordOpen(true)}
                        style={{
                            fontSize:   '13px',
                            fontWeight: 700,
                            color:      '#005bbf',
                            background: 'none',
                            border:     'none',
                            cursor:     'pointer',
                            fontFamily: 'Inter, sans-serif',
                            padding:    0,
                        }}
                    >
                        Mot de passe oublié ?
                    </button>
                </div>

                {/* Message d'erreur API */}
                {apiError && (
                    <div style={{
                        padding:      '10px 14px',
                        borderRadius: '10px',
                        background:   'rgba(186,26,26,.08)',
                        border:       '1px solid rgba(186,26,26,.2)',
                        fontSize:     '13px',
                        color:        '#ba1a1a',
                    }}>
                        {apiError}
                    </div>
                )}

                {/* Bouton de soumission */}
                <Button type="submit" fullWidth loading={isSubmitting} style={{ marginTop: '4px' }}>
                    {!isSubmitting && (
                        <>
                            Se connecter
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                                arrow_forward
                            </span>
                        </>
                    )}
                </Button>
            </form>

            {/* ── Lien switch vers Register ── */}
            <p style={{ textAlign: 'center', fontSize: '14px', color: '#414754' }}>
                Pas encore de compte ?{' '}
                <button
                    type="button"
                    onClick={onSwitchMode}
                    style={{
                        fontSize:   '14px',
                        fontWeight: 700,
                        color:      '#005bbf',
                        background: 'none',
                        border:     'none',
                        cursor:     'pointer',
                    }}
                >
                    Créer un compte
                </button>
            </p>

            {/* Modal "Mot de passe oublié" — rendu conditionnellement */}
            {forgotPasswordOpen && (
                <ForgotPasswordModal onClose={() => setForgotPasswordOpen(false)} />
            )}
        </>
    );
};