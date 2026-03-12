import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'woopla, spin & win',
    short_name: 'woopla',
    description:
      'Fidélisez vos clients avec une roue de la fortune interactive. Avis Google, loterie, fichier client.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#F88379',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
