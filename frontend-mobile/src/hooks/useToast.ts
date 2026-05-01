import { useState } from 'react';

interface ToastState {
  visible: boolean;
  message: string;
  subMessage?: string;
  type: 'success' | 'error' | 'info';
}

export function useToast() {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'success',
  });

  const showToast = (message: string, subMessage?: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ visible: true, message, subMessage, type });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  return { toast, showToast, hideToast };
}