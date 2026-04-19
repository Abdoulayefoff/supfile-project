import { QueryClient } from '@tanstack/react-query';

// ── Configuration globale de TanStack Query 
// QueryClient est le gestionnaire central du cache de toutes les requêtes
// API de l'application. Ces options s'appliquent à toutes les requêtes
// sauf si elles sont surchargées localement dans un useQuery/useMutation
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Durée pendant laquelle les données sont considérées "fraîches"
            // → pas de refetch si les données ont moins de 2 minutes
            staleTime: 1000 * 60 * 2,

            // Durée de conservation du cache après qu'un composant
            // se désenregistre (unmount) → 10 minutes
            gcTime: 1000 * 60 * 10,

            // Logique de retry personnalisée :
            // → pas de retry sur les erreurs 401/403/404 (inutile)
            // → max 2 retries pour les autres erreurs (réseau, 500...)
            retry: (failureCount, error: unknown) => {
                const axiosError = error as { response?: { status: number } };
                const status = axiosError?.response?.status ?? 0;

                if ([401, 403, 404].includes(status)) {
                    return false;
                }

                return failureCount < 2;
            },

            // Pas de refetch automatique quand l'utilisateur
            // revient sur l'onglet (évite les requêtes inutiles)
            refetchOnWindowFocus: false,
        },

        mutations: {
            // Pas de retry automatique sur les mutations
            // (POST/PATCH/DELETE ne doivent pas être rejoués automatiquement)
            retry: false,
        },
    },
});