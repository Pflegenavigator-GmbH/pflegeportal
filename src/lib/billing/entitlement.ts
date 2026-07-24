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
 * Abgefragt wird bewusst `/api/cases/[code]/status` (Session-Prüfung plus ein
 * indizierter Select). Früher lief die Prüfung über einen Dummy-Aufruf an
 * `/api/pdf/generate` — der passierte bei freigeschalteten Fällen die
 * 402-Schranke und startete anschließend Headless Chrome für ein PDF, das
 * sofort verworfen wurde. Genau die zahlenden Nutzer trugen also die
 * höchste Latenz.
 */

/** Fallcode-Format, wie es die API erwartet (z.B. PF-1663-4638). */
const FALLCODE_MUSTER = /^PF-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

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

interface CacheEintrag {
  ergebnis: Freischaltung;
  gueltigBis: number;
}

/**
 * Modulweiter Cache: lebt genau eine Seitensitzung lang und wird bei einem
 * vollständigen Seitenwechsel (z.B. Rückkehr aus dem Stripe-Checkout)
 * ohnehin neu aufgebaut.
 */
const cache = new Map<string, CacheEintrag>();

/**
 * Laufende Anfragen je Fallcode. Verhindert, dass mehrere gleichzeitige
 * Aktionen dieselbe Prüfung mehrfach anstoßen.
 */
const laufendeAnfragen = new Map<string, Promise<Freischaltung>>();

export function istGueltigerFallcode(code: string | null | undefined): code is string {
  return typeof code === 'string' && FALLCODE_MUSTER.test(code.trim().toUpperCase());
}

/**
 * Verwirft zwischengespeicherte Ergebnisse.
 *
 * @param caseCode Nur diesen Fall verwerfen; ohne Angabe den gesamten Cache.
 */
export function verwerfeFreischaltung(caseCode?: string | null): void {
  if (!caseCode) {
    cache.clear();
    laufendeAnfragen.clear();
    return;
  }
  const schluessel = caseCode.trim().toUpperCase();
  cache.delete(schluessel);
  laufendeAnfragen.delete(schluessel);
}

async function frageStatusAb(fallcode: string): Promise<Freischaltung> {
  try {
    const antwort = await fetch(`/api/cases/${encodeURIComponent(fallcode)}/status`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });

    if (!antwort.ok) {
      // 401/403/404 bedeuten: kein nutzbarer Zugriff auf diesen Fall.
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
 * Liefert den Freischaltungsstatus eines Falls — aus dem Cache, sofern frisch.
 *
 * Unentschiedene Ergebnisse (`unbekannt`) werden nicht zwischengespeichert,
 * damit eine vorübergehende Störung nicht für Minuten festgeschrieben wird.
 */
export async function ladeFreischaltung(
  caseCode: string | null | undefined,
  optionen: { erzwingeNeuladen?: boolean } = {}
): Promise<Freischaltung> {
  if (!istGueltigerFallcode(caseCode)) {
    return { status: 'gesperrt', grund: 'kein-fall' };
  }

  const fallcode = caseCode.trim().toUpperCase();

  if (!optionen.erzwingeNeuladen) {
    const gecached = cache.get(fallcode);
    if (gecached && gecached.gueltigBis > Date.now()) return gecached.ergebnis;

    const laufend = laufendeAnfragen.get(fallcode);
    if (laufend) return laufend;
  }

  const anfrage = frageStatusAb(fallcode)
    .then((ergebnis) => {
      if (ergebnis.status !== 'unbekannt') {
        cache.set(fallcode, { ergebnis, gueltigBis: Date.now() + FREISCHALTUNG_TTL_MS });
      }
      return ergebnis;
    })
    .finally(() => {
      laufendeAnfragen.delete(fallcode);
    });

  laufendeAnfragen.set(fallcode, anfrage);
  return anfrage;
}
