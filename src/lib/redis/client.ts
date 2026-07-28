// src/lib/redis/client.ts
/**
 * Zentraler Upstash-Redis-Client für die Edge-Middleware.
 *
 * HTTP-basiert (kein TCP) und damit Edge-Runtime-kompatibel. Der Client ist
 * bewusst optional: Fehlen die Zugangsdaten, liefert diese Datei `null`, und
 * die aufrufenden Schichten fallen sauber zurück (Rate-Limit auf In-Memory,
 * Cache wird übersprungen). So bleiben lokale Entwicklung, CI und ein
 * fehlkonfiguriertes Deployment lauffähig, statt hart zu brechen.
 */
import { Redis } from '@upstash/redis';

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

/**
 * Die aktive Redis-Instanz oder `null`, wenn keine Zugangsdaten gesetzt sind.
 * Modulweite Konstante — der Client wird pro Runtime einmal erzeugt.
 */
export const redis: Redis | null = url && token ? new Redis({ url, token }) : null;

/** Ob Redis konfiguriert ist. Für Logging/Diagnose. */
export const istRedisAktiv = redis !== null;
