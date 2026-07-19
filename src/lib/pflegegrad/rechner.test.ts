import { describe, it, expect } from 'vitest';

import { MODULE_MAX_RAW } from '@/src/lib/pflegegrad/nba';
import { calculatePflegegrad } from '@/src/lib/pflegegrad/rechner';
import { createMockScores } from '@/test-utils/factories/scores';

// Modell (nba.ts): gewichtete Punkte = Gewicht × severityFraction(raw/maxRaw).
// Gewichte: M1 10, M2/M3 15 (Höchstwert), M4 40, M5 20, M6 15.
// severityFraction: 0→0, ≤25%→0.25, ≤50%→0.5, ≤75%→0.75, sonst 1.

describe('Pflegegrad Rechner - Schweregrad-Modell', () => {
  it('ergibt ohne Beeinträchtigungen Pflegegrad 0', () => {
    const result = calculatePflegegrad(createMockScores({}));
    expect(result.totalScore).toBe(0);
    expect(result.careLevel).toBe(0);
    expect(result.trafficLight).toBe('rot');
  });

  it('ergibt bei maximalen Rohpunkten aller Module exakt 100 Punkte / Pflegegrad 5', () => {
    const scores = createMockScores({
      1: MODULE_MAX_RAW[1],
      2: MODULE_MAX_RAW[2],
      3: MODULE_MAX_RAW[3],
      4: MODULE_MAX_RAW[4],
      5: MODULE_MAX_RAW[5],
      6: MODULE_MAX_RAW[6],
    });
    const result = calculatePflegegrad(scores);
    expect(result.totalScore).toBe(100);
    expect(result.careLevel).toBe(5);
  });

  it('wendet das Höchstwertprinzip auf M2/M3 an (nur der höhere zählt)', () => {
    // M2 voll (15→ frac1 →15), M3 halb (6/12=0.5→7.5). Es zählt 15.
    const result = calculatePflegegrad(createMockScores({ 2: 15, 3: 6 }));
    expect(result.maxOf23).toBe(15);
    expect(result.totalScore).toBe(15);
  });

  it('rechnet Modul 4 (Gewicht 40) korrekt in die vier Stufen', () => {
    // 9/18 = 0.5 → 0.5 → 20 gewichtete Punkte
    const result = calculatePflegegrad(createMockScores({ 4: 9 }));
    expect(result.totalScore).toBe(20);
    // 20 Punkte → unter der PG2-Schwelle (27) → Pflegegrad 1
    expect(result.careLevel).toBe(1);
  });

  it('bewertet Modul 6 abgestuft statt binär', () => {
    // 3 von 5 Fragen "nicht" (je 2 Punkte) = 6 → 6/10=0.6 → 0.75 → 15×0.75 = 11.25
    // (Gesamtsumme wird auf eine Nachkommastelle gerundet → 11.3)
    const result = calculatePflegegrad(createMockScores({ 6: 6 }));
    expect(result.weightedScores).toBeDefined();
    expect(result.totalScore).toBe(11.3);
  });

  it('erreicht Pflegegrad 2 bei erheblichen Beeinträchtigungen in mehreren Modulen', () => {
    // M1 voll(10) + M4 halb(20) = 30 → ≥27 → PG2
    const result = calculatePflegegrad(createMockScores({ 1: 12, 4: 9 }));
    expect(result.totalScore).toBe(30);
    expect(result.careLevel).toBe(2);
  });

  it('markiert missingData, wenn mindestens ein Modul den Rohwert 0 hat', () => {
    const result = calculatePflegegrad(createMockScores({ 1: 3 }));
    expect(result.missingData).toBe(true);
  });

  it('setzt die Ampel je nach Puffer über der Pflegegrad-Schwelle', () => {
    // Genau auf einer Schwelle (kleiner Puffer) → rot
    const knapp = calculatePflegegrad(createMockScores({ 4: 3 })); // 3/18=0.166→0.25→10
    expect(knapp.careLevel).toBe(0);
    expect(knapp.trafficLight).toBe('rot');
  });
});
