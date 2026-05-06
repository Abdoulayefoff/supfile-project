import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RegisterForm } from '@/pages/auth/RegisterForm';

// Mock du hook useRegister depuis useAuth
const mockMutateAsync = jest.fn();
jest.mock('@/hooks/useAuth', () => ({
    useRegister: () => ({
        mutateAsync: mockMutateAsync,
        isPending: false,
    }),
}));

// Mock de react-router-dom navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

// Mock du composant OAuthButtons
jest.mock('@/components/ui/OAuthButtons', () => ({
    OAuthButtons: () => <div data-testid="oauth-buttons" />,
}));

const renderRegisterForm = (onSwitchMode = jest.fn()) => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter>
                <RegisterForm onSwitchMode={onSwitchMode} />
            </MemoryRouter>
        </QueryClientProvider>
    );
};

beforeEach(() => {
    jest.clearAllMocks();
});

// ─── Rendu

describe('RegisterForm — rendu', () => {
    it('affiche le champ Prénom', () => {
        renderRegisterForm();
        expect(screen.getByPlaceholderText('Votre prénom')).toBeInTheDocument();
    });

    it('affiche le champ Nom', () => {
        renderRegisterForm();
        expect(screen.getByPlaceholderText('Votre nom')).toBeInTheDocument();
    });

    it('affiche le champ Email', () => {
        renderRegisterForm();
        expect(screen.getByPlaceholderText('votre@email.com')).toBeInTheDocument();
    });


    it('affiche le champ Mot de passe', () => {
        renderRegisterForm();
        expect(screen.getByPlaceholderText('Min. 8 caractères')).toBeInTheDocument();
    });

    it('affiche le champ Confirmation', () => {
        renderRegisterForm();
        expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    });

    it('affiche le bouton "Créer mon compte"', () => {
        renderRegisterForm();
        expect(screen.getByRole('button', { name: /créer mon compte/i })).toBeInTheDocument();
    });

    it('affiche le bouton "Se connecter" pour switcher vers le login', () => {
        renderRegisterForm();
        expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument();
    });

    it('affiche les boutons OAuth', () => {
        renderRegisterForm();
        expect(screen.getByTestId('oauth-buttons')).toBeInTheDocument();
    });
});

// ─── Validation 

describe('RegisterForm — validation', () => {
    it('affiche une erreur si le prénom est vide', async () => {
        const { container } = renderRegisterForm();

        fireEvent.submit(container.querySelector('form')!);

        await waitFor(() => {
            expect(screen.getByText(/prénom requis/i)).toBeInTheDocument();
        });
    });

    it('affiche une erreur si l\'email est invalide', async () => {
        const { container } = renderRegisterForm();

        await userEvent.type(screen.getByPlaceholderText('Votre prénom'), 'Abdoulaye');
        await userEvent.type(screen.getByPlaceholderText('Votre nom'), 'FOFANA');
        await userEvent.type(screen.getByPlaceholderText('votre@email.com'), 'pas-un-email');
        await userEvent.type(screen.getByPlaceholderText('Min. 8 caractères'), 'motdepasse');
        await userEvent.type(screen.getByPlaceholderText('••••••••'), 'motdepasse');

        fireEvent.submit(container.querySelector('form')!);

        await waitFor(() => {
            expect(screen.getByText(/email invalide/i)).toBeInTheDocument();
        });
    });

    it('affiche une erreur si le mot de passe est trop court', async () => {
        renderRegisterForm();

        await userEvent.type(screen.getByPlaceholderText('Votre prénom'), 'Abdoulaye');
        await userEvent.type(screen.getByPlaceholderText('Votre nom'), 'FOFANA');
        await userEvent.type(screen.getByPlaceholderText('votre@email.com'), 'abdoulaye@example.com');
        await userEvent.type(screen.getByPlaceholderText('Min. 8 caractères'), 'court');
        await userEvent.type(screen.getByPlaceholderText('••••••••'), 'court');

        fireEvent.click(screen.getByRole('button', { name: /créer mon compte/i }));

        await waitFor(() => {
            expect(screen.getByText(/minimum 8 caractères/i)).toBeInTheDocument();
        });
    });

    it('affiche une erreur si les mots de passe ne correspondent pas', async () => {
        renderRegisterForm();

        await userEvent.type(screen.getByPlaceholderText('Votre prénom'), 'Abdoulaye');
        await userEvent.type(screen.getByPlaceholderText('Votre nom'), 'FOFANA');
        await userEvent.type(screen.getByPlaceholderText('votre@email.com'), 'abdoulaye@example.com');
        await userEvent.type(screen.getByPlaceholderText('Min. 8 caractères'), 'motdepasse1');
        await userEvent.type(screen.getByPlaceholderText('••••••••'), 'motdepasse2');

        fireEvent.click(screen.getByRole('button', { name: /créer mon compte/i }));

        await waitFor(() => {
            expect(screen.getByText(/les mots de passe ne correspondent pas/i)).toBeInTheDocument();
        });
    });

    it('ne soumet pas si la validation échoue', async () => {
        const { container } = renderRegisterForm();

        fireEvent.submit(container.querySelector('form')!);

        await waitFor(() => {
            expect(screen.getAllByText(/requis|invalide/i).length).toBeGreaterThan(0);
        });

        expect(mockMutateAsync).not.toHaveBeenCalled();
    });
});

