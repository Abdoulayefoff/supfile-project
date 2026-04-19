import { useState, type ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate }  from 'react-router-dom';
import { useRegister }  from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { OAuthButtons } from '@/components/ui/OAuthButtons';

// ── Schéma de validation Zod 
// Validation du format uniquement — la logique métier reste côté API
const registerSchema = z.object({
    firstName: z.string().min(1, 'Prénom requis'),
    lastName: z.string().min(1, 'Nom requis'),
    email: z.string().email('Email invalide'),
    password: z.string().min(8, 'Minimum 8 caractères'),
    confirmPassword: z.string().min(1, 'Confirmation requise'),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterFormProps {
    onSwitchMode: () => void;
}

export const RegisterForm = ({ onSwitchMode }: RegisterFormProps): ReactElement => {
    const navigate          = useNavigate();
    const registerMutation  = useRegister();

    // État local pour afficher/masquer les mots de passe
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Erreur retournée par l'API (ex: "Email déjà utilisé")
    const [apiError, setApiError] = useState<string | null>(null);

    // ── React Hook Form ──
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    // ── Soumission du formulaire
    // Envoie les données d'inscription — le hook stocke le token JWT si succès
    const onSubmit = async (data: RegisterFormData) => {
        setApiError(null);
        try {
            await registerMutation.mutateAsync({
                email:     data.email,
                password:  data.password,
                firstName: data.firstName,
                lastName:  data.lastName,
            });
            navigate('/dashboard');
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            setApiError(err.response?.data?.message ?? 'Une erreur est survenue');
        }
    };

    // ── Styles partagés ──
    const inputContainerStyle: React.CSSProperties = {
        position: 'relative',
    };

    const iconStyle: React.CSSProperties = {
        position: 'absolute',
        left: '14px',
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: '18px',
        color: '#9aa0ae',
        pointerEvents: 'none',
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '11px 14px 11px 42px',
        borderRadius: '12px',
        border: 'none',
        background: '#f3f4f5',
        fontSize: '14px',
        color: '#191c1d',
        fontFamily: 'Inter, sans-serif',
    };

    const errorStyle: React.CSSProperties = {
        fontSize: '12px',
        color: '#ba1a1a',
        marginTop: '4px',
        display: 'block',
    };

    return (
        <>
            {/* ── Titre et sous-titre ── */}
            <div>
                <h1 style={{
                    fontSize: '32px',
                    fontWeight: 800,
                    letterSpacing: '-0.025em',
                    color: '#191c1d',
                    marginBottom: '6px',
                }}>
                    Créez votre compte
                </h1>
                <p style={{ fontSize: '14px', color: '#414754' }}>
                    Rejoignez Supfile et gérez vos fichiers facilement
                </p>
            </div>

            {/* ── Boutons OAuth (Google, GitHub, Microsoft) ── */}
            <OAuthButtons />

            {/* ── Séparateur "ou via email" ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(193,198,214,.4)' }} />
                <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '.14em',
                    color: '#727785',
                }}>
                    ou via email
                </span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(193,198,214,.4)' }} />
            </div>

            {/* ── Formulaire d'inscription ── */}
            <form
                onSubmit={handleSubmit(onSubmit)}
                style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
            >
                {/* ── Prénom + Nom sur la même ligne ── */}
                <div style={{ display: 'flex', gap: '10px' }}>

                    {/* Champ Prénom */}
                    <div style={{ flex: 1 }}>
                        <label className="sf-label" style={{ color: '#414754' }}>Prénom</label>
                        <div style={inputContainerStyle}>
                            <span className="material-symbols-outlined" style={iconStyle}>person</span>
                            <input
                                {...register('firstName')}
                                type="text"
                                placeholder="Jean"
                                className="sf-input"
                                style={inputStyle}
                                autoComplete="given-name"
                            />
                        </div>
                        {errors.firstName && (
                            <span style={errorStyle}>{errors.firstName.message}</span>
                        )}
                    </div>

                    {/* Champ Nom */}
                    <div style={{ flex: 1 }}>
                        <label className="sf-label" style={{ color: '#414754' }}>Nom</label>
                        <div style={inputContainerStyle}>
                            <span className="material-symbols-outlined" style={iconStyle}>person</span>
                            <input
                                {...register('lastName')}
                                type="text"
                                placeholder="Dupont"
                                className="sf-input"
                                style={inputStyle}
                                autoComplete="family-name"
                            />
                        </div>
                        {errors.lastName && (
                            <span style={errorStyle}>{errors.lastName.message}</span>
                        )}
                    </div>
                </div>

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
                        <span style={errorStyle}>{errors.email.message}</span>
                    )}
                </div>

                {/* ── Mot de passe + Confirmation sur la même ligne ── */}
                <div style={{ display: 'flex', gap: '10px' }}>

                    {/* Champ Mot de passe */}
                    <div style={{ flex: 1 }}>
                        <label className="sf-label" style={{ color: '#414754' }}>Mot de passe</label>
                        <div style={inputContainerStyle}>
                            <span className="material-symbols-outlined" style={iconStyle}>lock</span>
                            <input
                                {...register('password')}
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Min. 8 caractères"
                                className="sf-input"
                                style={{ ...inputStyle, paddingRight: '42px' }}
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '14px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#727785',
                                    padding: 0,
                                }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                                    {showPassword ? 'visibility_off' : 'visibility'}
                                </span>
                            </button>
                        </div>
                        {errors.password && (
                            <span style={errorStyle}>{errors.password.message}</span>
                        )}
                    </div>

                    {/* Champ Confirmation */}
                    <div style={{ flex: 1 }}>
                        <label className="sf-label" style={{ color: '#414754' }}>Confirmation</label>
                        <div style={inputContainerStyle}>
                            <span className="material-symbols-outlined" style={iconStyle}>lock</span>
                            <input
                                {...register('confirmPassword')}
                                type={showConfirm ? 'text' : 'password'}
                                placeholder="••••••••"
                                className="sf-input"
                                style={{ ...inputStyle, paddingRight: '42px' }}
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                                style={{
                                    position: 'absolute',
                                    right: '14px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#727785',
                                    padding: 0,
                                }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                                    {showConfirm ? 'visibility_off' : 'visibility'}
                                </span>
                            </button>
                        </div>
                        {errors.confirmPassword && (
                            <span style={errorStyle}>{errors.confirmPassword.message}</span>
                        )}
                    </div>
                </div>

                {/* Message d'erreur API */}
                {apiError && (
                    <div style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: 'rgba(186,26,26,.08)',
                        border: '1px solid rgba(186,26,26,.2)',
                        fontSize: '13px',
                        color: '#ba1a1a',
                    }}>
                        {apiError}
                    </div>
                )}

                {/* Bouton de soumission */}
                <Button type="submit" fullWidth loading={isSubmitting} style={{ marginTop: '4px' }}>
                    {!isSubmitting && (
                        <>
                            Créer mon compte
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                                arrow_forward
                            </span>
                        </>
                    )}
                </Button>
            </form>

            {/* ── Lien switch vers Login ── */}
            <p style={{ textAlign: 'center', fontSize: '14px', color: '#414754' }}>
                Déjà un compte ?{' '}
                <button
                    type="button"
                    onClick={onSwitchMode}
                    style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: '#005bbf',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                    }}
                >
                    Se connecter
                </button>
            </p>
        </>
    );
};