import { useQuery } from '@tanstack/react-query';
import { legalService, type LegalSlug } from '@/services/legalService';

/** Récupère le contenu Markdown d'un document légal depuis l'API.
 *  La requête n'est lancée que si `slug` est défini (enabled: !!slug).
 */
export const useLegal = (slug: LegalSlug | null) =>
    useQuery({
        queryKey: ['legal', slug],
        queryFn:  () => legalService.getDocument(slug!),
        enabled:  !!slug,
        staleTime: 1000 * 60 * 10, // 10 min — le contenu légal change rarement
    });
