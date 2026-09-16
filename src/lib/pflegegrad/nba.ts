// src/lib/pflegegrad/nba.ts
// Autoritatives NBA-Bewertungsmodell (§ 15 SGB XI) — gemeinsame Grundlage für
// den Erwachsenen- und den Kinder-Rechner.
//
// Modell (Begutachtungs-Richtlinie):
//  1. Je Modul wird aus den Einzelkriterien ein Schweregrad bestimmt.
//  2. Der Schweregrad ergibt eine von fünf gewichteten Stufen:
//       gewichtete Punkte = Modulgewicht × Stufe/4  (Stufe 0–4)
//     Die Modulgewichte 10/15/40/20/15 und diese lineare Stufung sind amtlich.
//  3. Von Modul 2 (Kognition) und Modul 3 (Verhalten) zählt nur der höhere Wert
//     (Höchstwertprinzip).
//  4. Summe (max. 100) → Pflegegrad über die amtlichen Schwellen.
//
// ⚠️ Wichtig: Die App fragt pro Modul WENIGER Kriterien ab als der amtliche
// Katalog (z. B. Modul 3: 4 statt 13). Absolute amtliche Punktschwellen sind
// deshalb nicht anwendbar. Stattdessen wird der Schweregrad je Modul aus dem
// Rohpunkte-ANTEIL (raw / maxRaw des Fragebogens) bestimmt und auf die fünf
// amtlichen Stufen abgebildet. Das ist die fachlich saubere Näherung für ein
// reduziertes Orientierungsinstrument und hält Erwachsenen- und Kinder-Rechner
// konsistent. FACHLICH/JURISTISCH gegen die aktuelle BRi zu verifizieren.
//
// Rechtsstand der hier verwendeten Werte: src/lib/rechtsstand/rechtswerte.ts
// (`pflegegrad.schwellen`, `pflegegrad.modulgewichte`,
// `pflegegrad.kriterien.amtlich`). Wer eine Zahl ändert, ändert sie dort mit.

import { ERWARTETE_FRAGEN } from '@/src/lib/pflegegrad/fragen';

export type AdultModuleNumber = 1 | 2 | 3 | 4 | 5 | 6;

/** Amtliche Modulgewichte (§ 15 Abs. 3 SGB XI) */
export const MODULE_WEIGHTS: Record<AdultModuleNumber, number> = {
  1: 10, // Mobilität
  2: 15, // Kognitive und kommunikative Fähigkeiten
  3: 15, // Verhaltensweisen und psychische Problemlagen
  4: 40, // Selbstversorgung
  5: 20, // Krankheits-/therapiebedingte Anforderungen
  6: 15, // Alltagsgestaltung und soziale Kontakte
};

/**
 * Maximal erreichbare Rohpunkte je Modul im Fragebogen der App
 * (Kriterienzahl × Höchstwert der jeweiligen Skala):
 *  M1 4×3, M2 5×3, M3 4×3, M4 6×3, M5 4×3, M6 5×2
 */
export const MODULE_MAX_RAW: Record<AdultModuleNumber, number> = {
  1: 12,
  2: 15,
  3: 12,
  4: 18,
  5: 12,
  6: 10,
};

/**
 * Wie viele Kriterien der Fragebogen erhebt — und wie viele das amtliche
 * Begutachtungsinstrument kennt (Anlage 1 zu § 15 SGB XI, Module 1 bis 6).
 *
 * `erhoben` wird aus {@link ERWARTETE_FRAGEN} abgeleitet und nicht abgeschrieben:
 * Wer eine Frage ergänzt, ändert damit auch die Angabe auf der Ergebnisseite.
 * `amtlich` ist der gesetzliche Katalog und ändert sich nur mit ihm.
 *
 * Diese Zahlen sind der Grund, warum die amtlichen Punktschwellen auf Modulebene
 * nicht anwendbar sind — die Ergebnisseite sagt das mit ihnen (Issue #137).
 */
export const MODULE_KRITERIEN: Record<AdultModuleNumber, { erhoben: number; amtlich: number }> = {
  1: { erhoben: ERWARTETE_FRAGEN[1].length, amtlich: 5 },
  2: { erhoben: ERWARTETE_FRAGEN[2].length, amtlich: 11 },
  3: { erhoben: ERWARTETE_FRAGEN[3].length, amtlich: 13 },
  4: { erhoben: ERWARTETE_FRAGEN[4].length, amtlich: 13 },
  5: { erhoben: ERWARTETE_FRAGEN[5].length, amtlich: 16 },
  6: { erhoben: ERWARTETE_FRAGEN[6].length, amtlich: 6 },
};

/** Summe über alle Module — für den Hinweis über der Modulliste. */
export const KRITERIEN_GESAMT = Object.values(MODULE_KRITERIEN).reduce(
  (summe, modul) => ({
    erhoben: summe.erhoben + modul.erhoben,
    amtlich: summe.amtlich + modul.amtlich,
  }),
  { erhoben: 0, amtlich: 0 }
);

/**
 * Rohpunkte-Anteil → eine der fünf amtlichen Schweregradstufen (0 / 0,25 / 0,5
 * / 0,75 / 1). 0 Punkte bedeuten keine Beeinträchtigung.
 */
export function severityFraction(raw: number, maxRaw: number): number {
  if (maxRaw <= 0 || raw <= 0) return 0;
  const ratio = raw / maxRaw;
  if (ratio <= 0.25) return 0.25;
  if (ratio <= 0.5) return 0.5;
  if (ratio <= 0.75) return 0.75;
  return 1;
}

/**
 * Schweregradstufe 0 bis 4 — dieselbe Näherung wie {@link severityFraction},
 * nur als ganze Stufe. Die Ergebnisseite zeigt sie statt einer Punktzahl, damit
 * niemand sie für eine amtliche Punktzahl hält (Issue #137).
 */
export function severityStufe(raw: number, maxRaw: number): 0 | 1 | 2 | 3 | 4 {
  return (severityFraction(raw, maxRaw) * 4) as 0 | 1 | 2 | 3 | 4;
}

/** Gewichtete Punkte eines Erwachsenen-Moduls aus seinen Rohpunkten. */
export function weightedModulePoints(moduleNumber: AdultModuleNumber, raw: number): number {
  return MODULE_WEIGHTS[moduleNumber] * severityFraction(raw, MODULE_MAX_RAW[moduleNumber]);
}

/** Amtliche Pflegegrad-Schwellen (§ 15 Abs. 3 SGB XI), Regelfall. */
export const PFLEGEGRAD_THRESHOLDS = [
  { level: 5, min: 90 },
  { level: 4, min: 70 },
  { level: 3, min: 47.5 },
  { level: 2, min: 27 },
  { level: 1, min: 12.5 },
] as const;

export function careLevelFromScore(totalScore: number): number {
  return PFLEGEGRAD_THRESHOLDS.find((t) => totalScore >= t.min)?.level ?? 0;
}
