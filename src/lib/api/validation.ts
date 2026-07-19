// src/lib/api/validation.ts
// Gemeinsame Eingabe-Validierung für Route Handler.

/**
 * Schlüssel, die bei dynamischen Objekt-Zuweisungen Prototype Pollution
 * auslösen können (CodeQL: js/remote-property-injection).
 */
export function isSafeObjectKey(key: string): boolean {
  return key !== '__proto__' && key !== 'constructor' && key !== 'prototype';
}

/**
 * Setzt einen dynamischen, potenziell nutzerkontrollierten Schlüssel sicher.
 * Die inline-Sperre der drei gefährlichen Namen wird von CodeQL als Barriere
 * gegen js/remote-property-injection erkannt (die Regex-Validierung allein
 * folgt der Datenflussanalyse nicht).
 */
export function safeAssign<T>(target: Record<string, T>, key: string, value: T): void {
  if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
    throw new Error('Unzulässiger Objekt-Schlüssel.');
  }
  target[key] = value;
}

/** Löscht einen dynamischen Schlüssel mit derselben Prototype-Pollution-Sperre. */
export function safeDelete<T>(target: Record<string, T>, key: string): void {
  if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
    return;
  }
  if (Object.prototype.hasOwnProperty.call(target, key)) {
    delete target[key];
  }
}

/** Frageschlüssel in answers-JSONB: alphanumerisch plus _ . - */
const QUESTION_KEY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,99}$/;

export function isValidQuestionKey(key: string): boolean {
  return QUESTION_KEY_PATTERN.test(key) && isSafeObjectKey(key);
}

/** Tagebuch-Einträge werden ausschließlich als entry_<Zeitstempel> adressiert */
const TAGEBUCH_ENTRY_KEY_PATTERN = /^entry_\d{1,17}$/;

export function isValidTagebuchEntryKey(key: string): boolean {
  return TAGEBUCH_ENTRY_KEY_PATTERN.test(key);
}

const MAX_EMAIL_LENGTH = 254; // RFC 5321

// Bewusst ohne verschachtelte/mehrdeutige Quantifizierer, damit die Prüfung
// in linearer Zeit läuft (CodeQL: js/polynomial-redos). Die Zeichenklassen
// des Domain-Teils enthalten keinen Punkt — dadurch gibt es kein Backtracking.
const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/;

export function isValidEmail(value: string): boolean {
  return value.length <= MAX_EMAIL_LENGTH && EMAIL_PATTERN.test(value);
}
