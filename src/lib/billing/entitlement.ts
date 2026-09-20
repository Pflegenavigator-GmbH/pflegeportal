// src/lib/billing/entitlement.ts
/**
 * Freischaltungsstatus eines Falls — clientseitig gebündelt und zwischengespeichert.
 *
 * WICHTIG — Sicherheitsrahmen:
 * Dieser Cache ist ausschließlich UX: Er entscheidet, ob die Paywall angezeigt
 * wird. Die tatsächliche Durchsetzung bleibt serverseitig bei jedem echten
 * Zugriff (`requireCaseSession` + `isUnlocked` in den API-Routen). Ein
 * veralteter oder manipulierter Cache kann daher nichts freischalten —
 * schlimmstenfalls erscheint die Paywall verspätet oder überflüssig.
 * Deshalb darf dieser Wert nie als alleinige Zugriffsbedingung dienen.
 *
 * Abgefragt wird bewusst `/api/case/status` (Sitzungsprüfung plus ein
 * indizierter Select). Früher lief die Prüfung über einen Dummy-Aufruf an
 * `/api/pdf/generate` — der passierte bei freigeschalteten Fällen die
 * 402-Schranke und startete anschließend Headless Chrome für ein PDF, das
 * sofort verworfen wurde. Genau die zahlenden Nutzer trugen also die
 * höchste Latenz.
 */

/**
 * Gültigkeitsdauer eines Prüfergebnisses. Kurz genug, dass eine frische
 * Zahlung schnell durchschlägt, lang genug, um Klick-Latenz zu vermeiden.
 */
export const FREISCHALTUNG_TTL_MS = 5 * 60 * 1000;

export type Freischaltung =
  /** Fall ist bezahlt oder freigeschaltet. */
  | { status: 'freigeschaltet' }
  /** Eindeutig gesperrt — Paywall anzeigen. */
  | { status: 'gesperrt'; grund: 'nicht-bezahlt' | 'kein-fall' }
  /** Prüfung nicht möglich (z.B. Netzfehler) — weder freigeben noch Paywall. */
  | { status: 'unbekannt' };

/**
 * Zwischengespeichertes Ergebnis der laufenden Sitzung.
 *
 * Seit #135 gibt es keinen Fallcode mehr im Client und damit auch nichts mehr
 * zu unterscheiden: Ein Gerät hat genau eine Sitzung, also genau einen
 * Freischaltungsstatus. Aus der früheren Map je Fallcode wird ein einzelner
 * Eintrag.
 */
let gecached: { ergebnis: Freischaltung; gueltigBis: number } | null = null;

/** Laufende Anfrage — verhindert, dass mehrere Aktionen dieselbe Prüfung anstoßen. */
let laufendeAnfrage: Promise<Freischaltung> | null = null;

/** Verwirft das zwischengespeicherte Ergebnis — etwa nach einer Zahlung. */
export function verwerfeFreischaltung(): void {
  gecached = null;
  laufendeAnfrage = null;
}

async function frageStatusAb(): Promise<Freischaltung> {
  try {
    const antwort = await fetch('/api/case/status', {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });

    if (!antwort.ok) {
      // 401/403/404 bedeuten: keine nutzbare Sitzung.
      // Serverfehler dagegen sagen nichts über den Zahlstatus aus.
      if (antwort.status >= 500) return { status: 'unbekannt' };
      return { status: 'gesperrt', grund: 'kein-fall' };
    }

    const nutzlast = (await antwort.json()) as { data?: { isUnlocked?: unknown } };
    const istFrei = nutzlast?.data?.isUnlocked;

    if (typeof istFrei !== 'boolean') return { status: 'unbekannt' };

    return istFrei ? { status: 'freigeschaltet' } : { status: 'gesperrt', grund: 'nicht-bezahlt' };
  } catch {
    // Netzfehler: bewusst kein Paywall-Signal, sonst blockiert eine kurze
    // Störung zahlende Nutzer.
    return { status: 'unbekannt' };
  }
}

/**
 * Liefert den Freischaltungsstatus der aktuellen Sitzung — aus dem Cache,
 * sofern frisch.
 *
 * Unentschiedene Ergebnisse (`unbekannt`) werden nicht zwischengespeichert,
 * damit eine vorübergehende Störung nicht für Minuten festgeschrieben wird.
 */
export async function ladeFreischaltung(
  optionen: { erzwingeNeuladen?: boolean } = {}
): Promise<Freischaltung> {
  if (!optionen.erzwingeNeuladen) {
    if (gecached && gecached.gueltigBis > Date.now()) return gecached.ergebnis;
    if (laufendeAnfrage) return laufendeAnfrage;
  }

  const anfrage = frageStatusAb()
    .then((ergebnis) => {
      if (ergebnis.status !== 'unbekannt') {
        gecached = { ergebnis, gueltigBis: Date.now() + FREISCHALTUNG_TTL_MS };
      }
      return ergebnis;
    })
    .finally(() => {
      laufendeAnfrage = null;
    });

  laufendeAnfrage = anfrage;
  return anfrage;
}