// ─── Soumission réussie 

describe('RegisterForm — soumission réussie', () => {
    it('appelle mutateAsync avec les données correctes', async () => {
        mockMutateAsync.mockResolvedValueOnce({ token: 'jwt', user: { id: 1 } });

        renderRegisterForm();

        await userEvent.type(screen.getByPlaceholderText('Votre prénom'), 'Abdoulaye');
        await userEvent.type(screen.getByPlaceholderText('Votre nom'), 'FOFANA');
        await userEvent.type(screen.getByPlaceholderText('votre@email.com'), 'abdoulaye@example.com');
        await userEvent.type(screen.getByPlaceholderText('Min. 8 caractères'), 'motdepasse');
        await userEvent.type(screen.getByPlaceholderText('••••••••'), 'motdepasse');
        await userEvent.click(screen.getByRole('checkbox'));

        fireEvent.click(screen.getByRole('button', { name: /créer mon compte/i }));

        await waitFor(() => {
            expect(mockMutateAsync).toHaveBeenCalledWith({
                email:     'abdoulaye@example.com',
                password:  'motdepasse',
                firstName: 'Abdoulaye',
                lastName:  'FOFANA',
                consent:   true,
            });
        });
    });

    it('redirige vers /dashboard après inscription réussie', async () => {
        mockMutateAsync.mockResolvedValueOnce({ token: 'jwt', user: { id: 1 } });

        renderRegisterForm();

        await userEvent.type(screen.getByPlaceholderText('Votre prénom'), 'Abdoulaye');
        await userEvent.type(screen.getByPlaceholderText('Votre nom'), 'FOFANA');
        await userEvent.type(screen.getByPlaceholderText('votre@email.com'), 'abdoulaye@example.com');
        await userEvent.type(screen.getByPlaceholderText('Min. 8 caractères'), 'motdepasse');
        await userEvent.type(screen.getByPlaceholderText('••••••••'), 'motdepasse');
        await userEvent.click(screen.getByRole('checkbox'));

        fireEvent.click(screen.getByRole('button', { name: /créer mon compte/i }));

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
        });
    });
});

// ─── Erreur API 

