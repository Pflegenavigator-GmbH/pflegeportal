// src/app/manifest.ts
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PflegeNavigator EU',
    short_name: 'PflegeNavigator',
    description:
      'Pflegegrad-Orientierung nach SGB XI: Selbsteinschätzung, Pflegetagebuch und Antragshilfen.',
    start_url: '/de',
    display: 'standalone',
    background_color: '#0a1c3a',
    theme_color: '#0a1c3a',
    lang: 'de',
    icons: [
      {
        src: '/icon.png',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  };
}
