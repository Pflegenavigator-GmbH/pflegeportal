// src/lib/log-safe.ts
/**
 * Bereinigt einen potenziell nutzergesteuerten Wert für die Ausgabe in
 * Klartext-Logs (console.*).
 *
 * Entfernt Zeilenumbrüche und weitere Steuerzeichen, mit denen sich sonst
 * gefälschte Log-Einträge einschleusen ließen (Log Injection, CWE-117), und
 * begrenzt die Länge gegen Log-Flooding. Reine String-Operation, damit auch in
 * der Edge-Runtime nutzbar (wo pino mit seiner Serialisierung fehlt).
 *
 * Die Bereinigung erfolgt bewusst über `String.replace` mit einem Regex, der
 * die Zeilenumbrüche erfasst — diese Form wird von der statischen Analyse
 * (CodeQL js/log-injection) als Sanitizer erkannt, eine gleichwertige
 * Zeichen-für-Zeichen-Schleife dagegen nicht.
 */
export function sauberFuerLog(wert: unknown, maxLaenge = 200): string {
  const text = typeof wert === 'string' ? wert : String(wert);

  // CR und LF sind die eigentliche Injection-Gefahr; der zweite Durchlauf
  // neutralisiert Tabs und übrige C0-Steuerzeichen sowie DEL.
  const bereinigt = text.replace(/[\r\n]+/g, ' ').replace(/[\x00-\x1F\x7F]/g, ' ');

  return bereinigt.length > maxLaenge ? `${bereinigt.slice(0, maxLaenge)}…` : bereinigt;
}
