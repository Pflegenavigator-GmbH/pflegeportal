// src/lib/pflegegrad/rechner.ts
import { NBA_CONFIG } from '@/src/lib/pflegegrad/constants';
import { ModuleScores, PflegegradErgebnis } from '@/src/types/pflegegrad';

export function calculatePflegegrad(scores: Partial<ModuleScores>): PflegegradErgebnis {
  const fullScores: ModuleScores = {
    1: scores[1] ?? 0,
    2: scores[2] ?? 0,
    3: scores[3] ?? 0,
    4: scores[4] ?? 0,
    5: scores[5] ?? 0,
    6: scores[6] ?? 0,
  };

  const maxOf23 = Math.max(fullScores[2], fullScores[3]);

  // Berechnung der gewichteten Punkte basierend auf den NBA-Prozenten
  const weighted = {
    1: fullScores[1] * NBA_CONFIG.WEIGHTS[1],
    2: fullScores[2] * NBA_CONFIG.WEIGHTS[2], // Hilfswert für Objekt-Struktur
    3: fullScores[3] * NBA_CONFIG.WEIGHTS[3], // Hilfswert für Objekt-Struktur
    23: maxOf23 * NBA_CONFIG.WEIGHTS[2], // Entscheidender Wert
    4: fullScores[4] * NBA_CONFIG.WEIGHTS[4],
    5: fullScores[5] * NBA_CONFIG.WEIGHTS[5],
  };

  const totalScore = Math.round((weighted[1] + weighted[23] + weighted[4] + weighted[5]) * 10) / 10;

  const levelMatch = NBA_CONFIG.THRESHOLDS.find((t) => totalScore >= t.min) || { level: 0, min: 0 };
  const careLevel = levelMatch.level;

  // Ampel & Benefits
  const buffer = totalScore - levelMatch.min;
  const trafficLight =
    careLevel === 0 ? 'rot' : buffer <= 2 ? 'rot' : buffer <= 5 ? 'gelb' : 'gruen';

  return {
    careLevel,
    totalScore,
    moduleScores: fullScores,
    weightedScores: {
      1: weighted[1],
      2: weighted[2],
      3: weighted[3],
      4: weighted[4],
      5: weighted[5],
    },
    maxOf23,
    trafficLight,
    buffer: Math.round(buffer * 10) / 10,
    missingData: Object.values(fullScores).some((s) => s === 0),
    benefits: {
      monthlyAmount:
        NBA_CONFIG.BENEFITS[careLevel as keyof typeof NBA_CONFIG.BENEFITS]?.monthly ?? 0,
      reliefBudget: NBA_CONFIG.BENEFITS[careLevel as keyof typeof NBA_CONFIG.BENEFITS]?.relief ?? 0,
      additionalBenefits:
        careLevel >= 2 ? ['Pflegehilfsmittel (42€)', 'Wohnraumanpassung (4.180€)'] : [],
    },
    recommendations:
      careLevel === 0 ? ['Wiederholung bei Verschlechterung'] : ['Schwerbehindertenausweis prüfen'],
  };
}
