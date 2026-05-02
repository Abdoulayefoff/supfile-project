import { render, screen } from '@testing-library/react';
import { MaterialIcon } from '@/components/ui/MaterialIcon';

describe('MaterialIcon', () => {

    // ─── Rendu de base 

    it('affiche le nom de l\'icône en contenu texte', () => {
        render(<MaterialIcon n="folder" />);
        expect(screen.getByText('folder')).toBeTruthy();
    });

    it('utilise la police Material Symbols Outlined', () => {
        render(<MaterialIcon n="upload_file" />);
        const el = screen.getByText('upload_file');
        expect(el.style.fontFamily).toContain('Material Symbols Outlined');
    });

    // ─── Props optionnelles 

    it('applique la taille via fontSize (défaut 22px)', () => {
        render(<MaterialIcon n="home" />);
        const el = screen.getByText('home');
        expect(el.style.fontSize).toBe('22px');
    });

    it('applique une taille personnalisée', () => {
        render(<MaterialIcon n="home" s={32} />);
        const el = screen.getByText('home');
        expect(el.style.fontSize).toBe('32px');
    });

    it('applique la couleur via style.color', () => {
        render(<MaterialIcon n="star" c="#ff0000" />);
        const el = screen.getByText('star');
        expect(el.style.color).toBe('rgb(255, 0, 0)');
    });

    it('n\'applique pas de couleur si c est omis', () => {
        render(<MaterialIcon n="star" />);
        const el = screen.getByText('star');
        expect(el.style.color).toBe('');
    });

    it('applique une className additionnelle', () => {
        render(<MaterialIcon n="check" className="my-icon" />);
        const el = screen.getByText('check');
        expect(el.classList.contains('my-icon')).toBe(true);
    });

    // ─── fontVariationSettings : fill/outline 

    it('utilise FILL=0 par défaut (mode outline)', () => {
        render(<MaterialIcon n="favorite" />);
        const el = screen.getByText('favorite');
        expect(el.style.fontVariationSettings).toContain("'FILL' 0");
    });

    it('utilise FILL=1 quand fill=true', () => {
        render(<MaterialIcon n="favorite" fill={true} />);
        const el = screen.getByText('favorite');
        expect(el.style.fontVariationSettings).toContain("'FILL' 1");
    });

    it('utilise FILL=0 quand fill=false explicitement', () => {
        render(<MaterialIcon n="favorite" fill={false} />);
        const el = screen.getByText('favorite');
        expect(el.style.fontVariationSettings).toContain("'FILL' 0");
    });

    // ─── Styles structurels 

    it('est un display inline-block', () => {
        render(<MaterialIcon n="send" />);
        const el = screen.getByText('send');
        expect(el.style.display).toBe('inline-block');
    });

    it('a userSelect none (non sélectionnable)', () => {
        render(<MaterialIcon n="send" />);
        const el = screen.getByText('send');
        expect(el.style.userSelect).toBe('none');
    });

    it('rend un élément <span>', () => {
        render(<MaterialIcon n="close" />);
        const el = screen.getByText('close');
        expect(el.tagName.toLowerCase()).toBe('span');
    });
});
