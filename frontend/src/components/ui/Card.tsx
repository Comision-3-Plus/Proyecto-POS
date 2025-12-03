/**
 * Card Component - Enterprise Grade
 * Componente de card flexible con variantes
 */

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export function Card({ children, className, hover = false, padding = 'md', onClick }: CardProps) {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const Component = hover || onClick ? motion.div : 'div';

  return (
    <Component
      onClick={onClick}
      whileHover={hover ? { y: -4, scale: 1.01 } : undefined}
      className={cn(
        'bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-xl shadow-gray-200/30',
        hover && 'cursor-pointer hover:shadow-2xl hover:shadow-gray-300/40 transition-all duration-500',
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </Component>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('mb-6', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={cn('text-base font-bold text-gray-900', className)}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn(className)}>
      {children}
    </div>
  );
}
