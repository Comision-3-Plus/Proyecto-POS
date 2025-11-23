/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'via.placeholder.com'],
  },
  output: 'standalone', // Para Docker
  
  // ⚡ PERFORMANCE: Deshabilitar funciones que causan delays
  reactStrictMode: false, // Evita double-render en desarrollo
  swcMinify: true, // Compilación más rápida
  
  // ⚡ Optimizar chunks de JavaScript
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons', 'recharts', 'lucide-react'],
  },
}

module.exports = nextConfig
