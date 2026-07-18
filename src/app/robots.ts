// src/app/robots.ts
import type { MetadataRoute } from 'next';

import { getBaseUrl } from '@/src/lib/env';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // API-Endpunkte und der fallbezogene Workflow sind nicht indexierbar
      disallow: ['/api/', '/*/pflegegrad/modul', '/*/pflegegrad/ergebnis', '/*/tagebuch'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
