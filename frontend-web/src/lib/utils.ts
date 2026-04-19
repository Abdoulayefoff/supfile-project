// Utilitaires partagés : formatage taille/date, mapping MIME → icône/couleur
// Utilisés par Dashboard, Drive, Preview, etc.

/**
 * Formate une taille en octets en Ko / Mo / Go lisible.
 * Exemples : 500 → "500 Ko" | 1_500_000 → "1.4 Mo" | 2_000_000_000 → "1.86 Go"
 */
export const fmtSize = (bytes: number | undefined | null): string => {
    if (bytes === undefined || bytes === null) return '–';
    if (bytes < 1_048_576)     return `${(bytes / 1_024).toFixed(0)} Ko`;
    if (bytes < 1_073_741_824) return `${(bytes / 1_048_576).toFixed(1)} Mo`;
    return `${(bytes / 1_073_741_824).toFixed(2)} Go`;
};

/**
 * Formate une date ISO en chaîne lisible courte (locale française).
 * Exemple : "2026-04-15T10:30:00" → "15 avr. 2026"
 */
export const fmtDate = (isoDate: string | undefined | null): string => {
    if (!isoDate) return '–';
    return new Date(isoDate).toLocaleDateString('fr-FR', {
        day:   '2-digit',
        month: 'short',
        year:  'numeric',
    });
};

// Mapping MIME → icône Material Symbols + couleur 

export interface MimeInfo {
    icon:  string;   // nom de l'icône Material Symbols Outlined
    color: string;   // couleur hexadécimale
}

/**
 * Retourne l'icône et la couleur correspondant à un type MIME.
 * Utilisé partout où un fichier est affiché (Drive, Dashboard, Preview…)
 */
export const getMimeInfo = (mimeType: string | undefined | null): MimeInfo => {
    if (!mimeType) return { icon: 'insert_drive_file', color: '#727785' };

    if (mimeType.startsWith('image/'))                          return { icon: 'image',          color: '#005bbf' };
    if (mimeType.startsWith('video/'))                          return { icon: 'videocam',        color: '#f97316' };
    if (mimeType.startsWith('audio/'))                          return { icon: 'music_note',      color: '#9e4300' };
    if (mimeType === 'application/pdf')                         return { icon: 'picture_as_pdf',  color: '#ba1a1a' };
    if (mimeType.includes('xlsx') || mimeType.includes('spreadsheet')) return { icon: 'grid_on', color: '#34a853' };
    if (mimeType.includes('pptx') || mimeType.includes('presentation')) return { icon: 'slideshow', color: '#f97316' };
    if (mimeType.startsWith('text/'))                           return { icon: 'description',     color: '#005bbf' };

    return { icon: 'insert_drive_file', color: '#727785' };
};