describe('RegisterForm — erreur API', () => {
    it('affiche le message d\'erreur retourné par l\'API', async () => {
        mockMutateAsync.mockRejectedValueOnce({
            response: { data: { message: 'Email déjà utilisé' } },
        });

        renderRegisterForm();

        await userEvent.type(screen.getByPlaceholderText('Votre prénom'), 'Abdoulaye');
        await userEvent.type(screen.getByPlaceholderText('Votre nom'), 'FOFANA');
        await userEvent.type(screen.getByPlaceholderText('votre@email.com'), 'abdoulaye@example.com');
        await userEvent.type(screen.getByPlaceholderText('Min. 8 caractères'), 'motdepasse');
        await userEvent.type(screen.getByPlaceholderText('••••••••'), 'motdepasse');
        await userEvent.click(screen.getByRole('checkbox'));

        fireEvent.click(screen.getByRole('button', { name: /créer mon compte/i }));

        await waitFor(() => {
            expect(screen.getByText('Email déjà utilisé')).toBeInTheDocument();
        });
    });

    it('affiche un message par défaut si l\'API ne retourne pas de message', async () => {
        mockMutateAsync.mockRejectedValueOnce(new Error('Network error'));

        renderRegisterForm();

        await userEvent.type(screen.getByPlaceholderText('Votre prénom'), 'Abdoulaye');
        await userEvent.type(screen.getByPlaceholderText('Votre nom'), 'FOFANA');
        await userEvent.type(screen.getByPlaceholderText('votre@email.com'), 'abdoulaye@example.com');
        await userEvent.type(screen.getByPlaceholderText('Min. 8 caractères'), 'motdepasse');
        await userEvent.type(screen.getByPlaceholderText('••••••••'), 'motdepasse');
        await userEvent.click(screen.getByRole('checkbox'));

        fireEvent.click(screen.getByRole('button', { name: /créer mon compte/i }));

        await waitFor(() => {
            expect(screen.getByText(/une erreur est survenue/i)).toBeInTheDocument();
        });
    });

    it('ne redirige pas si l\'inscription échoue', async () => {
        mockMutateAsync.mockRejectedValueOnce({
            response: { data: { message: 'Erreur serveur' } },
        });

        renderRegisterForm();

        await userEvent.type(screen.getByPlaceholderText('Votre prénom'), 'Abdoulaye');
        await userEvent.type(screen.getByPlaceholderText('Votre nom'), 'FOFANA');
        await userEvent.type(screen.getByPlaceholderText('votre@email.com'), 'abdoulaye@example.com');
        await userEvent.type(screen.getByPlaceholderText('Min. 8 caractères'), 'motdepasse');
        await userEvent.type(screen.getByPlaceholderText('••••••••'), 'motdepasse');
        await userEvent.click(screen.getByRole('checkbox'));

        fireEvent.click(screen.getByRole('button', { name: /créer mon compte/i }));

        await waitFor(() => {
            expect(screen.getByText('Erreur serveur')).toBeInTheDocument();
        });

        expect(mockNavigate).not.toHaveBeenCalled();
    });
});

// ─── Visibilité des mots de passe 

describe('RegisterForm — visibilité des mots de passe', () => {
    it('les mots de passe sont masqués par défaut', () => {
        renderRegisterForm();
        expect(screen.getByPlaceholderText('Min. 8 caractères')).toHaveAttribute('type', 'password');
        expect(screen.getByPlaceholderText('••••••••')).toHaveAttribute('type', 'password');
    });

    it('affiche le mot de passe après clic sur le bouton visibilité', async () => {
        renderRegisterForm();

        const visibilityButtons = screen.getAllByText('visibility');
        fireEvent.click(visibilityButtons[0].closest('button')!);

        expect(screen.getByPlaceholderText('Min. 8 caractères')).toHaveAttribute('type', 'text');
    });
});

// ─── Switch de mode 

describe('RegisterForm — switch vers login', () => {
    it('appelle onSwitchMode quand "Se connecter" est cliqué', () => {
        const onSwitchMode = jest.fn();
        renderRegisterForm(onSwitchMode);

        fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));

        expect(onSwitchMode).toHaveBeenCalledTimes(1);
    });
});
