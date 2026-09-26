// src/lib/redis/client.ts
/**
 * Zentraler Upstash-Redis-Client für die Edge-Middleware.
 *
 * HTTP-basiert (kein TCP) und damit Edge-Runtime-kompatibel. Der Client ist
 * bewusst optional: Fehlen die Zugangsdaten, liefert diese Datei `null`, und
 * die aufrufenden Schichten fallen sauber zurück (Rate-Limit auf In-Memory,
 * Cache wird übersprungen). So bleiben lokale Entwicklung, CI und ein
 * fehlkonfiguriertes Deployment lauffähig, statt hart zu brechen.
 *
 * Ist der Dienst konfiguriert, aber nicht erreichbar, greift zusätzlich der
 * Verfügbarkeitsschalter in `verfuegbarkeit.ts` (#176).
 */
import { Redis } from '@upstash/redis';

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

/**
 * Wie lange ein einzelner Aufruf höchstens dauern darf.
 *
 * Ein nicht auflösender Host scheitert schnell. Ein stummer Host — Paketfilter,
 * halb offene Verbindung — hängt dagegen ohne Zeitlimit, und zwar in der
 * Middleware vor der eigentlichen Route. Eine Sekunde ist großzügig für einen
 * Aufruf, der im Normalfall im zweistelligen Millisekundenbereich liegt.
 */
const ZEITLIMIT_MS = 1000;

/**
 * Die aktive Redis-Instanz oder `null`, wenn keine Zugangsdaten gesetzt sind.
 * Modulweite Konstante — der Client wird pro Runtime einmal erzeugt.
 */
export const redis: Redis | null =
  url && token
    ? new Redis({
        url,
        token,
        /*
         * Der Standard sind sechs Versuche mit exponentiell wachsenden Pausen
         * (0,05 s / 0,14 s / 0,37 s / 1,0 s / 2,7 s). Bei einem nicht
         * erreichbaren Host wartet damit JEDE API-Anfrage über vier Sekunden,
         * bevor der Fehler überhaupt bei uns ankommt — das war die Ursache der
         * Latenz in #176.
         *
         * Ein einzelner Wiederholversuch ohne Pause fängt das kurze Zucken
         * einer Verbindung ab. Alles darüber ist hier falsch investiert: Der
         * Fallback ist prozesslokal und sofort da, und der
         * Verfügbarkeitsschalter wiederholt ohnehin nach der Sperrzeit.
         */
        retry: { retries: 1, backoff: () => 0 },
        /*
         * Funktion statt festem Signal: Ein einmal erzeugtes AbortSignal wäre
         * nach dem ersten Zeitablauf dauerhaft abgebrochen und würde jeden
         * weiteren Aufruf sofort scheitern lassen. So bekommt jeder Aufruf
         * sein eigenes.
         */
        signal: () => AbortSignal.timeout(ZEITLIMIT_MS),
      })
    : null;

/** Ob Redis konfiguriert ist. Für Logging/Diagnose. */
export const istRedisAktiv = redis !== null;
