import apiClient from '@/lib/axios';

export type LegalSlug = 'privacy' | 'terms' | 'help';

interface LegalResponse {
    slug:    LegalSlug;
    content: string;
}

// Service légal
// Contient uniquement l'appel HTTP vers l'API Symfony
// GET /api/legal/{slug} → retourne { slug, content } (Markdown brut)
export const legalService = {
    getDocument: async (slug: LegalSlug): Promise<LegalResponse> => {
        const response = await apiClient.get<LegalResponse>(`/legal/${slug}`);
        return response.data;
    },
};
