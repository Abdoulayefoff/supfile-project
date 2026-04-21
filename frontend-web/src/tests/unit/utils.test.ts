import { fmtSize, fmtDate, getMimeInfo } from '@/lib/utils';

// ─── fmtSize 

describe('fmtSize', () => {
    // Happy path
    it('formate 0 en Ko', () => {
        expect(fmtSize(0)).toBe('0 Ko');
    });

    it('formate des octets en Ko (< 1 Mo)', () => {
        expect(fmtSize(1024)).toBe('1 Ko');
    });

    it('formate des octets en Mo (entre 1 Mo et 1 Go)', () => {
        expect(fmtSize(1_048_576)).toBe('1.0 Mo');
    });

    it('formate des octets en Go (>= 1 Go)', () => {
        expect(fmtSize(1_073_741_824)).toBe('1.00 Go');
    });

    it('formate une taille de 500 Ko', () => {
        expect(fmtSize(512_000)).toBe('500 Ko');
    });

    it('formate 1.5 Mo correctement', () => {
        expect(fmtSize(1_572_864)).toBe('1.5 Mo');
    });

    it('formate 2 Go correctement', () => {
        expect(fmtSize(2_147_483_648)).toBe('2.00 Go');
    });

    // Cas limites — null / undefined
    it('retourne "–" pour undefined', () => {
        expect(fmtSize(undefined)).toBe('–');
    });

    it('retourne "–" pour null', () => {
        expect(fmtSize(null)).toBe('–');
    });

    // Valeur frontière Mo/Go (juste en dessous de 1 Go)
    it('reste en Mo pour une valeur juste sous 1 Go', () => {
        expect(fmtSize(1_073_741_823)).toMatch(/Mo$/);
    });
});

// ─── fmtDate 

describe('fmtDate', () => {
    // Happy path
    it('formate une date ISO valide en format français court', () => {
        const result = fmtDate('2026-04-15T10:30:00');
        // Le format exact dépend de la locale — vérifier les composants clés
        expect(result).toMatch(/2026/);
        expect(result).toMatch(/15/);
    });

    it('formate une date ISO sans heure', () => {
        const result = fmtDate('2026-01-01');
        expect(result).toMatch(/2026/);
    });

    it('formate une date en janvier', () => {
        const result = fmtDate('2024-01-20T00:00:00Z');
        expect(result).toMatch(/2024/);
        expect(result).toMatch(/20/);
    });

    // Cas limites — null / undefined / vide
    it('retourne "–" pour null', () => {
        expect(fmtDate(null)).toBe('–');
    });

    it('retourne "–" pour undefined', () => {
        expect(fmtDate(undefined)).toBe('–');
    });

    it('retourne "–" pour une chaîne vide', () => {
        expect(fmtDate('')).toBe('–');
    });

    // Validation — date invalide n'est pas plantée
    it('ne lève pas d\'exception pour une date invalide', () => {
        expect(() => fmtDate('not-a-date')).not.toThrow();
    });
});

// ─── getMimeInfo 

describe('getMimeInfo', () => {
    // Happy path — catégories connues
    it('retourne l\'icône image pour image/jpeg', () => {
        const info = getMimeInfo('image/jpeg');
        expect(info.icon).toBe('image');
        expect(info.color).toBe('#005bbf');
    });

    it('retourne l\'icône image pour image/png', () => {
        expect(getMimeInfo('image/png').icon).toBe('image');
    });

    it('retourne l\'icône image pour image/webp', () => {
        expect(getMimeInfo('image/webp').icon).toBe('image');
    });

    it('retourne l\'icône vidéo pour video/mp4', () => {
        const info = getMimeInfo('video/mp4');
        expect(info.icon).toBe('videocam');
        expect(info.color).toBe('#f97316');
    });

    it('retourne l\'icône vidéo pour video/webm', () => {
        expect(getMimeInfo('video/webm').icon).toBe('videocam');
    });

    it('retourne l\'icône audio pour audio/mpeg', () => {
        const info = getMimeInfo('audio/mpeg');
        expect(info.icon).toBe('music_note');
        expect(info.color).toBe('#9e4300');
    });

    it('retourne l\'icône audio pour audio/ogg', () => {
        expect(getMimeInfo('audio/ogg').icon).toBe('music_note');
    });

    it('retourne l\'icône PDF pour application/pdf', () => {
        const info = getMimeInfo('application/pdf');
        expect(info.icon).toBe('picture_as_pdf');
        expect(info.color).toBe('#ba1a1a');
    });

    it('retourne l\'icône tableur pour application/vnd.openxmlformats-officedocument.spreadsheetml.sheet (xlsx)', () => {
        const info = getMimeInfo('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        expect(info.icon).toBe('grid_on');
        expect(info.color).toBe('#34a853');
    });

    it('retourne l\'icône tableur pour application/vnd.ms-excel', () => {
        // contient "spreadsheet" n'est pas vrai ici — fallback sur la règle "xlsx"
        // On teste que la regex includes('xlsx') fonctionne
        const info = getMimeInfo('application/xlsx');
        expect(info.icon).toBe('grid_on');
    });

    it('retourne l\'icône présentation pour application/vnd.openxmlformats-officedocument.presentationml.presentation (pptx)', () => {
        const info = getMimeInfo('application/vnd.openxmlformats-officedocument.presentationml.presentation');
        expect(info.icon).toBe('slideshow');
        expect(info.color).toBe('#f97316');
    });

    it('retourne l\'icône description pour text/plain', () => {
        const info = getMimeInfo('text/plain');
        expect(info.icon).toBe('description');
        expect(info.color).toBe('#005bbf');
    });

    it('retourne l\'icône description pour text/html', () => {
        expect(getMimeInfo('text/html').icon).toBe('description');
    });

    // Cas inconnu
    it('retourne l\'icône générique pour un MIME inconnu', () => {
        const info = getMimeInfo('application/octet-stream');
        expect(info.icon).toBe('insert_drive_file');
        expect(info.color).toBe('#727785');
    });

    // Cas limites — null / undefined
    it('retourne l\'icône générique pour null', () => {
        const info = getMimeInfo(null);
        expect(info.icon).toBe('insert_drive_file');
    });

    it('retourne l\'icône générique pour undefined', () => {
        const info = getMimeInfo(undefined);
        expect(info.icon).toBe('insert_drive_file');
    });

    it('retourne l\'icône générique pour une chaîne vide', () => {
        const info = getMimeInfo('');
        expect(info.icon).toBe('insert_drive_file');
    });

    // Vérification que l'objet retourné a toujours les deux propriétés
    it('retourne toujours un objet avec icon et color', () => {
        const info = getMimeInfo('image/gif');
        expect(info).toHaveProperty('icon');
        expect(info).toHaveProperty('color');
    });
});
