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
 * Setzt einen dynamischen, potenziell nutzerkontrollierten Schlüssel in einem
 * JSONB-artigen Dictionary — ohne dynamischen Property-Write.
 *
 * Der gesamte Vorgang läuft über eine `Map`: `Map.set` kann den Prototyp nicht
 * verschmutzen, und `Object.fromEntries` verwendet defineProperty-Semantik
 * (auch ein Schlüssel `__proto__` würde nur eine eigene Eigenschaft anlegen).
 * Damit existiert kein Property-Injection-Sink mehr
 * (CodeQL: js/remote-property-injection).
 */
export function withKey<T>(source: Record<string, T>, key: string, value: T): Record<string, T> {
  const map = new Map<string, T>(Object.entries(source));
  map.set(key, value);
  return Object.fromEntries(map) as Record<string, T>;
}

/** Entfernt einen dynamischen Schlüssel über denselben Map-Weg. */
export function withoutKey<T>(source: Record<string, T>, key: string): Record<string, T> {
  const map = new Map<string, T>(Object.entries(source));
  map.delete(key);
  return Object.fromEntries(map) as Record<string, T>;
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
