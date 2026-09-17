// src/lib/case-code.ts
/**
 * Die eine kanonische Regel für Fallcodes — Format, Normalisierung, Erzeugung.
 *
 * Vorher gab es zwei Muster nebeneinander: `actions/case-session.ts` und
 * `api/case-auth.ts` akzeptierten `^[A-Z0-9][A-Z0-9_-]{3,63}$`, während
 * `billing/entitlement.ts` und die Status-Route auf `^PF-[A-Z0-9]{4}-[A-Z0-9]{4}$`
 * bestanden. Solange nur der Klartext verglichen wurde, fiel das nicht auf.
 * Mit dem HMAC-Suchschlüssel (#153) wird daraus ein Ausschluss: Wer beim
 * Speichern anders normalisiert als beim Suchen, sperrt die Person aus ihrem
 * eigenen Fall aus. Deshalb gibt es diese Regel genau einmal.
 *
 * Bewusst ohne Seiteneffekte, ohne `server-only` und ohne Node-Importe: Auch
 * die Eingabemaske und der Freischaltungs-Cache im Browser normalisieren damit.
 * Alles, was Systemzufall oder den Pepper braucht — Erzeugung und Ableitung des
 * Suchschlüssels —, liegt in `case-code-server.ts`.
 */

/** Das Format, das erzeugt und akzeptiert wird: PF-XXXX-XXXX. */
export const CASE_CODE_PATTERN = /^PF-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

/**
 * Bringt eine Eingabe auf die kanonische Form.
 *
 * @returns den normalisierten Code oder `null`, wenn er dem Format nicht
 *   entspricht. Kein Wegwerfen von Zeichen, kein Erraten: Was nicht passt,
 *   wird abgelehnt statt zurechtgebogen — sonst träfe der Suchschlüssel einen
 *   anderen Fall als den gemeinten.
 */
export function normalizeCaseCode(eingabe: string | null | undefined): string | null {
  if (typeof eingabe !== 'string') return null;

  const normalisiert = eingabe.trim().toUpperCase();
  return CASE_CODE_PATTERN.test(normalisiert) ? normalisiert : null;
}

/** Kurzform für Stellen, die nur prüfen und nicht weiterverarbeiten. */
export function istGueltigerFallcode(eingabe: string | null | undefined): boolean {
  return normalizeCaseCode(eingabe) !== null;
}
