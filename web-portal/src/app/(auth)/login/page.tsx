/**
 * 🔐 PÁGINA DE LOGIN - Autenticación
 * 
 * Implementa el flujo completo de autenticación:
 * 1. Form validation con React Hook Form + Zod
 * 2. Login con JWT (hook generado por Orval)
 * 3. Guardar token en localStorage
 * 4. Redirigir a dashboard
 */

'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, ShoppingBag, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { usePostApiV1AuthLogin } from '@/api/generated/endpoints';
import { setAuthToken } from '@/api/custom-instance';

// ==================== VALIDATION SCHEMA ====================

const loginSchema = z.object({
  username: z.string().min(3, 'El usuario debe tener al menos 3 caracteres'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// ==================== COMPONENT ====================

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const reason = searchParams.get('reason');

  // ==================== FORM ====================
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  // ==================== MUTATION ====================
  
  const loginMutation = usePostApiV1AuthLogin({
    mutation: {
      onSuccess: (data) => {
        // ✅ Login exitoso
        toast.success('✅ Login exitoso! Redirigiendo...');
        
        // Guardar token en localStorage
        setAuthToken(data.access_token);
        
        // Guardar info del usuario (opcional)
        if (typeof window !== 'undefined') {
          localStorage.setItem('nexus_pos_user', JSON.stringify({
            username: data.username,
            rol: data.rol,
          }));
        }
        
        // Redirigir
        setTimeout(() => {
          router.push(callbackUrl);
          router.refresh();
        }, 500);
      },
      onError: (error: any) => {
        // ❌ Error de login
        const status = error.response?.status;
        
        if (status === 401) {
          toast.error('Usuario o contraseña incorrectos');
        } else if (status === 403) {
          toast.error('Usuario desactivado. Contacta al administrador.');
        } else {
          toast.error('Error al iniciar sesión. Intenta nuevamente.');
        }
      },
    },
  });

  // ==================== EFFECTS ====================
  
  useEffect(() => {
    if (reason === 'session_expired') {
      toast.warning('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
    }
  }, [reason]);

  // ==================== HANDLERS ====================
  
  const onSubmit = (values: LoginFormValues) => {
    // Crear FormData para OAuth2PasswordRequestForm
    const formData = new FormData();
    formData.append('username', values.username);
    formData.append('password', values.password);
    
    loginMutation.mutate({ data: formData as any });
  };

  // ==================== RENDER ====================

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-indigo-600 p-3 rounded-lg">
              <ShoppingBag className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Nexus POS</CardTitle>
          <CardDescription className="text-center">
            Sistema de Punto de Venta
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {reason === 'session_expired' && (
            <Alert className="mb-4" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Tu sesión ha expirado. Por favor, inicia sesión nuevamente.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Usuario */}
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Usuario
              </label>
              <Input
                id="username"
                type="text"
                placeholder="Ingresa tu usuario"
                {...register('username')}
                disabled={loginMutation.isPending}
                autoComplete="username"
              />
              {errors.username && (
                <p className="text-sm text-red-600">{errors.username.message}</p>
              )}
            </div>

            {/* Contraseña */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Contraseña
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Ingresa tu contraseña"
                {...register('password')}
                disabled={loginMutation.isPending}
                autoComplete="current-password"
              />
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Botón de Login */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
          </form>

          {/* Credenciales de demo */}
          <div className="mt-6 p-3 bg-gray-50 rounded-lg border">
            <p className="text-xs text-gray-600 mb-1">Demo:</p>
            <p className="text-xs font-mono">Usuario: admin | Contraseña: admin123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
