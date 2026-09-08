// src/app/sitemap.ts
import type { MetadataRoute } from 'next';

import { defaultLocale, locales } from '@/src/i18n/config';
import { getBaseUrl } from '@/src/lib/env';

// Nur öffentliche, indexierbare Seiten — der Pflegegrad-Workflow und alle
// fallbezogenen Seiten gehören nicht in die Sitemap.
const PUBLIC_PATHS = [
  '',
  '/pflegegrad/start',
  '/faq',
  '/hilfe',
  '/philosophie',
  '/presse',
  '/unterstuetzung',
  '/widerspruch',
  '/em-rente',
  '/kombileistungen',
  '/datenschutz',
  '/impressum',
  '/agb',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();

  return PUBLIC_PATHS.map((path) => ({
    url: `${baseUrl}/${defaultLocale}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' ? ('weekly' as const) : ('monthly' as const),
    priority: path === '' ? 1.0 : 0.7,
    alternates: {
      languages: Object.fromEntries(
        locales.map((locale) => [locale, `${baseUrl}/${locale}${path}`])
      ),
    },
  }));
}
