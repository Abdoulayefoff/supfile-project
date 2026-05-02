import { render, screen, fireEvent } from '@testing-library/react';
import { OAuthButtons } from '@/components/ui/OAuthButtons';
import { redirectToUrl } from '@/hooks/useAuth';

// Mock de getOAuthUrl et redirectToUrl
jest.mock('@/hooks/useAuth', () => ({
    getOAuthUrl: (provider: string) => `http://localhost:8000/api/auth/oauth/${provider}`,
    redirectToUrl: jest.fn(),
}));

describe('OAuthButtons', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ─── Rendu des 3 boutons 

    it('affiche le bouton Google', () => {
        render(<OAuthButtons />);
        expect(screen.getByText('Continuer avec Google')).toBeTruthy();
    });

    it('affiche le bouton GitHub', () => {
        render(<OAuthButtons />);
        expect(screen.getByText('Continuer avec GitHub')).toBeTruthy();
    });

    it('affiche le bouton Microsoft', () => {
        render(<OAuthButtons />);
        expect(screen.getByText('Continuer avec Microsoft')).toBeTruthy();
    });

    it('rend exactement 3 boutons', () => {
        render(<OAuthButtons />);
        const buttons = screen.getAllByRole('button');
        expect(buttons).toHaveLength(3);
    });

    // ─── Redirection OAuth 

    it('redirige vers l\'URL Google au clic', () => {
        render(<OAuthButtons />);
        fireEvent.click(screen.getByText('Continuer avec Google'));
        expect(redirectToUrl).toHaveBeenCalledWith('http://localhost:8000/api/auth/oauth/google');
    });

    it('redirige vers l\'URL GitHub au clic', () => {
        render(<OAuthButtons />);
        fireEvent.click(screen.getByText('Continuer avec GitHub'));
        expect(redirectToUrl).toHaveBeenCalledWith('http://localhost:8000/api/auth/oauth/github');
    });

    it('redirige vers l\'URL Microsoft au clic', () => {
        render(<OAuthButtons />);
        fireEvent.click(screen.getByText('Continuer avec Microsoft'));
        expect(redirectToUrl).toHaveBeenCalledWith('http://localhost:8000/api/auth/oauth/microsoft');
    });

    // ─── Hover effects 

    it('change le background au survol (mouseEnter)', () => {
        render(<OAuthButtons />);
        const btn = screen.getByText('Continuer avec Google').closest('button')!;
        fireEvent.mouseEnter(btn);
        // jsdom parse les couleurs hexa en rgb()
        expect(btn.style.background).toBe('rgb(243, 244, 245)');
    });

    it('remet le background à white au départ du survol (mouseLeave)', () => {
        render(<OAuthButtons />);
        const btn = screen.getByText('Continuer avec Google').closest('button')!;
        fireEvent.mouseEnter(btn);
        fireEvent.mouseLeave(btn);
        expect(btn.style.background).toBe('white');
    });

    // ─── Attributs 

    it('tous les boutons sont de type "button" (pas submit)', () => {
        render(<OAuthButtons />);
        screen.getAllByRole('button').forEach((btn) => {
            expect(btn).toHaveAttribute('type', 'button');
        });
    });
});

