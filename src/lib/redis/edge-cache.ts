// src/lib/redis/edge-cache.ts
/**
 * Edge-Cache für öffentliche GET-Endpunkte.
 *
 * SICHERHEITS-INVARIANTE:
 * Gecacht werden ausschließlich Routen, deren Antwort für JEDEN Aufrufer
 * identisch ist — unabhängig von Session, Cookie oder Auth. Personalisierte
 * oder fallbezogene Endpunkte (alles mit `requireCaseSession`) dürfen NIE
 * hier landen. Ein geteilter Cache über solche Antworten wäre ein
 * Cross-User-Datenleck (die „Cache confusion"-Klasse, gegen die Next zuletzt
 * gehärtet wurde). Deshalb ist die Allowlist hart im Code, nicht per Konfig.
 *
 * Die Aufteilung folgt einer Eigenheit von Next-Middleware: Sie läuft vor der
 * Route und sieht deren Body nicht. Der HIT wird daher in der Middleware
 * bedient (spart die Function-Invocation), der Eintrag aber von der Route
 * geschrieben.
 */
import { redis } from './client';

interface CacheRegel {
  /** Exakter Pfad oder Präfix (mit abschließendem '/'). */
  pfad: string;
  /** Als Präfix statt exakt matchen (z.B. dynamische Segmente). */
  praefix?: boolean;
  /** Lebensdauer in Sekunden. */
  ttl: number;
}

/**
 * Cachebare öffentliche Routen. Bewusst minimal: nur statischer Gesetzestext,
 * der für alle Nutzer gleich ist. Jede Ergänzung MUSS die obige Invariante
 * erfüllen.
 */
const CACHE_REGELN: CacheRegel[] = [
  { pfad: '/api/gesetze', ttl: 3600 },
  { pfad: '/api/gesetze/', praefix: true, ttl: 3600 },
];

export interface GecachteAntwort {
  status: number;
  body: string;
  contentType: string;
}

/** Findet die Cache-Regel für einen Pfad, oder `null`. */
function regelFuer(pathname: string): CacheRegel | null {
  for (const regel of CACHE_REGELN) {
    if (regel.praefix ? pathname.startsWith(regel.pfad) : pathname === regel.pfad) {
      return regel;
    }
  }
  return null;
}

/** Ob dieser Pfad überhaupt cachebar ist. */
export function istCachebar(pathname: string): boolean {
  return regelFuer(pathname) !== null;
}

/**
 * Cache-Schlüssel aus Pfad und Query. Die Parameter werden sortiert, damit
 * `?a=1&b=2` und `?b=2&a=1` denselben Eintrag treffen.
 */
export function cacheSchluessel(pathname: string, search: string): string {
  const params = new URLSearchParams(search);
  params.sort();
  const query = params.toString();
  return `mw:cache:${pathname}${query ? `?${query}` : ''}`;
}

/** Liest einen Eintrag. Nie werfend — ein Cache-Fehler darf nichts blockieren. */
export async function leseCache(key: string): Promise<GecachteAntwort | null> {
  if (!redis) return null;
  try {
    return await redis.get<GecachteAntwort>(key);
  } catch (error) {
    // Sichtbar machen statt still schlucken: signalisiert eine Redis-Störung.
    // console statt pino (Edge-Runtime). Fällt auf "kein Treffer" zurück.
    console.error('[edge-cache] Lesen fehlgeschlagen:', key, error);
    return null;
  }
}

/**
 * Schreibt einen Eintrag mit der TTL der passenden Regel.
 * Nur für cachebare Pfade wirksam; für alles andere ein No-op.
 */
export async function schreibeCache(
  pathname: string,
  key: string,
  antwort: GecachteAntwort
): Promise<void> {
  const regel = regelFuer(pathname);
  if (!redis || !regel) return;
  try {
    await redis.set(key, antwort, { ex: regel.ttl });
  } catch (error) {
    // Best effort, aber nicht lautlos — eine anhaltende Redis-Störung soll
    // in den Logs auffallen. console statt pino (Edge-Runtime).
    console.error('[edge-cache] Schreiben fehlgeschlagen:', key, error);
  }
}
