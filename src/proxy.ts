// src/proxy.ts
// Globale Middleware: API-Sicherheit (Rate-Limit) + öffentlicher Edge-Cache
// für /api/*, mehrsprachiges Routing (next-intl) für alle Seiten.
import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';

import { routing } from '@/src/i18n/routing';
import { handleApiRequest } from '@/src/lib/redis/middleware-api';

const intlMiddleware = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  // API-Routen: Rate-Limit + Cache, kein Sprach-Routing.
  if (request.nextUrl.pathname.startsWith('/api/')) {
    try {
      return await handleApiRequest(request);
    } catch (error) {
      console.error('[middleware] API-Pipeline fehlgeschlagen, lasse Anfrage durch:', error);
      return NextResponse.next();
    }
  }

  // Alle übrigen Seiten: next-intl-Locale-Routing.
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    '/((?!_next|assets|icons|screenshots|favicon.ico|manifest.json|sw.js|offline.html|vercel.svg|globe.svg|file.svg|window.svg|locales).*)',
    '/',
  ],
};
