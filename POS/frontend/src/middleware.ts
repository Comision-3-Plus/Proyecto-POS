import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = ["/login"];
const protectedRoutes = ["/dashboard", "/pos", "/productos", "/caja"];

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const pathname = request.nextUrl.pathname;

  // Si está en login y tiene token, redirigir al dashboard
  if (pathname === "/login" && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Si está en ruta protegida sin token, redirigir a login
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
