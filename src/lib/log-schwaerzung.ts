// src/lib/log-schwaerzung.ts
/**
 * Schwärzt Fallcodes in allem, was in ein Protokoll geht.
 *
 * Der Fallcode ist ein Bearer Credential: Wer ihn kennt, hat die Fallakte.
 * In einem Protokoll hat er deshalb nichts verloren — weder in den
 * Laufzeit-Logs noch in `system_logs` (Issue #145).
 *
 * Diese Schwärzung ist die ZWEITE Verteidigungslinie. Die erste ist, den Code
 * gar nicht erst zu übergeben; wo ein Fallbezug gebraucht wird, gehört die
 * `case_id` ins Log. Die zweite Linie gibt es, weil eine schlüsselbasierte
 * Redaktion konstruktionsbedingt lückenhaft ist: Der Code stand an 32 Stellen
 * unter wechselnden Feldnamen (`caseCode`, `key`, `betreff`, …) und
 * zusätzlich in Fehlermeldungstexten. Ein Muster über den fertigen Text
 * erwischt ihn unabhängig davon, wo er steht.
 *
 * Grenze: Erkannt wird das heute ausgegebene Format `PF-XXXX-XXXX`.
 * `case-auth.ts` lässt ein weiteres, großzügigeres Format zu; ob Codes in
 * diesem Format tatsächlich existieren, klärt die Bestandsprüfung in Phase B
 * von #145. Bis dahin gilt für solche Codes allein die erste Linie.
 *
 * Reine String-Operation, damit auch in der Edge-Runtime nutzbar.
 */

/**
 * Bewusst ohne Wortgrenzen: `\b` gilt `_` als Wortzeichen, sodass etwa
 * `check_code=PF-…` in manchen Schreibweisen durchrutschen würde. Zu viel zu
 * schwärzen ist harmlos, zu wenig nicht.
 */
const FALLCODE_IM_TEXT = /PF-[A-Z0-9]{4}-[A-Z0-9]{4}/gi;

/** Ersatzwert. Enthält keine JSON-Sonderzeichen, damit geschwärztes JSON gültig bleibt. */
export const FALLCODE_ERSATZ = 'PF-****-****';

export function schwaerzeFallcodes(text: string): string {
  return text.replace(FALLCODE_IM_TEXT, FALLCODE_ERSATZ);
}

/**
 * Schwärzt einen JSON-fähigen Wert vollständig, samt aller verschachtelten
 * Zeichenketten. Der Umweg über `JSON.stringify` ist gewollt: Er erzwingt
 * zugleich die Serialisierbarkeit, die `system_logs.metadata` ohnehin
 * verlangt, und erfasst jede Ebene ohne eigene Rekursion.
 */
export function schwaerzeFallcodesInJson<T>(wert: T): T {
  if (wert === undefined) return wert;
  return JSON.parse(schwaerzeFallcodes(JSON.stringify(wert))) as T;
}
