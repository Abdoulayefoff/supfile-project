/// <reference types="vite/client" />

// Déclare les variables d'environnement Vite disponibles dans le projet
interface ImportMetaEnv {
    readonly VITE_API_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}