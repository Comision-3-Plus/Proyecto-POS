import { useState, useCallback } from 'react';
import { Toast, ToastType } from '../components/common/ToastNotification';

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((
    type: ToastType,
    message: string,
    description?: string,
    duration?: number
  ) => {
    const id = Math.random().toString(36).substring(7);
    const newToast: Toast = {
      id,
      type,
      message,
      description,
      duration,
    };

    setToasts((prev) => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((message: string, description?: string, duration?: number) => {
    addToast('success', message, description, duration);
  }, [addToast]);

  const error = useCallback((message: string, description?: string, duration?: number) => {
    addToast('error', message, description, duration);
  }, [addToast]);

  const info = useCallback((message: string, description?: string, duration?: number) => {
    addToast('info', message, description, duration);
  }, [addToast]);

  const warning = useCallback((message: string, description?: string, duration?: number) => {
    addToast('warning', message, description, duration);
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    info,
    warning,
  };
}
