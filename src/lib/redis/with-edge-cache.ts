// src/lib/redis/with-edge-cache.ts
import { NextRequest, NextResponse } from 'next/server';

import { cacheSchluessel, istCachebar, schreibeCache } from './edge-cache';

type RouteHandler<Ctx> = (request: NextRequest, context: Ctx) => Promise<NextResponse>;

/**
 * Umhüllt einen GET-Handler, sodass eine erfolgreiche Antwort in den
 * Edge-Cache geschrieben und mit `X-Cache: MISS` markiert wird.
 *
 * Den Treffer (`X-Cache: HIT`) bedient bereits die Middleware, bevor die Route
 * überhaupt aufgerufen wird — dieser Wrapper ist die Schreibseite. Gecacht
 * wird nur, was `edge-cache.ts` freigibt (öffentliche, für alle identische
 * Antworten) und nur bei Status 200.
 *
 * Der Kontext (dynamische Routen-Parameter) wird unverändert durchgereicht.
 */
export function withEdgeCache<Ctx>(handler: RouteHandler<Ctx>): RouteHandler<Ctx> {
  return async (request, context) => {
    const antwort = await handler(request, context);

    const { pathname, search } = new URL(request.url);
    if (request.method !== 'GET' || !istCachebar(pathname) || antwort.status !== 200) {
      return antwort;
    }

    // Das Caching darf die eigentliche Antwort niemals beeinträchtigen: Schlägt
    // hier irgendetwas fehl, wird die unveränderte Original-Antwort geliefert.
    try {
      // Body einmal auslesen; die Original-Antwort ist danach verbraucht und
      // wird neu aufgebaut.
      const body = await antwort.clone().text();
      const contentType = antwort.headers.get('content-type') ?? 'application/json';

      await schreibeCache(pathname, cacheSchluessel(pathname, search), {
        status: 200,
        body,
        contentType,
      });

      const headers = new Headers(antwort.headers);
      headers.set('X-Cache', 'MISS');
      return new NextResponse(body, { status: 200, headers });
    } catch (error) {
      // console statt pino: Wrapper läuft in Edge-Routen (pino ist Node-only).
      console.error('[edge-cache] Antwort konnte nicht gecacht werden:', pathname, error);
      return antwort;
    }
  };
}
