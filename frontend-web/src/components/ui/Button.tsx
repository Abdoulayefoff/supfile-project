import type { CSSProperties, ReactNode, ReactElement } from 'react';

interface ButtonProps {
    // Contenu du bouton
    children: ReactNode;

    // Type HTML du bouton (submit pour les formulaires, button pour les actions)
    type?: 'button' | 'submit' | 'reset';

    // Variante visuelle du bouton
    variant?: 'primary' | 'ghost';

    // Largeur complète du conteneur parent
    fullWidth?: boolean;

    // État de chargement — affiche une icône hourglass et désactive le bouton
    loading?: boolean;

    // Désactivation manuelle
    disabled?: boolean;

    // Styles supplémentaires
    style?: CSSProperties;

    // Handler de clic
    onClick?: () => void;
}

export const Button = ({
    children,
    type = 'button',
    variant = 'primary',
    fullWidth = false,
    loading = false,
    disabled = false,
    style,
    onClick,
}: ButtonProps): ReactElement => {

    // ── Styles de base communs aux deux variantes ──
    const baseStyle: CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '12px 24px',
        borderRadius: '9999px',
        fontSize: '14px',
        fontWeight: 700,
        fontFamily: 'Inter, sans-serif',
        cursor: loading || disabled ? 'not-allowed' : 'pointer',
        opacity: loading || disabled ? 0.7 : 1,
        transition: 'all .2s',
        border: 'none',
        width: fullWidth ? '100%' : undefined,
        ...style,
    };

    // ── Styles spécifiques à la variante "primary" ──
    const primaryStyle: CSSProperties = {
        background: 'linear-gradient(135deg, #005bbf, #1a73e8)',
        color: 'white',
        boxShadow: '0 4px 14px rgba(0,91,191,.25)',
    };

    // ── Styles spécifiques à la variante "ghost" ──
    const ghostStyle: CSSProperties = {
        background: 'none',
        color: 'var(--muted)',
        border: '1px solid var(--border)',
    };

    const variantStyle = variant === 'primary' ? primaryStyle : ghostStyle;

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={loading || disabled}
            style={{ ...baseStyle, ...variantStyle }}
        >
            {/* Icône de chargement */}
            {loading && (
                <span
                    className="material-symbols-outlined"
                    style={{ fontSize: '16px', color: 'white' }}
                >
                    hourglass_empty
                </span>
            )}

            {/* Contenu du bouton */}
            {children}
        </button>
    );
};