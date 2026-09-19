// src/lib/case-storage.ts
/**
 * Der Fallcode lebt nur noch im Arbeitsspeicher (#135).
 *
 * Bis zum 19.09.2026 stand er unter `case_code` im `localStorage` — lesbar für
 * jedes Skript der Seite und für jeden Mitbenutzer des Rechners, dauerhaft und
 * ohne Ablauf. Die Fortsetzung auf demselben Gerät trägt jetzt die Sitzung
 * (HttpOnly-Cookie mit undurchsichtigem Nachweis); der Code selbst wird nur
 * noch gehalten, damit die Person ihn nach Eingabe oder Erzeugung **sehen**
 * kann.
 *
 * Folge, bewusst in Kauf genommen: Nach einem Neuladen ist er weg. Die Seite
 * funktioniert weiter, weil die Sitzung trägt — sie zeigt dann nur keine
 * Fallnummer mehr an. Serverseitig lässt er sich nicht nachschlagen, dort
 * steht seit #153 ausschließlich sein Hash.
 */

/** Feuert, wenn sich der angezeigte Fallcode ändert. */
export const CASE_CODE_EVENT = 'case-code-changed';

/** Ermittelter Pflegegrad. Zugriff nur über `lib/pflegegrad/ergebnis-storage`. */
export const ERGEBNIS_KEY = 'pflegegrad-ergebnis';

/**
 * Fallbezogene Schlüssel im `localStorage`.
 *
 * Diese Daten haben Gesundheitsbezug (Art. 9 DSGVO) — Pflegegrad-Ergebnis,
 * Widerspruchsentwürfe, Zielgruppe. Sie dürfen einen Fallwechsel nicht
 * überleben und erst recht nicht auf einem geteilten Rechner zurückbleiben,
 * nachdem der Fall geschlossen wurde.
 *
 * Wer einen neuen fallbezogenen Schlüssel einführt, trägt ihn HIER ein.
 * Sonst bleibt er beim Aufräumen liegen — still und unbemerkt.
 *
 * `case_code` steht weiterhin in der Liste, obwohl dort nichts mehr
 * geschrieben wird: Auf Geräten, die vor #135 im Einsatz waren, liegt der
 * Eintrag noch, und er soll beim nächsten Aufräumen verschwinden.
 */
const FALL_DATEN_KEYS = [
  'case_code', // Altbestand vor #135
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

/** Nur im Arbeitsspeicher: überlebt kein Neuladen und keinen zweiten Tab. */
let angezeigterFallcode: string | null = null;

function entferneFallDaten(): void {
  for (const schluessel of FALL_DATEN_KEYS) {
    localStorage.removeItem(schluessel);
  }
}

/**
 * Merkt sich den Fallcode für die Anzeige und räumt bei einem Fallwechsel die
 * Daten des vorherigen Falls ab.
 *
 * Ohne das Aufräumen übernähme der neue Fall das Ergebnis des alten: Die
 * Startseite leitet auf die Ergebnisseite um, sobald `pflegegrad-ergebnis`
 * gesetzt ist — unabhängig davon, zu welchem Fall der Eintrag gehört. Das wäre
 * nicht nur ein Datenleck zwischen zwei Personen, sondern schlicht ein
 * falsches Ergebnis.
 */
export function storeCaseCode(code: string): void {
  const neuerCode = code.trim().toUpperCase();

  if (angezeigterFallcode !== neuerCode) {
    entferneFallDaten();
  }

  angezeigterFallcode = neuerCode;
  window.dispatchEvent(new Event(CASE_CODE_EVENT));
}

/**
 * Entfernt sämtliche Spuren des Falls aus diesem Browser.
 *
 * Gegenstück zum Schließen eines Falls. Der Server beendet dabei die Sitzung
 * (`clearCaseSession`), hier verschwindet der lokale Teil. Beides gehört
 * zusammen — eines allein ließe den Zugang halb offen.
 */
export function clearCaseData(): void {
  angezeigterFallcode = null;
  entferneFallDaten();
  window.dispatchEvent(new Event(CASE_CODE_EVENT));
}

/**
 * Der Fallcode zur Anzeige — oder `null`, wenn er in dieser Sitzung des
 * Browsers nicht eingegeben oder erzeugt wurde.
 *
 * `null` heißt **nicht** „kein Fall offen": Das entscheidet allein die
 * Sitzung, also der Server.
 */
export function getStoredCaseCode(): string | null {
  return angezeigterFallcode;
}
