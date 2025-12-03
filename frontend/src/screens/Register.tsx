/**
 * Register Screen - Enterprise Design
 * Registro público con creación automática de tienda
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Store, User, Mail, Lock, FileText, ShoppingBag } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { authService } from '@/services/auth.service';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    dni: '',
    password: '',
    confirm_password: '',
    tienda_nombre: '',
    tienda_rubro: 'indumentaria',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (formData.password !== formData.confirm_password) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.register({
        full_name: formData.full_name,
        email: formData.email,
        dni: formData.dni,
        password: formData.password,
        tienda_nombre: formData.tienda_nombre,
        tienda_rubro: formData.tienda_rubro,
      });

      // Guardar token y redirigir
      localStorage.setItem('token', response.access_token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error en el registro');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-cyan-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-2xl shadow-primary-500/40">
              <Store className="w-10 h-10 text-white" />
            </div>
          </div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight">
            Crea tu tienda
          </h2>
          <p className="mt-3 text-base text-gray-600">
            Registra tu negocio y empieza a gestionar tus ventas hoy
          </p>
        </div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl shadow-gray-200/30 p-8"
        >
          {error && (
            <Alert variant="danger" className="mb-6">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Datos Personales */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                Tus Datos
              </h3>

              <div>
                <label htmlFor="full_name" className="block text-sm font-bold text-gray-700 mb-2">
                  Nombre Completo
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={handleChange}
                    className="w-full h-12 pl-14 pr-4 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                    placeholder="Juan Pérez"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-gray-600" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full h-12 pl-14 pr-4 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                      placeholder="tu@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="dni" className="block text-sm font-bold text-gray-700 mb-2">
                    DNI/CUIT
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-gray-600" />
                    </div>
                    <input
                      id="dni"
                      name="dni"
                      type="text"
                      required
                      value={formData.dni}
                      onChange={handleChange}
                      className="w-full h-12 pl-14 pr-4 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                      placeholder="12345678"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-2">
                    Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <Lock className="w-4 h-4 text-gray-600" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full h-12 pl-14 pr-4 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                      placeholder="Mínimo 8 caracteres"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="confirm_password" className="block text-sm font-bold text-gray-700 mb-2">
                    Confirmar Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <Lock className="w-4 h-4 text-gray-600" />
                    </div>
                    <input
                      id="confirm_password"
                      name="confirm_password"
                      type="password"
                      required
                      value={formData.confirm_password}
                      onChange={handleChange}
                      className="w-full h-12 pl-14 pr-4 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                      placeholder="Repetir contraseña"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Datos de la Tienda */}
            <div className="space-y-4 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                Tu Tienda
              </h3>

              <div>
                <label htmlFor="tienda_nombre" className="block text-sm font-bold text-gray-700 mb-2">
                  Nombre del Negocio
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                    <Store className="w-4 h-4 text-primary-600" />
                  </div>
                  <input
                    id="tienda_nombre"
                    name="tienda_nombre"
                    type="text"
                    required
                    value={formData.tienda_nombre}
                    onChange={handleChange}
                    className="w-full h-12 pl-14 pr-4 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                    placeholder="Ej: Boutique La Moda"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="tienda_rubro" className="block text-sm font-bold text-gray-700 mb-2">
                  Rubro
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4 text-primary-600" />
                  </div>
                  <select
                    id="tienda_rubro"
                    name="tienda_rubro"
                    value={formData.tienda_rubro}
                    onChange={handleChange}
                    className="w-full h-12 pl-14 pr-4 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                  >
                    <option value="indumentaria">Indumentaria / Ropa</option>
                    <option value="farmacia">Farmacia</option>
                    <option value="verduleria">Verdulería</option>
                    <option value="panaderia">Panadería</option>
                    <option value="ferreteria">Ferretería</option>
                    <option value="libreria">Librería</option>
                    <option value="otros">Otros</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full shadow-2xl shadow-primary-500/40"
              disabled={isLoading}
            >
              {isLoading ? 'Creando tu tienda...' : 'Crear Mi Tienda'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿Ya tienes cuenta?{' '}
              <Link
                to="/login"
                className="font-bold text-primary-600 hover:text-primary-700 transition-colors"
              >
                Inicia sesión
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Footer Info */}
        <div className="text-center text-xs text-gray-500">
          <p>
            Al registrarte, aceptas nuestros{' '}
            <a href="#" className="text-primary-600 hover:underline">
              Términos y Condiciones
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
