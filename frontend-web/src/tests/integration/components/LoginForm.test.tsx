import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginForm } from '@/pages/auth/LoginForm';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';
import type { User } from '@/types';

// Mock du service d'authentification
jest.mock('@/services/authService', () => ({
    authService: {
        login: jest.fn(),
        register: jest.fn(),
        getOAuthUrl: jest.fn((p: string) => `http://localhost:8000/api/auth/oauth/${p}`),
    },
}));

// Mock de react-router-dom navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

// Mock du composant OAuthButtons (dépendance interne)
jest.mock('@/components/ui/OAuthButtons', () => ({
    OAuthButtons: () => <div data-testid="oauth-buttons" />,
}));

const mockedLogin = authService.login as jest.MockedFunction<typeof authService.login>;

const makeUser = (overrides: Partial<User> = {}): User => ({
    id: 1,
    email: 'abdoulaye@example.com',
    firstName: 'Abdoulaye',
    lastName: 'FOFANA',
    avatar: null,
    quotaUsed: 0,
    quotaLimit: 10_737_418_240,
    theme: null,
    roles: ['ROLE_USER'],
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
});

const renderLoginForm = (onSwitchMode = jest.fn()) => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter>
                <LoginForm onSwitchMode={onSwitchMode} />
            </MemoryRouter>
        </QueryClientProvider>
    );
};

beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    useAuthStore.setState({ token: null, user: null, isAuthenticated: false });
});

// ─── Rendu 

describe('LoginForm — rendu', () => {
    it('affiche le champ email', () => {
        renderLoginForm();
        expect(screen.getByPlaceholderText('vous@exemple.com')).toBeInTheDocument();
    });

    it('affiche le champ mot de passe', () => {
        renderLoginForm();
        expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    });

    it('affiche le bouton "Se connecter"', () => {
        renderLoginForm();
        expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument();
    });

    it('affiche le bouton "Créer un compte"', () => {
        renderLoginForm();
        expect(screen.getByRole('button', { name: /créer un compte/i })).toBeInTheDocument();
    });

    it('affiche la checkbox "Se souvenir de moi" cochée par défaut', () => {
        renderLoginForm();
        const checkbox = screen.getByRole('checkbox');
        expect(checkbox).toBeChecked();
    });

    it('affiche les boutons OAuth', () => {
        renderLoginForm();
        expect(screen.getByTestId('oauth-buttons')).toBeInTheDocument();
    });
});

// ─── Validation 

describe('LoginForm — validation', () => {
    it('affiche une erreur si l\'email est invalide', async () => {
        const { container } = renderLoginForm();

        fireEvent.change(screen.getByPlaceholderText('vous@exemple.com'), { target: { value: 'pas-un-email' } });
        fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'motdepasse' } });
        fireEvent.submit(container.querySelector('form')!);

        await waitFor(() => {
            expect(screen.getByText(/email invalide/i)).toBeInTheDocument();
        });
    });

    it('affiche une erreur si le mot de passe est vide', async () => {
        renderLoginForm();

        await userEvent.type(screen.getByPlaceholderText('vous@exemple.com'), 'abdoulaye@example.com');
        fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));

        await waitFor(() => {
            expect(screen.getByText(/mot de passe requis/i)).toBeInTheDocument();
        });
    });

    it('n\'appelle pas authService.login si la validation échoue', async () => {
        renderLoginForm();

        fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));

        await waitFor(() => {
            expect(screen.getAllByText(/email invalide|mot de passe requis/i).length).toBeGreaterThan(0);
        });

        expect(mockedLogin).not.toHaveBeenCalled();
    });
});

// ─── Soumission réussie 

describe('LoginForm — soumission réussie', () => {
    it('appelle authService.login avec les bons identifiants', async () => {
        const user = makeUser();
        mockedLogin.mockResolvedValueOnce({ token: 'jwt', user });

        renderLoginForm();

        await userEvent.type(screen.getByPlaceholderText('vous@exemple.com'), 'abdoulaye@example.com');
        await userEvent.type(screen.getByPlaceholderText('••••••••'), 'secret');
        fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));

        await waitFor(() => {
            expect(mockedLogin).toHaveBeenCalledWith({
                email: 'abdoulaye@example.com',
                password: 'secret',
            });
        });
    });

    it('redirige vers /dashboard après connexion réussie', async () => {
        const user = makeUser();
        mockedLogin.mockResolvedValueOnce({ token: 'jwt', user });

        renderLoginForm();

        await userEvent.type(screen.getByPlaceholderText('vous@exemple.com'), 'abdoulaye@example.com');
        await userEvent.type(screen.getByPlaceholderText('••••••••'), 'secret');
        fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
        });
    });
});

// ─── Erreur API 

describe('LoginForm — erreur API', () => {
    it('affiche le message d\'erreur retourné par l\'API', async () => {
        mockedLogin.mockRejectedValueOnce({
            response: { data: { message: 'Identifiants incorrects' } },
        });

        renderLoginForm();

        await userEvent.type(screen.getByPlaceholderText('vous@exemple.com'), 'abdoulaye@example.com');
        await userEvent.type(screen.getByPlaceholderText('••••••••'), 'wrong');
        fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));

        await waitFor(() => {
            expect(screen.getByText('Identifiants incorrects')).toBeInTheDocument();
        });
    });

    it('affiche un message par défaut si l\'API ne retourne pas de message', async () => {
        mockedLogin.mockRejectedValueOnce(new Error('Network error'));

        renderLoginForm();

        await userEvent.type(screen.getByPlaceholderText('vous@exemple.com'), 'abdoulaye@example.com');
        await userEvent.type(screen.getByPlaceholderText('••••••••'), 'wrong');
        fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));

        await waitFor(() => {
            expect(screen.getByText(/identifiants incorrects/i)).toBeInTheDocument();
        });
    });

    it('ne redirige pas si le login échoue', async () => {
        mockedLogin.mockRejectedValueOnce({ response: { data: { message: 'Erreur' } } });

        renderLoginForm();

        await userEvent.type(screen.getByPlaceholderText('vous@exemple.com'), 'abdoulaye@example.com');
        await userEvent.type(screen.getByPlaceholderText('••••••••'), 'wrong');
        fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));

        await waitFor(() => {
            expect(screen.getByText('Erreur')).toBeInTheDocument();
        });

        expect(mockNavigate).not.toHaveBeenCalled();
    });
});

// ─── Affichage/masquage du mot de passe 

describe('LoginForm — visibilité du mot de passe', () => {
    it('le mot de passe est masqué par défaut', () => {
        renderLoginForm();
        expect(screen.getByPlaceholderText('••••••••')).toHaveAttribute('type', 'password');
    });

    it('affiche le mot de passe après clic sur l\'icône œil', async () => {
        renderLoginForm();

        // L'icône œil est un bouton sans texte accessible — on le trouve par son contenu Material Icon
        const toggleButton = screen.getByText('visibility').closest('button');
        fireEvent.click(toggleButton!);

        expect(screen.getByPlaceholderText('••••••••')).toHaveAttribute('type', 'text');
    });
});

// ─── Switch de mode

describe('LoginForm — switch vers inscription', () => {
    it('appelle onSwitchMode quand "Créer un compte" est cliqué', () => {
        const onSwitchMode = jest.fn();
        renderLoginForm(onSwitchMode);

        fireEvent.click(screen.getByRole('button', { name: /créer un compte/i }));

        expect(onSwitchMode).toHaveBeenCalledTimes(1);
    });
});
