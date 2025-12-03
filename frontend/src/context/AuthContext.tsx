/**
 * Auth Context & Hook
 * Manejo centralizado de autenticación
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { authService } from '@/services/auth.service';
import { User } from '@/types/api';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { error: showError } = useToast();

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          const currentUser = await authService.me();
          setUser(currentUser);
        } catch (err) {
          console.error('Failed to fetch current user:', err);
          authService.logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });
      setUser({
        ...response.user,
        rol: response.user.rol as 'owner' | 'cajero' | 'admin' | 'vendedor' | 'encargado' | 'supervisor' | 'gerente_regional',
        is_active: true,
        created_at: new Date().toISOString(),
        tienda: response.user.tienda,
      });
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Error al iniciar sesión';
      showError(message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
      // Force logout even on error
      authService.logout();
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const currentUser = await authService.me();
      setUser(currentUser);
    } catch (err) {
      console.error('Failed to refresh user:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
