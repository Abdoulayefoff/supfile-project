// Menu contextuel positionné au clic droit sur un fichier ou dossier.

import { useEffect, useRef }  from 'react';
import type { ReactElement }  from 'react';
import { MaterialIcon }       from '@/components/ui/MaterialIcon';

// Types

export interface ContextMenuItem {
    icon:     string;
    label:    string;
    color:    string;
    onClick:  () => void;
    /** Si true, affiche un séparateur au-dessus de cet item */
    separator?: boolean;
}

interface ContextMenuProps {
    x:       number;
    y:       number;
    items:   ContextMenuItem[];
    onClose: () => void;
}

// Composant

/**
 * Menu contextuel flottant positionné aux coordonnées (x, y) du clic.
 * Se ferme automatiquement au clic extérieur ou à l'appui sur Escape.
 */
export const ContextMenu = ({ x, y, items, onClose }: ContextMenuProps): ReactElement => {
    const menuRef = useRef<HTMLDivElement>(null);

    // ── Fermeture au clic extérieur ou Escape ──
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        // Délai minimal pour éviter que le clic d'ouverture ne déclenche la fermeture
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleClick);
            document.addEventListener('keydown', handleKey);
        }, 50);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClick);
            document.removeEventListener('keydown', handleKey);
        };
    }, [onClose]);

    // ── Ajustement si le menu dépasse le bord droit/bas de l'écran ──
    const menuWidth  = 180;
    const menuHeight = items.length * 40;
    const safeX = Math.min(x, window.innerWidth  - menuWidth  - 8);
    const safeY = Math.min(y, window.innerHeight - menuHeight - 8);

    return (
        <div
            ref={menuRef}
            className="fade"
            style={{
                position:     'fixed',
                left:         safeX,
                top:          safeY,
                zIndex:       300,
                background:   'var(--surface)',
                borderRadius: '11px',
                padding:      '5px',
                boxShadow:    '0 8px 32px rgba(0,0,0,.18)',
                border:       '1px solid var(--border)',
                minWidth:     `${menuWidth}px`,
            }}
        >
            {items.map((item) => (
                <div key={item.label}>
                    {/* Séparateur optionnel */}
                    {item.separator && (
                        <div
                            style={{
                                height:     '1px',
                                background: 'var(--border)',
                                margin:     '4px 0',
                            }}
                        />
                    )}

                    {/* Item */}
                    <div
                        className="ctx-item"
                        onClick={() => {
                            item.onClick();
                            onClose();
                        }}
                        style={{ color: item.color }}
                    >
                        <MaterialIcon n={item.icon} s={16} c={item.color} />
                        {item.label}
                    </div>
                </div>
            ))}
        </div>
    );
};