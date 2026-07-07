import { describe, it, expect } from 'vitest';

import { calculatePflegegrad } from '@/src/lib/pflegegrad/rechner';
import { createMockScores } from '@/test-utils/factories/scores';

describe('Pflegegrad Rechner - Präzise Grenzwerte', () => {
  it('sollte Pflegegrad 2 bei Score ~30 berechnen', () => {
    const scores = createMockScores({ 1: 4, 4: 1, 5: 4, 6: 2 });
    const result = calculatePflegegrad(scores);

    expect(result.totalScore).toBe(31.3); // Gerundet auf eine Nachkommastelle
    expect(result.careLevel).toBe(2);
  });

  it('sollte bei maximaler Punktzahl Pflegegrad 5 erreichen', () => {
    const scores = createMockScores({ 1: 10, 2: 20, 3: 25, 4: 20, 5: 10, 6: 10 });
    const result = calculatePflegegrad(scores);

    expect(result.totalScore).toBe(100);
    expect(result.careLevel).toBe(5);
  });
});

describe('Pflegegrad Rechner - Grenzwerte & Logik', () => {
  it('sollte exakt bei der Schwelle 12.5 Pflegegrad 1 vergeben', () => {
    const scores = createMockScores({ 1: 1, 4: 1 });
    const result = calculatePflegegrad(scores);

    expect(result.totalScore).toBe(12.5);
    expect(result.careLevel).toBe(1);
  });

  it('sollte bei unter 12.5 Punkten Pflegegrad 0 vergeben', () => {
    const scores = createMockScores({ 1: 5, 6: 2 });
    const result = calculatePflegegrad(scores);

    expect(result.totalScore).toBe(11.3); // Rundung von 11.25
    expect(result.careLevel).toBe(0);
  });

  it('sollte Modul 3 bevorzugen, wenn es höher als Modul 2 ist (maxOf23)', () => {
    const scores = createMockScores({ 2: 3, 3: 10 });
    const result = calculatePflegegrad(scores);

    expect(result.maxOf23).toBe(7.5);
    expect(result.totalScore).toBe(7.5); // Da andere Module 0 sind
  });

  it('sollte missingData als true markieren, wenn mindestens ein Modul den Rohwert 0 hat', () => {
    const scores = createMockScores({ 1: 3 });
    const result = calculatePflegegrad(scores);

    expect(result.missingData).toBe(true);
  });

  it('sollte trafficLight "gelb" bei Puffer 3-5 Punkten anzeigen', () => {
    const scores = createMockScores({ 4: 6, 1: 5, 6: 2 });
    const result = calculatePflegegrad(scores);

    expect(result.trafficLight).toBe('gelb');
  });
});
