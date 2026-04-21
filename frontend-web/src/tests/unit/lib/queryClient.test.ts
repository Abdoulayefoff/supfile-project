import { queryClient } from '@/lib/queryClient';
import { QueryClient } from '@tanstack/react-query';

// ─── Instance 

describe('queryClient — instance', () => {
    it('est une instance de QueryClient', () => {
        expect(queryClient).toBeInstanceOf(QueryClient);
    });
});

// ─── defaultOptions.queries 

describe('queryClient — defaultOptions.queries', () => {
    const opts = queryClient.getDefaultOptions().queries;

    it('staleTime est de 2 minutes (120 000 ms)', () => {
        expect(opts?.staleTime).toBe(1000 * 60 * 2);
    });

    it('gcTime est de 10 minutes (600 000 ms)', () => {
        expect(opts?.gcTime).toBe(1000 * 60 * 10);
    });

    it('refetchOnWindowFocus est désactivé', () => {
        expect(opts?.refetchOnWindowFocus).toBe(false);
    });

    // ─── Logique retry 

    describe('retry()', () => {
        const retry = opts?.retry as (count: number, error: unknown) => boolean;

        it('ne réessaie pas sur une erreur 401', () => {
            expect(retry(0, { response: { status: 401 } })).toBe(false);
        });

        it('ne réessaie pas sur une erreur 403', () => {
            expect(retry(0, { response: { status: 403 } })).toBe(false);
        });

        it('ne réessaie pas sur une erreur 404', () => {
            expect(retry(0, { response: { status: 404 } })).toBe(false);
        });

        it('réessaie (< 2 fois) sur une erreur 500', () => {
            expect(retry(0, { response: { status: 500 } })).toBe(true);
            expect(retry(1, { response: { status: 500 } })).toBe(true);
        });

        it('arrête de réessayer après 2 tentatives sur une erreur 500', () => {
            expect(retry(2, { response: { status: 500 } })).toBe(false);
        });

        it('réessaie sur une erreur réseau sans statut HTTP', () => {
            expect(retry(0, new Error('Network error'))).toBe(true);
        });

        it('réessaie si response est undefined (erreur réseau pure)', () => {
            expect(retry(1, { response: undefined })).toBe(true);
        });
    });
});

// ─── defaultOptions.mutations 

describe('queryClient — defaultOptions.mutations', () => {
    it('retry est désactivé pour les mutations', () => {
        const opts = queryClient.getDefaultOptions().mutations;
        expect(opts?.retry).toBe(false);
    });
});
