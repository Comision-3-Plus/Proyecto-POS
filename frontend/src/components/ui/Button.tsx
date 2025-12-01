/**
 * Button Component - Ultra Minimalista
 * Diseño inspirado en Vercel/Linear/Arc
 */

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 focus-ring disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary:
        'bg-gradient-to-br from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 active:scale-[0.98] shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/50 border border-primary-400/30',
      secondary:
        'bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 border border-gray-200 hover:border-gray-300 hover:shadow-md backdrop-blur-xl',
      ghost:
        'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100/60 active:bg-gray-200/60',
      danger:
        'bg-gradient-to-br from-danger-500 to-danger-600 text-white hover:from-danger-600 hover:to-danger-700 active:scale-[0.98] shadow-lg shadow-danger-500/30 hover:shadow-xl hover:shadow-danger-500/50 border border-danger-400/30',
    };

    const sizes = {
      sm: 'h-7 px-2.5 text-xs',
      md: 'h-9 px-3.5 text-sm',
      lg: 'h-10 px-4 text-sm',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-3.5 w-3.5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Cargando...
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
