// Composant atomique — icône Material Symbols Outlined

import type { ReactElement } from 'react';

interface MaterialIconProps {
    /** Nom de l'icône Material Symbols (ex: "folder", "upload_file") */
    n: string;
    /** Taille en px (défaut : 22) */
    s?: number;
    /** Couleur CSS (ex: "#005bbf", "var(--muted)") */
    c?: string;
    /** Icône remplie (FILL=1) ou contour (FILL=0, défaut) */
    fill?: boolean;
    /** Classe CSS additionnelle */
    className?: string;
}

/**
 * Icône Material Symbols Outlined.
 * Utilise la police Google Fonts déjà chargée dans index.css.
 */
export const MaterialIcon = ({
    n,
    s = 22,
    c,
    fill = false,
    className,
}: MaterialIconProps): ReactElement => (
    <span
        className={className}
        style={{
            fontFamily:            "'Material Symbols Outlined'",
            fontStyle:             'normal',
            fontWeight:            'normal',
            fontSize:              `${s}px`,
            lineHeight:            1,
            display:               'inline-block',
            userSelect:            'none',
            color:                 c,
            fontVariationSettings: fill
                ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24"
                : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
        }}
    >
        {n}
    </span>
);