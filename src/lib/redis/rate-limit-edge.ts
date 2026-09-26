// src/lib/redis/rate-limit-edge.ts
/**
 * Verteiltes Rate-Limit für die Edge-Middleware.
 *
 * Bevorzugt Upstash (Sliding Window, über alle Edge-Instanzen konsistent).
 * Ohne Redis fällt es auf den prozesslokalen In-Memory-Limiter zurück — der
 * ist in verteilten Edge-Umgebungen nur ein Näherungswert, verhindert aber,
 * dass eine fehlende Konfiguration das Limit komplett aushebelt. Dasselbe
 * gilt, wenn Redis konfiguriert, aber gestört ist (`verfuegbarkeit.ts`).
 */
import { Ratelimit } from '@upstash/ratelimit';

import { checkRateLimit } from '@/src/lib/api/rate-limit';

import { redis } from './client';
import { meldeRedisAusfall, meldeRedisErfolg, redisVerfuegbar } from './verfuegbarkeit';

/** 60 Anfragen pro Minute und IP — der im Issue vorgegebene Richtwert. */
export const RATE_LIMIT_MAX = 60;
export const RATE_LIMIT_WINDOW = '1 m' as const;
const WINDOW_MS = 60_000;

/**
 * Ratelimit-Instanz nur bei aktivem Redis. `analytics` bewusst aus: spart
 * einen zusätzlichen Redis-Roundtrip pro Anfrage in der Middleware.
 */
const ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(RATE_LIMIT_MAX, RATE_LIMIT_WINDOW),
      prefix: 'mw:rl',
    })
  : null;

export interface RateLimitErgebnis {
  erlaubt: boolean;
  limit: number;
  verbleibend: number;
  /** Unix-ms, ab wann wieder Anfragen möglich sind. */
  reset: number;
}

/**
 * Prüft das Limit für einen Schlüssel (i.d.R. die Client-IP).
 *
 * Nie werfend: Ein Redis-Ausfall darf keine Anfrage blockieren. Im Fehlerfall
 * greift der In-Memory-Fallback, damit das Limit nicht komplett entfällt.
 */
export async function rateLimit(schluessel: string): Promise<RateLimitErgebnis> {
  // `redisVerfuegbar()` überspringt den Aufruf, solange eine Störung anhält.
  // Ohne diese Abfrage zahlt jede Anfrage erneut für denselben toten Host
  // (#176).
  if (ratelimit && redisVerfuegbar()) {
    try {
      const { success, limit, remaining, reset } = await ratelimit.limit(schluessel);
      meldeRedisErfolg();
      return { erlaubt: success, limit, verbleibend: remaining, reset };
    } catch (error) {
      // Ausweichen auf den lokalen Fallback statt die Anfrage zu verlieren.
      // Die Meldung übernimmt der Verfügbarkeitsschalter — einmal beim Öffnen
      // der Sperre statt bei jeder Anfrage.
      meldeRedisAusfall('rate-limit', error);
    }
  }

  const erlaubt = checkRateLimit(`mw:${schluessel}`, RATE_LIMIT_MAX, WINDOW_MS);
  return {
    erlaubt,
    limit: RATE_LIMIT_MAX,
    verbleibend: erlaubt ? RATE_LIMIT_MAX - 1 : 0,
    reset: Date.now() + WINDOW_MS,
  };
}
