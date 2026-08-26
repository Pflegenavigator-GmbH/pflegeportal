// src/lib/pflegegrad/rechner.ts
import { NBA_CONFIG } from '@/src/lib/pflegegrad/constants';
import { careLevelFromScore, weightedModulePoints } from '@/src/lib/pflegegrad/nba';
import { ModuleScores, PflegegradErgebnis } from '@/src/types/pflegegrad';

// Untergrenze je Pflegegrad — für die Puffer-/Ampelberechnung
const PFLEGEGRAD_MIN: Record<number, number> = { 1: 12.5, 2: 27, 3: 47.5, 4: 70, 5: 90 };

/**
 * @param unvollstaendigeModule Module, zu denen noch Pflichtantworten fehlen —
 *   zu ermitteln mit `bestimmeUnvollstaendigeModule` aus den gespeicherten
 *   Antworten. Ohne Angabe bleibt `missingData` false: Der Punktwert allein
 *   lässt keine Aussage über Vollständigkeit zu, denn null Punkte sind ein
 *   gültiges Ergebnis (volle Selbstständigkeit). Wer die Aussage braucht,
 *   muss die Antworten mitliefern.
 */
export function calculatePflegegrad(
  scores: Partial<ModuleScores>,
  unvollstaendigeModule: readonly number[] = []
): PflegegradErgebnis {
  const fullScores: ModuleScores = {
    1: scores[1] ?? 0,
    2: scores[2] ?? 0,
    3: scores[3] ?? 0,
    4: scores[4] ?? 0,
    5: scores[5] ?? 0,
    6: scores[6] ?? 0,
  };

  // 1. Rohpunkte je Modul in gewichtete Punkte umrechnen (Schweregrad-Modell)
  const w1 = weightedModulePoints(1, fullScores[1]);
  const w2 = weightedModulePoints(2, fullScores[2]);
  const w3 = weightedModulePoints(3, fullScores[3]);
  const w4 = weightedModulePoints(4, fullScores[4]);
  const w5 = weightedModulePoints(5, fullScores[5]);
  const w6 = weightedModulePoints(6, fullScores[6]);

  // 2. Höchstwertprinzip für Kognition (M2) und Verhalten (M3)
  const maxOf23 = Math.max(w2, w3);

  // 3. Gesamtsumme (max. 100 Punkte)
  const totalScore = Math.round((w1 + maxOf23 + w4 + w5 + w6) * 10) / 10;

  const careLevel = careLevelFromScore(totalScore);

  const levelMin = careLevel > 0 ? (PFLEGEGRAD_MIN[careLevel] ?? 0) : 0;
  const buffer = totalScore - levelMin;
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
    missingData: unvollstaendigeModule.length > 0,
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
