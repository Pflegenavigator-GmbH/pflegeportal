// src/proxy.ts

import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';

import { routing } from '@/src/i18n/routing';
import { PREVIEW_COOKIE_NAME, verifyPreviewToken } from '@/src/lib/preview/preview-auth';
import { handleApiRequest } from '@/src/lib/redis/middleware-api';

const intlMiddleware = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const previewProtectionEnabled = process.env.PREVIEW_PROTECTION_ENABLED === 'true';

  /*
   * Der Preview-Schutz wird nur auf Deployments aktiviert,
   * auf denen PREVIEW_PROTECTION_ENABLED=true gesetzt wurde.
   */
  if (previewProtectionEnabled) {
    const tokenSecret = process.env.PREVIEW_TOKEN_SECRET;

    /*
     * Fail closed:
     *
     * Wenn der Preview-Schutz aktiviert wurde, aber kein Secret
     * konfiguriert ist, darf nicht versehentlich die Website
     * freigegeben werden.
     */
    if (!tokenSecret) {
      console.error('[preview-auth] PREVIEW_TOKEN_SECRET ist nicht konfiguriert.');

      return new NextResponse('Preview protection is not configured correctly.', {
        status: 500,
      });
    }

    const token = request.cookies.get(PREVIEW_COOKIE_NAME)?.value;

    const hasPreviewAccess = token ? await verifyPreviewToken(token, tokenSecret) : false;

    /*
     * Die Login-Seite selbst muss natürlich ohne Session
     * erreichbar sein.
     */
    const isLoginRoute =
      pathname === '/preview-login' ||
      routing.locales.some(
        (locale) =>
          pathname === `/${locale}/preview-login` || pathname === `/${locale}/preview-login/`
      );

    /*
     * Dieser Endpoint muss ebenfalls ohne Session erreichbar sein,
     * weil dort das Passwort geprüft und die Session erzeugt wird.
     */
    const isPreviewLoginApi = pathname === '/api/preview-login';

    /*
     * Maschinelle Aufrufer können den interaktiven Preview-Login
     * nicht durchführen.
     *
     * Der Stripe-Webhook authentifiziert Requests selbst über die
     * Stripe-Signatur und wird deshalb vom Preview-Schutz ausgenommen.
     *
     * Die beiden Prüfrouten ebenso: Sie werden aus dem Container heraus
     * abgefragt (Liveness) und nach einer Auslieferung von der Pipeline
     * (Bereitschaft) — beide ohne Cookie. Eine Weiterleitung auf die
     * Anmeldeseite läse sich dort als „Dienst antwortet nicht" (#177).
     * `/api/health` gibt Caddy nach außen ohnehin nicht frei.
     */
    const isMaschinenEndpunkt =
      pathname === '/api/stripe/webhook' || pathname === '/api/health' || pathname === '/api/live';

    if (!hasPreviewAccess && !isLoginRoute && !isPreviewLoginApi && !isMaschinenEndpunkt) {
      const url = request.nextUrl.clone();

      /*
       * Vorhandene Locale beibehalten:
       *
       * /de/pflegegrad/start
       *        ↓
       * /de/preview-login
       *
       * statt erst über /preview-login umleiten zu müssen.
       */
      const locale = routing.locales.find(
        (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
      );

      url.pathname = locale ? `/${locale}/preview-login` : '/preview-login';

      return NextResponse.redirect(url);
    }
  }

  /*
   * API-Routen:
   * Rate-Limit + Cache, kein Sprach-Routing.
   */
  if (pathname.startsWith('/api/')) {
    try {
      return await handleApiRequest(request);
    } catch (error) {
      console.error('[middleware] API-Pipeline fehlgeschlagen, lasse Anfrage durch:', error);

      return NextResponse.next();
    }
  }

  /*
   * Alle übrigen Seiten:
   * next-intl-Locale-Routing.
   */
  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!_next|_vercel|assets|icons|screenshots|locales|models|.*\\..*).*)', '/'],
};
