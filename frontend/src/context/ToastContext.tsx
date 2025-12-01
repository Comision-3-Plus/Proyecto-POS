/**
 * Toast Context & Provider - Premium Design
 * Sistema global de notificaciones con fade + slide-in
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle,
  AlertCircle,
  XCircle,
  Info,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const toastConfig = {
  success: {
    icon: CheckCircle,
    className: 'bg-success-50 border-success-200 text-success-800',
    iconClassName: 'text-success-500',
  },
  error: {
    icon: XCircle,
    className: 'bg-danger-50 border-danger-200 text-danger-800',
    iconClassName: 'text-danger-500',
  },
  warning: {
    icon: AlertCircle,
    className: 'bg-warning-50 border-warning-200 text-warning-800',
    iconClassName: 'text-warning-500',
  },
  info: {
    icon: Info,
    className: 'bg-primary-50 border-primary-200 text-primary-800',
    iconClassName: 'text-primary-500',
  },
};

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const config = toastConfig[toast.type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl border shadow-lg min-w-[320px] max-w-md',
        config.className
      )}
    >
      <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', config.iconClassName)} />
      <p className="flex-1 text-sm font-medium leading-relaxed">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity p-0.5"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: string, duration = 5000) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      const toast: Toast = { id, type, message, duration };

      setToasts((prev) => [...prev, toast]);

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }
    },
    [dismiss]
  );

  const success = useCallback(
    (message: string, duration?: number) => showToast('success', message, duration),
    [showToast]
  );

  const error = useCallback(
    (message: string, duration?: number) => showToast('error', message, duration),
    [showToast]
  );

  const warning = useCallback(
    (message: string, duration?: number) => showToast('warning', message, duration),
    [showToast]
  );

  const info = useCallback(
    (message: string, duration?: number) => showToast('info', message, duration),
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{ showToast, success, error, warning, info, dismiss }}
    >
      {children}

      {/* Toast Container - Top Right */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <div key={toast.id} className="pointer-events-auto">
              <ToastItem toast={toast} onDismiss={dismiss} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
