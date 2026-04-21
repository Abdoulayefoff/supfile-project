import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

// ─── Rendu de base 

describe('Button — rendu', () => {
    it('affiche le texte passé comme children', () => {
        render(<Button>Enregistrer</Button>);
        expect(screen.getByRole('button', { name: /enregistrer/i })).toBeInTheDocument();
    });

    it('utilise le type "button" par défaut', () => {
        render(<Button>Cliquez</Button>);
        expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('utilise le type "submit" quand spécifié', () => {
        render(<Button type="submit">Envoyer</Button>);
        expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });

    it('utilise le type "reset" quand spécifié', () => {
        render(<Button type="reset">Réinitialiser</Button>);
        expect(screen.getByRole('button')).toHaveAttribute('type', 'reset');
    });
});

// ─── onClick 

describe('Button — onClick', () => {
    it('appelle onClick quand le bouton est cliqué', () => {
        const handleClick = jest.fn();
        render(<Button onClick={handleClick}>Cliquez</Button>);

        fireEvent.click(screen.getByRole('button'));

        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('ne lève pas d\'erreur si onClick n\'est pas fourni', () => {
        render(<Button>Sans handler</Button>);
        expect(() => fireEvent.click(screen.getByRole('button'))).not.toThrow();
    });
});

// ─── État disabled 

describe('Button — état disabled', () => {
    it('est désactivé quand disabled=true', () => {
        render(<Button disabled>Désactivé</Button>);
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('ne déclenche pas onClick quand disabled', () => {
        const handleClick = jest.fn();
        render(
            <Button disabled onClick={handleClick}>
                Désactivé
            </Button>
        );

        fireEvent.click(screen.getByRole('button'));
        expect(handleClick).not.toHaveBeenCalled();
    });
});

// ─── État loading 

describe('Button — état loading', () => {
    it('désactive le bouton quand loading=true', () => {
        render(<Button loading>Chargement</Button>);
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('affiche l\'icône hourglass_empty quand loading=true', () => {
        render(<Button loading>Chargement</Button>);
        expect(screen.getByText('hourglass_empty')).toBeInTheDocument();
    });

    it('n\'affiche pas l\'icône hourglass quand loading=false', () => {
        render(<Button>Normal</Button>);
        expect(screen.queryByText('hourglass_empty')).not.toBeInTheDocument();
    });

    it('ne déclenche pas onClick quand loading=true', () => {
        const handleClick = jest.fn();
        render(
            <Button loading onClick={handleClick}>
                Chargement
            </Button>
        );

        fireEvent.click(screen.getByRole('button'));
        expect(handleClick).not.toHaveBeenCalled();
    });
});

// ─── Variantes visuelles 

describe('Button — variantes', () => {
    it('rend le bouton "primary" par défaut', () => {
        render(<Button>Primary</Button>);
        const btn = screen.getByRole('button');
        // La variante primary a un gradient en background
        expect(btn).toHaveStyle({ background: 'linear-gradient(135deg, #005bbf, #1a73e8)' });
    });

    it('rend le bouton "ghost" avec fond transparent', () => {
        render(<Button variant="ghost">Ghost</Button>);
        const btn = screen.getByRole('button');
        expect(btn).toHaveStyle({ background: 'none' });
    });
});

// ─── fullWidth 

describe('Button — fullWidth', () => {
    it('applique width 100% quand fullWidth=true', () => {
        render(<Button fullWidth>Pleine largeur</Button>);
        expect(screen.getByRole('button')).toHaveStyle({ width: '100%' });
    });

    it('n\'applique pas width 100% par défaut', () => {
        render(<Button>Normal</Button>);
        // width undefined → pas de style width 100%
        const btn = screen.getByRole('button');
        expect(btn).not.toHaveStyle({ width: '100%' });
    });
});
