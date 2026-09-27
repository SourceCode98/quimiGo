// Todas las llamadas a /api/* se reenvían a la API en Render.
// Así la cookie de sesión queda en el mismo dominio de la web (sin problemas de CORS ni cookies de terceros).
// En Vercel es obligatoria: sin ella la web no encuentra la API y nadie puede entrar.
if (process.env.VERCEL && !process.env.API_URL) throw new Error('Falta la variable API_URL en Vercel (la URL de Render, ej. https://quimicalearn-api.onrender.com).');
if (process.env.API_URL && !/^https?:\/\//.test(process.env.API_URL)) throw new Error('API_URL debe empezar por https:// (ej. https://quimicalearn-api.onrender.com).');
const API_URL = (process.env.API_URL || 'http://127.0.0.1:4000').trim().replace(/\/+$/, '').replace(/\/api$/, '');

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_URL}/api/:path*` }];
  },
};

export default nextConfig;
