// src/lib/case-storage.ts
const CASE_CODE_KEY = 'case_code';
export const CASE_CODE_EVENT = 'case-code-changed';

/**
 * Alle localStorage-Schlüssel, die zu EINEM Fall gehören.
 *
 * Diese Daten haben Gesundheitsbezug (Art. 9 DSGVO) — Pflegegrad-Ergebnis,
 * Widerspruchsentwürfe, Zielgruppe — oder sind der Zugangsschlüssel zum Fall.
 * Sie dürfen einen Fallwechsel nicht überleben und erst recht nicht auf einem
 * geteilten Rechner zurückbleiben, nachdem der Nutzer den Fall geschlossen hat.
 *
 * Wer einen neuen fallbezogenen Schlüssel einführt, trägt ihn HIER ein.
 * Sonst bleibt er beim Aufräumen liegen — still und unbemerkt.
 */
/** Ermittelter Pflegegrad. Zugriff nur über `lib/pflegegrad/ergebnis-storage`. */
export const ERGEBNIS_KEY = 'pflegegrad-ergebnis';

const FALL_DATEN_KEYS = [
  CASE_CODE_KEY,
  ERGEBNIS_KEY, // Ermittelter Pflegegrad samt Modulpunkten
  'widersprueche_pipeline', // Widerspruchsentwürfe inkl. Bescheiddaten
  'pflege_zielgruppe', // erwachsen | kind
] as const;

/*
 * Bewusst NICHT in der Liste, weil geräte- und nicht fallbezogen:
 * `user_consent` (die Datenschutz-Entscheidung selbst — ein Widerruf soll
 * bestehen bleiben), `pf-a11y` (Kontrast, Schriftgröße — sie zu löschen
 * träfe gerade Menschen, die darauf angewiesen sind) und
 * `pflegenavigator-language` (Sprachwahl).
 */

function entferneFallDaten(): void {
  for (const schluessel of FALL_DATEN_KEYS) {
    localStorage.removeItem(schluessel);
  }
}

/**
 * Schreibt den Fallcode in den localStorage und benachrichtigt alle
 * Komponenten im selben Tab (Custom Event) sowie andere Tabs (storage-Event
 * feuert der Browser automatisch).
 *
 * Wechselt der Fall, werden die Daten des vorherigen Falls zuerst entfernt.
 * Ohne das übernähme der neue Fall das Ergebnis des alten: Die Startseite
 * leitet auf die Ergebnisseite um, sobald `pflegegrad-ergebnis` gesetzt ist —
 * unabhängig davon, zu welchem Fall der Eintrag gehört. Das wäre nicht nur
 * ein Datenleck zwischen zwei Personen, sondern schlicht ein falsches
 * Ergebnis.
 */
export function storeCaseCode(code: string): void {
  const neuerCode = code.trim().toUpperCase();

  if (localStorage.getItem(CASE_CODE_KEY) !== neuerCode) {
    entferneFallDaten();
  }

  localStorage.setItem(CASE_CODE_KEY, neuerCode);
  window.dispatchEvent(new Event(CASE_CODE_EVENT));
}

/**
 * Entfernt sämtliche Spuren des Falls aus diesem Browser.
 *
 * Gegenstück zum Schließen eines Falls. Der Server entwertet dabei das
 * HTTP-only-Cookie (`clearCaseSession`), hier verschwindet der lokale Teil.
 * Beides gehört zusammen — eines allein ließe die Sitzung halb offen.
 */
export function clearCaseData(): void {
  entferneFallDaten();
  window.dispatchEvent(new Event(CASE_CODE_EVENT));
}

export function getStoredCaseCode(): string | null {
  if (typeof window === 'undefined') return null; // SSR-sicher
  const code = localStorage.getItem(CASE_CODE_KEY);
  return code ? code.toUpperCase() : null;
}
