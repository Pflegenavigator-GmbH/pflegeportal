import {
  BEWERTUNGS_WERTE,
  ERWARTETE_FRAGEN,
  FRAGEN_MODUL_1_IDS,
  FRAGEN_MODUL_2_IDS,
  FRAGEN_MODUL_3_IDS,
  FRAGEN_MODUL_4_IDS,
  FRAGEN_MODUL_5_IDS,
} from '@/src/lib/pflegegrad/fragen';

type AntwortVertrag = Readonly<Record<string, readonly string[]>>;

const STANDARD_WERTE = BEWERTUNGS_WERTE.map(({ value }) => value);

function standardVertrag(frageIds: readonly string[]): AntwortVertrag {
  return Object.fromEntries(frageIds.map((id) => [id, STANDARD_WERTE]));
}

/**
 * Einziger HTTP-/Scoring-Vertrag für Erwachsenen-Antworten.
 * Modul 6 besitzt je Frage unterschiedliche qualitative Antwortwerte.
 */
export const ERWACHSENEN_ANTWORTVERTRAEGE: Readonly<Record<number, AntwortVertrag>> = {
  1: standardVertrag(FRAGEN_MODUL_1_IDS),
  2: standardVertrag(FRAGEN_MODUL_2_IDS),
  3: standardVertrag(FRAGEN_MODUL_3_IDS),
  4: standardVertrag(FRAGEN_MODUL_4_IDS),
  5: standardVertrag(FRAGEN_MODUL_5_IDS),
  6: {
    haushalt: ['selbst', 'teilweise', 'nicht'],
    einkaufen: ['ja', 'online_begleitung', 'nicht'],
    kochen: ['selbst', 'teilweise', 'nicht'],
    finanzen: ['voll', 'teilweise', 'nicht'],
    entscheidungen: ['selbst', 'beratung', 'nicht'],
  },
};

function normalisiereAntwort(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}

export function istErlaubteErwachsenenAntwort(
  moduleNumber: number,
  questionKey: string,
  value: unknown
): boolean {
  const vertrag = ERWACHSENEN_ANTWORTVERTRAEGE[moduleNumber];
  if (!vertrag || !Object.hasOwn(vertrag, questionKey)) return false;

  const normalisiert = normalisiereAntwort(value);
  return normalisiert !== null && vertrag[questionKey].includes(normalisiert);
}

/**
 * Liefert eine nutzergeeignete Fehlermeldung oder null bei gültigen Daten.
 * Nicht-Erwachsenenmodule werden bewusst nicht hier validiert: Kinder und
 * Tagebuch besitzen eigene, dynamischere Datenverträge.
 */
export function pruefeErwachsenenAntworten(
  moduleNumber: number,
  answers: Record<string, unknown>,
  requireComplete: boolean
): string | null {
  const vertrag = ERWACHSENEN_ANTWORTVERTRAEGE[moduleNumber];
  if (!vertrag) return null;

  for (const [key, value] of Object.entries(answers)) {
    if (!Object.hasOwn(vertrag, key)) {
      return `Frageschlüssel "${key.slice(0, 40)}" gehört nicht zu Modul ${moduleNumber}.`;
    }
    if (!istErlaubteErwachsenenAntwort(moduleNumber, key, value)) {
      return `Ungültiger Antwortwert für Schlüssel "${key.slice(0, 40)}".`;
    }
  }

  if (requireComplete) {
    const fehlend = ERWARTETE_FRAGEN[moduleNumber].find((key) => !Object.hasOwn(answers, key));
    if (fehlend) return `Pflichtantwort "${fehlend}" fehlt.`;
  }

  return null;
}
