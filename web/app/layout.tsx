import type { Metadata, Viewport } from 'next';
import { Providers } from '@/components/Providers';
import { TopBar } from '@/components/TopBar';
import { AccessGate } from '@/components/AccessGate';
import './globals.css';
import '@/styles/host.css';
import '@/styles/scenes-a.css';
import '@/styles/scenes-b.css';
import '@/styles/scenes-2d.css';
import '@/styles/games.css';

export const metadata: Metadata = {
  title: 'QuimicaLearn',
  description: 'Plataforma de química para colegios de Colombia, grados 6° a 11°, alineada a los Estándares y DBA del MEN.',
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CO">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=IBM+Plex+Sans:ital,wght@0,400;0,600;1,400&family=IBM+Plex+Mono:wght@500&display=swap" />
      </head>
      <body>
        <Providers>
          <TopBar />
          <main className="wrap"><AccessGate>{children}</AccessGate></main>
        </Providers>
      </body>
    </html>
  );
}
