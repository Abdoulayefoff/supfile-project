import { useState, useCallback } from 'react';

// Type définissant les différents styles visuels du toast
type ToastType = 'success' | 'error' | 'info';

// Interface représentant l'état du toast
interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
}

// Hook personnalisé pour gérer l'affichage d'un toast de notification
export const useToast = () => {
  // État local du toast (caché par défaut)
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'info',
  });

  // Affiche le toast pendant 3 secondes
  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      hideToast();
    }, 3000); // Disparaît automatiquement après 3s
  }, []);

  // Masque le toast manuellement
  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  return { toast, showToast, hideToast };
};
