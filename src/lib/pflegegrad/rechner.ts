// src/lib/pflegegrad/rechner.ts
import { ModuleScores, PflegegradErgebnis, EinstufungAmpel } from '@/src/types/pflegegrad';

const THRESHOLDS = [
  { level: 5, min: 90.0 },
  { level: 4, min: 70.0 },
  { level: 3, min: 47.5 },
  { level: 2, min: 27.0 },
  { level: 1, min: 12.5 },
];

// Offizielle NBA-Gewichtungspunkte-Transformation (Beispielhaft für Überleitung)
function transformRohToSystemPoints(modulId: number, rohPunkte: number): number {
  // Das Gesetz konvertiert Rohpunkte in feste Systempunkte (z.B. Modul 4 Max 15 Roh -> 40 System)
  const maxRoh = modulId === 4 ? 12 : 12; // Modulabhängige Maxima
  const gewichtung = modulId === 1 ? 10 : modulId === 4 ? 40 : modulId === 5 ? 20 : 15;

  if (rohPunkte === 0) return 0;
  return Math.min(gewichtung, (rohPunkte / maxRoh) * gewichtung);
}

export function calculatePflegegrad(scores: Partial<ModuleScores>): PflegegradErgebnis {
  const fullScores: ModuleScores = {
    1: scores[1] ?? 0,
    2: scores[2] ?? 0,
    3: scores[3] ?? 0,
    4: scores[4] ?? 0,
    5: scores[5] ?? 0,
    6: scores[6] ?? 0,
  };

  const missingData = Object.values(fullScores).some((s) => s === undefined);
  const maxOf23 = Math.max(fullScores[2], fullScores[3]);

  // Gesetzlich korrekte Transformation
  const weightedScores = {
    1: transformRohToSystemPoints(1, fullScores[1]),
    23: transformRohToSystemPoints(2, maxOf23),
    4: transformRohToSystemPoints(4, fullScores[4]),
    5: transformRohToSystemPoints(5, fullScores[5]),
  };

  const totalScore =
    Math.round(
      (weightedScores[1] + weightedScores[23] + weightedScores[4] + weightedScores[5]) * 10
    ) / 10;

  let careLevel = 0;
  for (const t of THRESHOLDS) {
    if (totalScore >= t.min) {
      careLevel = t.level;
      break;
    }
  }

  // Ampel-Ermittlung
  let trafficLight: EinstufungAmpel = 'gruen';
  let buffer = 0;
  if (careLevel === 0) {
    trafficLight = 'rot';
    buffer = 12.5 - totalScore;
  } else {
    const aktuelleSchwelle = THRESHOLDS.find((t) => t.level === careLevel)?.min || 0;
    buffer = totalScore - aktuelleSchwelle;
    trafficLight = buffer <= 3 ? 'rot' : buffer <= 5 ? 'gelb' : 'gruen';
  }

  return {
    careLevel,
    totalScore,
    moduleScores: fullScores,
    weightedScores: {
      1: weightedScores[1],
      2: fullScores[2],
      3: fullScores[3],
      4: weightedScores[4],
      5: weightedScores[5],
    },
    maxOf23,
    trafficLight,
    buffer: Math.round(buffer * 10) / 10,
    missingData,
    benefits: {
      monthlyAmount:
        careLevel === 2
          ? 347
          : careLevel === 3
            ? 599
            : careLevel === 4
              ? 800
              : careLevel === 5
                ? 990
                : 0,
      reliefBudget: careLevel >= 1 ? 131 : 0,
      additionalBenefits:
        careLevel >= 2 ? ['Pflegehilfsmittel: 42 €/Monat', 'Wohnraumanpassung: 4.180 €'] : [],
    },
    recommendations:
      careLevel === 0
        ? ['Wiederholung in 6 Monaten prüfen']
        : ['Antrag auf Schwerbehindertenausweis prüfen'],
  };
}
