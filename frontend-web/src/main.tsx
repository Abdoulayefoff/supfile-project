import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@/index.css';
import App from '@/App';

// ── Point d'entrée de l'application 
// On récupère l'élément root du DOM et on lance le rendu React
// StrictMode active des vérifications supplémentaires en développement
const rootElement = document.getElementById('root');

if (!rootElement) {
    throw new Error('Élément #root introuvable dans le DOM. Vérifier index.html.');
}

createRoot(rootElement).render(
    <StrictMode>
        <App />
    </StrictMode>,
);