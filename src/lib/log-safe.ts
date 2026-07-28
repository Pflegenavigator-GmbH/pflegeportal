// src/lib/log-safe.ts
/**
 * Bereinigt einen potenziell nutzergesteuerten Wert für die Ausgabe in
 * Klartext-Logs (console.*).
 *
 * Entfernt Steuerzeichen — insbesondere Zeilenumbrüche —, mit denen sich sonst
 * gefälschte Log-Einträge einschleusen ließen (Log Injection, CWE-117), und
 * begrenzt die Länge gegen Log-Flooding. Reine String-Operation, damit auch in
 * der Edge-Runtime nutzbar (wo pino mit seiner Serialisierung fehlt).
 */
export function sauberFuerLog(wert: unknown, maxLaenge = 200): string {
  const text = typeof wert === 'string' ? wert : String(wert);

  // Codepoint-basiert statt Regex mit literalen Steuerzeichen: neutralisiert
  // CR/LF (die eigentliche Injection-Gefahr) und alle übrigen C0-Kontroll-
  // zeichen (U+0000–U+001F) sowie DEL (U+007F).
  let bereinigt = '';
  for (const zeichen of text) {
    const code = zeichen.codePointAt(0) ?? 0;
    bereinigt += code < 0x20 || code === 0x7f ? ' ' : zeichen;
  }

  return bereinigt.length > maxLaenge ? `${bereinigt.slice(0, maxLaenge)}…` : bereinigt;
}
