import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLegal } from '@/hooks/useLegal';
import { legalService } from '@/services/legalService';

jest.mock('@/services/legalService', () => ({
    legalService: {
        getDocument: jest.fn(),
    },
}));

const mockGetDocument = legalService.getDocument as jest.MockedFunction<typeof legalService.getDocument>;

let queryClient: QueryClient;
const createWrapper = () => {
    queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

beforeEach(() => {
    jest.clearAllMocks();
});

describe('useLegal', () => {
    it('is disabled when slug is null', () => {
        const { result } = renderHook(() => useLegal(null), { wrapper: createWrapper() });
        expect(result.current.fetchStatus).toBe('idle');
        expect(result.current.status).toBe('pending'); // Initial state when disabled
        expect(mockGetDocument).not.toHaveBeenCalled();
    });

    it('calls getDocument when a valid slug is provided', async () => {
        mockGetDocument.mockResolvedValueOnce({ slug: 'terms', content: '# Terms of Service' });
        const { result } = renderHook(() => useLegal('terms'), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data?.content).toBe('# Terms of Service');
        expect(mockGetDocument).toHaveBeenCalledWith('terms');
        expect(mockGetDocument).toHaveBeenCalledTimes(1);
    });

    it('exposes the error if getDocument fails', async () => {
        mockGetDocument.mockRejectedValueOnce(new Error('Network error'));
        const { result } = renderHook(() => useLegal('privacy'), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(result.current.error).toBeDefined();
    });
});
