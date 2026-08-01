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
 * ACHTUNG — die Form der ersten beiden `replace`-Aufrufe ist bewusst gewählt
 * und darf nicht „vereinfacht" werden:
 *
 * CodeQL (js/log-injection) erkennt einen Sanitizer nur, wenn der ersetzte
 * Wert konstant auflösbar ist — `StringReplaceCall.getAReplacedString()`
 * castet die Regex-Wurzel auf `RegExpConstant`. Erfüllt ist das nur von einem
 * nackten Literal wie `/\n/g`. Kompaktere Schreibweisen wie `/[\r\n]+/g`
 * (Zeichenklasse unter einem Quantor) oder `/\r|\n/g` (Alternation) sind zur
 * Laufzeit gleichwertig, haben aber keine Konstanten-Wurzel — der Befund
 * bleibt dann bestehen, obwohl der Code korrekt bereinigt. Eine
 * Zeichen-für-Zeichen-Schleife wird ebenfalls nicht erkannt.
 */
export function sauberFuerLog(wert: unknown, maxLaenge = 200): string {
  const text = typeof wert === 'string' ? wert : String(wert);

  const bereinigt = text
    // CR und LF sind die eigentliche Injection-Gefahr — einzeln und global,
    // damit die statische Analyse den Sanitizer erkennt (siehe oben).
    .replace(/\n/g, ' ')
    .replace(/\r/g, ' ')
    // Danach die übrigen C0-Steuerzeichen und DEL (Tab, ESC-Sequenzen …).
    .replace(/[\x00-\x1F\x7F]/g, ' ');

  return bereinigt.length > maxLaenge ? `${bereinigt.slice(0, maxLaenge)}…` : bereinigt;
}
