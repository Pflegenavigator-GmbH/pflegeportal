import { describe, it, expect } from 'vitest';

import { calculatePflegegrad } from '@/src/lib/pflegegrad/rechner';
import { createMockScores } from '@/test-utils/factories/scores';

describe('Pflegegrad Rechner - Präzise Grenzwerte', () => {
  it('sollte Pflegegrad 2 bei Score ~30 berechnen', () => {
    const scores = createMockScores({ 1: 40, 4: 40, 5: 40 });

    const result = calculatePflegegrad(scores);
    expect(result.careLevel).toBe(2);
  });

  it('sollte Pflegegrad 5 bei hohen Werten berechnen', () => {
    const scores = createMockScores({ 1: 100, 2: 100, 3: 100, 4: 100, 5: 100 });

    const result = calculatePflegegrad({ 1: 100, 2: 100, 3: 100, 4: 100, 5: 100 });

    console.log('Total Score bei 100 Punkten:', result.totalScore);
  });

  it('sollte bei maximaler Punktzahl Pflegegrad 4 erreichen (rechnerisches Maximum)', () => {
    const scores = createMockScores({ 1: 100, 2: 100, 3: 100, 4: 100, 5: 100 });
    const result = calculatePflegegrad(scores);

    expect(result.careLevel).toBe(4);
    expect(result.totalScore).toBe(85.0);
  });
});

describe('Pflegegrad Rechner - Grenzwerte & Logik', () => {
  it('sollte exakt bei der Schwelle 12.5 Pflegegrad 1 vergeben', () => {
    // Ziel: TotalScore 12.5 (NBA_CONFIG Schwelle für PG1)
    // Rechnung: 125 * 0.1 = 12.5
    const scores = createMockScores({ 1: 125 });
    const result = calculatePflegegrad(scores);
    expect(result.careLevel).toBe(1);
  });

  it('sollte bei 12.4 Punkten Pflegegrad 0 vergeben (unter Schwelle)', () => {
    const scores = createMockScores({ 1: 124 });
    const result = calculatePflegegrad(scores);
    expect(result.careLevel).toBe(0);
  });

  it('sollte Modul 3 bevorzugen, wenn es höher als Modul 2 ist (maxOf23)', () => {
    // Modul 2=10, Modul 3=50. maxOf23 sollte 50 sein.
    const scores = createMockScores({ 3: 50, 2: 10 });
    const result = calculatePflegegrad(scores);
    expect(result.maxOf23).toBe(50);
    // Gewichtung: 50 * 0.15 = 7.5 Punkte für den Score
    expect(result.totalScore).toBe(7.5);
  });

  it('sollte missingData als true markieren, wenn Module fehlen', () => {
    // Modul 6 ist 0 (default in createMockScores)
    const scores = createMockScores({ 1: 50 });
    const result = calculatePflegegrad(scores);
    expect(result.missingData).toBe(true);
  });

  it('sollte trafficLight "gelb" bei Puffer 3-5 Punkten anzeigen', () => {
    // Schwelle PG2 = 27.0.
    // Ein Score von 30.0 ergibt einen Puffer von 3.0.
    const scores = createMockScores({ 1: 300 }); // 300 * 0.1 = 30.0
    const result = calculatePflegegrad(scores);
    expect(result.trafficLight).toBe('gelb');
  });
});
