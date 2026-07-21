// src/lib/escape.ts
/**
 * Escaped die fünf HTML-Sonderzeichen. Für jede Interpolation von
 * nutzergelieferten Werten in HTML-Templates (PDF, E-Mail) zu verwenden.
 */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Wie escapeHtml, wandelt aber Zeilenumbrüche in <br> (nach dem Escaping). */
export function escapeHtmlWithBreaks(value: unknown): string {
  return escapeHtml(value).replace(/\r?\n/g, '<br>');
}
