// src/lib/redis/middleware-api.ts
import { NextRequest, NextResponse } from 'next/server';

import { getClientIp } from '@/src/lib/api/rate-limit';

import { cacheSchluessel, istCachebar, leseCache } from './edge-cache';
import { rateLimit } from './rate-limit-edge';

/**
 * API-Pipeline der Edge-Middleware: Rate-Limit vor allem anderen, danach ein
 * Cache-Treffer für freigegebene öffentliche GET-Routen.
 *
 * Ausgelagert aus der Middleware, damit die Logik ohne Next-Runtime testbar
 * ist. Gibt immer die zu sendende Antwort zurück — entweder einen Kurzschluss
 * (429 oder Cache-HIT) oder ein `next()` mit Rate-Limit-Headern.
 */
export async function handleApiRequest(request: NextRequest): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl;
  const ip = getClientIp(request);

  // 1. Rate-Limit — greift vor jeder Weiterverarbeitung, damit eine geblockte
  //    Anfrage weder Cache noch Route erreicht.
  const limit = await rateLimit(ip);
  const rateHeaders = {
    'X-RateLimit-Limit': String(limit.limit),
    'X-RateLimit-Remaining': String(limit.verbleibend),
    'X-RateLimit-Reset': String(limit.reset),
  };

  if (!limit.erlaubt) {
    const retryNach = Math.max(0, Math.ceil((limit.reset - Date.now()) / 1000));
    return NextResponse.json(
      { success: false, error: { code: 'RATE_LIMITED', message: 'Zu viele Anfragen.' } },
      {
        status: 429,
        headers: { ...rateHeaders, 'Retry-After': String(retryNach) },
      }
    );
  }

  // 2. Cache-Treffer für freigegebene öffentliche GET-Routen. Der Treffer wird
  //    hier bedient, ohne die Route (Function-Invocation) überhaupt zu starten.
  if (request.method === 'GET' && istCachebar(pathname)) {
    const key = cacheSchluessel(pathname, search);
    const treffer = await leseCache(key);
    if (treffer) {
      return new NextResponse(treffer.body, {
        status: treffer.status,
        headers: {
          ...rateHeaders,
          'Content-Type': treffer.contentType,
          'X-Cache': 'HIT',
        },
      });
    }
  }

  // 3. Durchreichen; die Route (bzw. deren withEdgeCache-Wrapper) verarbeitet
  //    weiter und schreibt bei einem Miss selbst in den Cache.
  return NextResponse.next({ headers: rateHeaders });
}
