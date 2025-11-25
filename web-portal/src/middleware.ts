/**
 * 🔒 NEXT.JS MIDDLEWARE - Route Protection
 * 
 * Este middleware protege las rutas de la aplicación:
 * 1. Verifica autenticación para rutas protegidas
 * 2. Redirige a login si no hay token
 * 3. Previene acceso a login si ya está autenticado
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas públicas que NO requieren autenticación
const PUBLIC_ROUTES = ['/login', '/registro'];

// Rutas protegidas que REQUIEREN autenticación
const PROTECTED_ROUTES = ['/dashboard', '/productos', '/ventas', '/pos', '/reportes', '/inventario'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Obtener token de las cookies o headers
  const token = request.cookies.get('nexus_pos_access_token')?.value;
  
  // Verificar si la ruta actual es protegida
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));
  
  // 🔒 Si es ruta protegida y NO hay token, redirigir a login
  if (isProtectedRoute && !token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }
  
  // 🚪 Si es ruta pública (login) y SÍ hay token, redirigir a dashboard
  if (isPublicRoute && token && pathname === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}

// Configurar qué rutas deben pasar por el middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
