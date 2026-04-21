import type { Config } from 'jest';

const config: Config = {
    testEnvironment: 'jsdom',

    transform: {
        '^.+\\.tsx?$': ['<rootDir>/src/tests/transforms/vite-meta-transform.cjs', {
            tsconfig: {
                jsx: 'react-jsx',
                esModuleInterop: true,
                module: 'esnext',
                moduleResolution: 'node',
                allowSyntheticDefaultImports: true,
                strict: true,
                baseUrl: '.',
                paths: {
                    '@/*': ['src/*'],
                },
                types: ['jest', 'node', '@testing-library/jest-dom'],
            },
        }],
    },

    setupFiles: ['<rootDir>/src/tests/setup.globals.ts'],

    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        // Static asset stubs
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/src/tests/__mocks__/fileMock.ts',
    },

    setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],

    testMatch: [
        '<rootDir>/src/tests/unit/**/*.test.ts',
        '<rootDir>/src/tests/unit/**/*.test.tsx',
        '<rootDir>/src/tests/integration/**/*.test.ts',
        '<rootDir>/src/tests/integration/**/*.test.tsx',
    ],

    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        // Exclusions globales
        '!src/**/*.d.ts',
        '!src/main.tsx',
        '!src/vite-env.d.ts',
        '!src/tests/**',
        '!src/App.tsx',
        // Fichier d'infrastructure axios — pas de tests unitaires dédiés,
        // et import.meta.env n'est pas compatible avec l'instrumentation de couverture.
        '!src/lib/axios.ts',
        // shareService uses import.meta.env and has no direct test file — instrumented
        // indirectly through useShares hook tests; cold coverage path raises TS1343.
        '!src/services/shareService.ts',
        // Gros composants pages — trop couplés au contexte app pour des tests unitaires
        '!src/pages/drive/**',
        '!src/pages/files/**',
        '!src/pages/share/**',
        '!src/pages/shared/**',
        '!src/pages/trash/**',
        '!src/pages/dashboard/**',
        '!src/pages/settings/**',
        '!src/pages/auth/AuthPage.tsx',
        '!src/pages/auth/OAuthCallbackPage.tsx',
        // Composants layout et modaux complexes
        '!src/components/layout/**',
        '!src/components/ui/UploadModal.tsx',
        '!src/components/ui/ShareModal.tsx',
        '!src/components/ui/MoveModal.tsx',
        '!src/components/ui/RenameModal.tsx',
        '!src/components/ui/NewFolderModal.tsx',
        '!src/components/ui/ContextMenu.tsx',
        '!src/components/ui/LegalModal.tsx',
    ],

    coverageDirectory: 'coverage',

    coverageReporters: ['text', 'lcov', 'html'],

    coverageThreshold: {
        global: {
            branches: 75,
            functions: 85,
            lines: 85,
            statements: 85,
        },
    },
};

export default config;
