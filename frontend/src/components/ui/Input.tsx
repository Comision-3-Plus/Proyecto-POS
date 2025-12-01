/**
 * Input Component - Ultra Minimalista
 * Diseño Vercel/Linear con label flotante
 */

import { InputHTMLAttributes, forwardRef, useState } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helpText, id, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue);

    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="w-full">
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'peer w-full h-10 px-3 pt-4 pb-1',
              'bg-white/80 backdrop-blur-sm border border-gray-200/80 rounded-lg',
              'text-gray-900 text-sm',
              'transition-all duration-150',
              'focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white focus:shadow-lg focus:shadow-primary-500/10',
              'hover:border-gray-300/80',
              error && 'border-danger-500 focus:ring-danger-500/20 focus:border-danger-500',
              'disabled:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60',
              className
            )}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            onChange={(e) => {
              setHasValue(!!e.target.value);
              props.onChange?.(e);
            }}
            {...props}
          />
          {label && (
            <label
              htmlFor={inputId}
              className={cn(
                'absolute left-3 text-gray-500 pointer-events-none',
                'transition-all duration-150',
                isFocused || hasValue
                  ? 'top-1 text-[10px] font-medium'
                  : 'top-2.5 text-sm',
                error && 'text-danger-500'
              )}
            >
              {label}
            </label>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-xs text-danger-500 flex items-center gap-1">
            <svg
              className="w-3 h-3"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}
        {helpText && !error && (
          <p className="mt-1.5 text-xs text-gray-500">{helpText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
