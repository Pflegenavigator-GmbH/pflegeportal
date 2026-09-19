// src/proxy.ts

import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';

import { routing } from '@/src/i18n/routing';
import { handleApiRequest } from '@/src/lib/redis/middleware-api';

const intlMiddleware = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const previewProtectionEnabled = process.env.PREVIEW_PROTECTION_ENABLED === 'true';

  /*
   * Preview-Schutz nur ausführen, wenn er für die jeweilige
   * Deployment-Umgebung aktiviert wurde.
   */
  if (previewProtectionEnabled) {
    const hasPreviewAccess = request.cookies.get('preview-access')?.value === 'allowed';

    const isLoginRoute =
      pathname === '/preview-login' ||
      routing.locales.some(
        (locale) =>
          pathname === `/${locale}/preview-login` || pathname === `/${locale}/preview-login/`
      );

    /*
     * Dieser Endpoint muss ohne Preview-Cookie erreichbar sein,
     * da dort das Passwort geprüft wird.
     */
    const isPreviewLoginApi = pathname === '/api/preview-login';

    /*
     * Maschinelle Aufrufer haben kein Cookie und können sich auch keines
     * holen. Stripe beantwortet eine Weiterleitung mit „zugestellt" — die
     * Zahlung bliebe unverbucht, und es fiele erst bei der Abrechnung auf.
     * Die Route prüft die Stripe-Signatur selbst; die Sperre trägt hier
     * nichts bei.
     */
    const isMaschinenEndpunkt = pathname === '/api/stripe/webhook';

    if (!hasPreviewAccess && !isLoginRoute && !isPreviewLoginApi && !isMaschinenEndpunkt) {
      const url = request.nextUrl.clone();

      const locale = routing.locales.find(
        (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
      );

      url.pathname = locale ? `/${locale}/preview-login` : '/preview-login';

      return NextResponse.redirect(url);
    }
  }

  // API-Routen: Rate-Limit + Cache, kein Sprach-Routing.
  if (pathname.startsWith('/api/')) {
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
  matcher: ['/((?!_next|_vercel|assets|icons|screenshots|locales|models|.*\\..*).*)', '/'],
};
