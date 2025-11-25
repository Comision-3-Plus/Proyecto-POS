/**
 * Hooks de autenticación
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authService } from '@/services';
import type { LoginRequest, UserInfo } from '@/types/api';
import { toast } from 'sonner';

export const authKeys = {
  currentUser: () => ['auth', 'currentUser'] as const,
};

/**
 * Hook para obtener usuario actual
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.currentUser(),
    queryFn: () => authService.getCurrentUser(),
    enabled: authService.isAuthenticated(),
    retry: false,
    staleTime: Infinity,
  });
}

/**
 * Hook para login
 */
export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginRequest) => authService.login(credentials),
    onSuccess: (data) => {
      // Guardar usuario en caché
      if (data.user) {
        queryClient.setQueryData(authKeys.currentUser(), data.user);
      }
      toast.success('Sesión iniciada exitosamente');
      router.push('/dashboard');
    },
    onError: (error: Error) => {
      toast.error(`Error al iniciar sesión: ${error.message}`);
    },
  });
}

/**
 * Hook para logout
 */
export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return () => {
    authService.logout();
    queryClient.clear();
    router.push('/login');
    toast.info('Sesión cerrada');
  };
}

/**
 * Hook para verificar autenticación
 */
export function useAuth() {
  const { data: user, isLoading } = useCurrentUser();
  const isAuthenticated = authService.isAuthenticated();

  return {
    user,
    isAuthenticated,
    isLoading,
  };
}
