
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'POS Enterprise',
    short_name: 'POS Enterprise',
    description: 'Sistema profesional de punto de venta, inventario y gestión empresarial.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0B1220',
    theme_color: '#0B1220',
    lang: 'es',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}

