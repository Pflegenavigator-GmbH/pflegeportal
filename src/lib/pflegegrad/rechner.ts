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

  // 1. Rohpunkte mittels der gesetzlichen Matrix in gewichtete Punkte umwandeln
  const w1 = NBA_CONFIG.MATRIX.modul1(fullScores[1]);
  const w2 = NBA_CONFIG.MATRIX.modul2(fullScores[2]);
  const w3 = NBA_CONFIG.MATRIX.modul3(fullScores[3]);
  const w4 = NBA_CONFIG.MATRIX.modul4(fullScores[4]);
  const w5 = NBA_CONFIG.MATRIX.modul5(fullScores[5]);
  const w6 = NBA_CONFIG.MATRIX.modul6(fullScores[6]);

  // 2. Höchstwertprinzip für die Blöcke Kognition (M2) und Verhalten (M3) anwenden
  const maxOf23 = Math.max(w2, w3);

  // 3. Gesamtsumme addieren (Maximal 100 Punkte möglich)
  const totalScore = Math.round((w1 + maxOf23 + w4 + w5 + w6) * 10) / 10;

  const levelMatch = NBA_CONFIG.THRESHOLDS.find((t) => totalScore >= t.min) || { level: 0, min: 0 };
  const careLevel = levelMatch.level;

  const buffer = totalScore - levelMatch.min;
  const trafficLight =
    careLevel === 0 ? 'rot' : buffer <= 2 ? 'rot' : buffer <= 5 ? 'gelb' : 'gruen';

  return {
    careLevel,
    totalScore,
    moduleScores: fullScores,
    weightedScores: {
      1: w1,
      2: w2,
      3: w3,
      4: w4,
      5: w5,
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
