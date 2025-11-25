/**
 * 🎨 APP PROVIDERS - Composition Root
 * 
 * Centraliza todos los providers de la aplicación:
 * - React Query
 * - Toast notifications
 * - Theme provider (opcional)
 */

'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'sonner';
import { queryClient } from '@/lib/query-client';
import { type ReactNode } from 'react';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Toast notifications */}
      <Toaster 
        position="top-right" 
        richColors 
        expand={false}
        closeButton
      />
      
      {/* App content */}
      {children}
      
      {/* React Query DevTools (solo en desarrollo) */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false} 
          position="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
}
