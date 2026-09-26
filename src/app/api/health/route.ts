// src/app/api/health/route.ts
import { NextResponse } from 'next/server';

import { logger } from '@/src/lib/logger';
import { warteschlangeZustand } from '@/src/lib/pdf/warteschlange';
import { redisZustand } from '@/src/lib/redis/verfuegbarkeit';
import { createAdminSupabaseClient } from '@/src/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Bereitschaftsprüfung für den Container-Betrieb (#177).
 *
 * Abgrenzung zu `/api/live`: Dort wird nur geprüft, ob der Prozess läuft —
 * das ist die Liveness-Prüfung des Containers, und sie darf von nichts
 * abhängen, das außerhalb liegt. Ein Neustart wegen einer Störung bei
 * Supabase würde die Störung nicht beheben, sondern nur die Anwendung
 * mitreißen.
 *
 * Diese Route beantwortet die andere Frage: Kann der Container seine Arbeit
 * tun? Sie prüft die Abhängigkeiten und wird nach einer Auslieferung abgefragt,
 * bevor sie als geglückt gilt (#178).
 *
 * Sie ist NICHT für die Öffentlichkeit bestimmt: Caddy gibt `/api/health`
 * nach außen nicht frei. Der Grund steht bei `ratenspeicher` — die Auskunft,
 * dass die Ratenbegrenzung gerade nur prozesslokal wirkt, hilft niemandem
 * außer jemandem, der Fallcodes durchprobiert.
 */

/** Ab wann die Datenbank als nicht erreichbar gilt. */
const DATENBANK_ZEITLIMIT_MS = 3000;

interface DienstZustand {
  ok: boolean;
  dauerMs: number;
  fehler?: string;
}

/**
 * Fragt die Datenbank, ohne Daten zu lesen: `head` liefert nur die Kopfzeilen,
 * keine Zeilen. Bewusst über den Server-Client — geprüft werden soll, ob die
 * Zugangsdaten, die dieser Container beim Start bekommen hat, tatsächlich
 * funktionieren. Genau das ist nach einer Auslieferung die offene Frage.
 */
async function pruefeDatenbank(): Promise<DienstZustand> {
  const start = Date.now();

  try {
    const supabase = createAdminSupabaseClient();
    const { error } = await supabase
      .from('products')
      .select('id', { head: true, count: 'exact' })
      .limit(1)
      .abortSignal(AbortSignal.timeout(DATENBANK_ZEITLIMIT_MS));

    if (error) throw error;

    return { ok: true, dauerMs: Date.now() - start };
  } catch (error) {
    // Die ausführliche Meldung gehört ins Protokoll, nicht in die Antwort:
    // Sie kann Host und Konfiguration enthalten.
    logger.error({ error }, 'Health-Check: Datenbank nicht erreichbar');

    return {
      ok: false,
      dauerMs: Date.now() - start,
      fehler: 'nicht erreichbar',
    };
  }
}

export async function GET(): Promise<Response> {
  const datenbank = await pruefeDatenbank();

  /*
   * Einschränkung, die man kennen muss, um die Antwort richtig zu lesen:
   *
   * Next bündelt `proxy.ts` getrennt von den Routen. Beide haben deshalb ihre
   * eigene Kopie des Verfügbarkeitsschalters (#176) — im Container mit einem
   * toten Upstash-Host nachgemessen: zwei Meldungen `[redis][degradiert]`,
   * eine je Bündel. Was hier steht, ist der Stand der Routen-Seite.
   *
   * Daraus folgt: `nutzbar: false` ist ein belastbarer Befund — der Speicher
   * ist gestört. `nutzbar: true` heißt nur, dass die Routen-Seite noch keinen
   * Fehlschlag gesehen hat; die Ratenbegrenzung im Proxy kann trotzdem längst
   * auf den prozesslokalen Zähler ausgewichen sein. Der verlässliche Hinweis
   * dafür bleibt die Protokollzeile.
   */
  const speicher = redisZustand();

  /*
   * Drei Stufen statt zwei:
   *
   * - `fehler`  → ohne Datenbank kann die Anwendung nichts. Antwort 503, damit
   *               eine Auslieferung daran scheitert, statt einen kaputten
   *               Stand als erfolgreich zu melden.
   * - `degradiert` → der Ratenspeicher ist konfiguriert, aber gestört (#176).
   *               Die Anwendung arbeitet weiter, die Begrenzung wirkt nur
   *               prozesslokal. Antwort 200: Das ist ein Fall für die
   *               Beobachtung, nicht für einen Neustart.
   * - `ok`
   */
  const degradiert = speicher.konfiguriert && !speicher.nutzbar;
  const status = !datenbank.ok ? 'fehler' : degradiert ? 'degradiert' : 'ok';

  return NextResponse.json(
    {
      status,
      zeit: new Date().toISOString(),
      laufzeitSekunden: Math.round(process.uptime()),
      dienste: {
        datenbank,
        ratenspeicher: speicher,
        pdf: warteschlangeZustand(),
      },
    },
    {
      status: datenbank.ok ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }
  );
}
