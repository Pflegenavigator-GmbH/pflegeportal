// src/lib/pflegegrad/fragen.ts
/**
 * Fachliche Struktur der Begutachtungsmodule — OHNE Text.
 *
 * Die Fragen-IDs sind Domänenwissen (sie landen so in der Datenbank und in der
 * Punkteberechnung), die Formulierungen dagegen Darstellung. Seit der
 * Übersetzbarkeit liegen die Texte in
 * `public/locales/<sprache>/pflegegrad.json` unter
 * `modules.<modul>.questions.<id>`; hier bleibt nur, was sprachunabhängig gilt.
 *
 * Nebenbei behoben: Die Fragen der Module 2–5 standen bisher inline in den
 * jeweiligen Seiten, nur Modul 1 lag hier. Jetzt sind alle fünf an einer
 * Stelle.
 *
 * `as const` ist dabei nicht Kosmetik: Nur mit Literal-Typen lässt sich
 * `t(`questions.${id}.label`)` gegen die vorhandenen Schlüssel prüfen. Ohne das
 * wäre die ID ein `string` und ein Tippfehler fiele erst im Browser auf.
 */

export const FRAGEN_MODUL_1_IDS = ['m1_1', 'm1_2', 'm1_3', 'm1_4'] as const;
export const FRAGEN_MODUL_2_IDS = ['m2_1', 'm2_2', 'm2_3', 'm2_4', 'm2_5'] as const;
export const FRAGEN_MODUL_3_IDS = ['m3_1', 'm3_2', 'm3_3', 'm3_4'] as const;
export const FRAGEN_MODUL_4_IDS = ['m4_1', 'm4_2', 'm4_3', 'm4_4', 'm4_5', 'm4_6'] as const;
export const FRAGEN_MODUL_5_IDS = ['m5_1', 'm5_2', 'm5_3', 'm5_4'] as const;

/**
 * Modul 6 stand als einziges nicht hier, sondern nur in der Seite. Genau
 * diese Doppelung hat einen Absturz überdauert: Die Seite bot Optionswerte an,
 * die weder die Übersetzung noch die Punktetabelle kannte.
 */
export const FRAGEN_MODUL_6_IDS = ['m6_q1', 'm6_q2', 'm6_q3', 'm6_q4', 'm6_q5'] as const;

/** Erwartete Fragen je Modul — Grundlage der Vollständigkeitsprüfung. */
export const ERWARTETE_FRAGEN: Record<number, readonly string[]> = {
  1: FRAGEN_MODUL_1_IDS,
  2: FRAGEN_MODUL_2_IDS,
  3: FRAGEN_MODUL_3_IDS,
  4: FRAGEN_MODUL_4_IDS,
  5: FRAGEN_MODUL_5_IDS,
  6: FRAGEN_MODUL_6_IDS,
};

/**
 * Antwortskala der Module 1–5. Der Punktwert ist fachlich festgelegt, die
 * Beschriftung kommt aus den Übersetzungen (`pflegegrad.bewertungen`).
 */
export const BEWERTUNGS_WERTE = [
  { value: '0', punkte: 0 },
  { value: '1', punkte: 1 },
  { value: '2', punkte: 2 },
  { value: '3', punkte: 3 },
] as const;
