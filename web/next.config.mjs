// Todas las llamadas a /api/* se reenvían a la API en Render.
// Así la cookie de sesión queda en el mismo dominio de la web (sin problemas de CORS ni cookies de terceros).
const API_URL = (process.env.API_URL || 'http://127.0.0.1:4000').replace(/\/+$/, '');

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_URL}/api/:path*` }];
  },
};

export default nextConfig;
