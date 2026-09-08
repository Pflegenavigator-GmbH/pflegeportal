// src/lib/widerspruch/bescheid-datum.ts
/**
 * Validierung des Bescheiddatums — geteilt zwischen Client und API.
 *
 * Reine Funktionen ohne Seiteneffekte, damit die Regel an genau einer Stelle
 * steht: Das Formular nutzt sie für sofortige Rückmeldung, die API als
 * verbindliche Prüfung. Der Client darf nie die einzige Instanz sein.
 */

/** ISO-Kalenderdatum, wie es `<input type="date">` und Postgres `date` nutzen. */
const ISO_DATUM = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Frühestes plausibles Datum. Die Pflegeversicherung besteht seit 1995;
 * alles davor ist ein Tippfehler, kein Bescheid.
 */
const FRUEHESTES_JAHR = 1995;

/**
 * Grund der Ablehnung als stabiler Schlüssel. Der Client übersetzt ihn über
 * `widerspruch.bescheidDatum.fehler.<code>`; `fehler` bleibt als deutscher
 * Klartext erhalten, weil die API-Antwort und die Logs ihn direkt tragen.
 */
export type DatumFehlerCode = 'format' | 'existiertNicht' | 'zukunft' | 'zuFrueh';

export type DatumPruefung =
  { gueltig: true; wert: string } | { gueltig: false; code: DatumFehlerCode; fehler: string };

/** Lokales ISO-Datum von heute — ohne die UTC-Verschiebung von toISOString(). */
export function heuteAlsIso(referenz: Date = new Date()): string {
  const jahr = referenz.getFullYear();
  const monat = String(referenz.getMonth() + 1).padStart(2, '0');
  const tag = String(referenz.getDate()).padStart(2, '0');
  return `${jahr}-${monat}-${tag}`;
}

/** ISO-Datum vor `tage` Tagen, lokal gerechnet. */
export function isoVorTagen(tage: number, referenz: Date = new Date()): string {
  const datum = new Date(referenz.getFullYear(), referenz.getMonth(), referenz.getDate());
  datum.setDate(datum.getDate() - tage);
  return heuteAlsIso(datum);
}

/**
 * Prüft ein Bescheiddatum auf Format, Existenz und Plausibilität.
 *
 * Ein Bescheid kann nur in der Vergangenheit zugehen — ein Zukunftsdatum
 * würde die Restfrist überschätzen und damit genau den Fehler erzeugen,
 * vor dem der Fristen-Monitor schützen soll.
 */
export function pruefeBescheidDatum(eingabe: unknown, referenz: Date = new Date()): DatumPruefung {
  if (typeof eingabe !== 'string' || !ISO_DATUM.test(eingabe.trim())) {
    return {
      gueltig: false,
      code: 'format',
      fehler: 'Bitte geben Sie ein Datum im Format TT.MM.JJJJ an.',
    };
  }

  const wert = eingabe.trim();
  const [jahr, monat, tag] = wert.split('-').map(Number);
  const datum = new Date(jahr, monat - 1, tag);

  // Überläufe wie 2026-02-31 rollen in JavaScript still weiter.
  const existiert =
    datum.getFullYear() === jahr && datum.getMonth() === monat - 1 && datum.getDate() === tag;
  if (!existiert) {
    return { gueltig: false, code: 'existiertNicht', fehler: 'Dieses Datum gibt es nicht.' };
  }

  if (wert > heuteAlsIso(referenz)) {
    return { gueltig: false, code: 'zukunft', fehler: 'Das Datum liegt in der Zukunft.' };
  }

  if (jahr < FRUEHESTES_JAHR) {
    return { gueltig: false, code: 'zuFrueh', fehler: 'Das Datum liegt zu weit zurück.' };
  }

  return { gueltig: true, wert };
}
