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
    // Ausgenommen: Next-Interna, statische Verzeichnisse und ALLE Dateien mit
    // Endung (`.*\..*`). Die frühere Aufzählung einzelner Dateinamen war
    // fragil: Neue Assets (z.B. /models/robot.glb) liefen ungewollt durch das
    // Locale-Routing und wurden auf /de/... umgeleitet → 404.
    // /api/* bleibt bewusst eingeschlossen (Rate-Limit + Cache).
    '/((?!_next|_vercel|assets|icons|screenshots|locales|models|.*\\..*).*)',
    '/',
  ],
};
