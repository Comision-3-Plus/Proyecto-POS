/**
 * Alert Component - Notifications
 */

import { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertProps {
  children: ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  className?: string;
}

export function Alert({ children, variant = 'info', title, className }: AlertProps) {
  const config = {
    info: {
      icon: Info,
      classes: 'bg-blue-50 border-blue-200 text-blue-900',
      iconClasses: 'text-blue-500',
    },
    success: {
      icon: CheckCircle2,
      classes: 'bg-success-50 border-success-200 text-success-900',
      iconClasses: 'text-success-500',
    },
    warning: {
      icon: AlertCircle,
      classes: 'bg-warning-50 border-warning-200 text-warning-900',
      iconClasses: 'text-warning-500',
    },
    danger: {
      icon: XCircle,
      classes: 'bg-danger-50 border-danger-200 text-danger-900',
      iconClasses: 'text-danger-500',
    },
  };

  const { icon: Icon, classes, iconClasses } = config[variant];

  return (
    <div className={cn('flex items-start gap-3 p-4 rounded-xl border', classes, className)}>
      <Icon className={cn('w-5 h-5 flex-shrink-0', iconClasses)} />
      <div className="flex-1">
        {title && <p className="font-bold mb-1">{title}</p>}
        <div className="text-sm">{children}</div>
      </div>
    </div>
  );
}
