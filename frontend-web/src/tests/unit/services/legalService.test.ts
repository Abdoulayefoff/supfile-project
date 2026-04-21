import { legalService } from '@/services/legalService';
import type { LegalSlug } from '@/services/legalService';
import apiClient from '@/lib/axios';

jest.mock('@/lib/axios', () => ({
    __esModule: true,
    default: {
        get:    jest.fn(),
        post:   jest.fn(),
        delete: jest.fn(),
        patch:  jest.fn(),
    },
}));

const mockedGet = apiClient.get as jest.MockedFunction<typeof apiClient.get>;

beforeEach(() => {
    jest.clearAllMocks();
});

// ─── legalService.getDocument 

describe('legalService.getDocument()', () => {
    it('appelle GET /legal/privacy pour le slug privacy', async () => {
        mockedGet.mockResolvedValueOnce({
            data: { slug: 'privacy', content: '# Politique de confidentialité' },
        });

        await legalService.getDocument('privacy');

        expect(mockedGet).toHaveBeenCalledWith('/legal/privacy');
    });

    it('appelle GET /legal/terms pour le slug terms', async () => {
        mockedGet.mockResolvedValueOnce({
            data: { slug: 'terms', content: '# Conditions générales' },
        });

        await legalService.getDocument('terms');

        expect(mockedGet).toHaveBeenCalledWith('/legal/terms');
    });

    it('appelle GET /legal/help pour le slug help', async () => {
        mockedGet.mockResolvedValueOnce({
            data: { slug: 'help', content: '# Aide' },
        });

        await legalService.getDocument('help');

        expect(mockedGet).toHaveBeenCalledWith('/legal/help');
    });

    it('retourne le slug et le contenu du document', async () => {
        const payload = { slug: 'privacy' as LegalSlug, content: '# Politique\n\nContenu.' };
        mockedGet.mockResolvedValueOnce({ data: payload });

        const result = await legalService.getDocument('privacy');

        expect(result.slug).toBe('privacy');
        expect(result.content).toBe('# Politique\n\nContenu.');
    });

    it('propage l\'erreur si le serveur retourne 404', async () => {
        mockedGet.mockRejectedValueOnce({ response: { status: 404 } });

        await expect(legalService.getDocument('privacy')).rejects.toMatchObject({
            response: { status: 404 },
        });
    });

    it('propage l\'erreur réseau', async () => {
        mockedGet.mockRejectedValueOnce(new Error('Network Error'));

        await expect(legalService.getDocument('terms')).rejects.toThrow('Network Error');
    });
});
