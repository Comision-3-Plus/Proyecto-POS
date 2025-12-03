/**
 * Login Screen - Premium Design
 * Diseño inspirado en Linear/Arc
 */

import { useState, FormEvent } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Store, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (error) {
      // Error toast is handled in AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl mb-4 shadow-lg"
          >
            <Store className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">POS Pro</h1>
          <p className="text-gray-600">Sistema de Punto de Venta Empresarial</p>
        </div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Iniciar Sesión
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              type="email"
              label="Correo Electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="usuario@empresa.com"
            />

            <Input
              type="password"
              label="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
              disabled={!email || !password}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿No tienes cuenta?{' '}
              <Link
                to="/register"
                className="font-bold text-primary-600 hover:text-primary-700 transition-colors"
              >
                Crear mi tienda
              </Link>
            </p>
          </div>

          {/* Demo credentials hint */}
          <div className="mt-4 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Credenciales demo:{' '}
              <code className="bg-gray-100 px-2 py-1 rounded text-primary-600">
                admin@nexuspos.com
              </code>{' '}
              / contraseña:{' '}
              <code className="bg-gray-100 px-2 py-1 rounded text-primary-600">
                admin123
              </code>
            </p>
          </div>
        </motion.div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          © 2024 POS Pro. Sistema multi-tenant con AFIP integrado.
        </p>
      </motion.div>
    </div>
  );
}
