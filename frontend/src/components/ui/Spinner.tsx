/**
 * Spinner/Loader Component
 */

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
}

export function Spinner({ size = 'md', className, text }: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className={cn('animate-spin text-primary-600', sizeClasses[size], className)} />
      {text && <p className="text-sm text-gray-600 font-medium">{text}</p>}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Spinner size="xl" text="Cargando..." />
    </div>
  );
}

export default Spinner;
