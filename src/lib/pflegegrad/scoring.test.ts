// src/lib/pflegegrad/scoring.test.ts
import { describe, it, expect } from 'vitest';

import { computeModuleRawScore, computeModuleScores } from './scoring';

describe('computeModuleRawScore', () => {
  it('summiert die Standard-Skala 0–3 (Modul 1/2/4/5)', () => {
    expect(computeModuleRawScore(1, { m1_1: '3', m1_2: '2', m1_3: '0', m1_4: '1' })).toBe(6);
  });

  it('nutzt für Modul 3 die Häufigkeitsskala (0/1/3)', () => {
    expect(computeModuleRawScore(3, { m3_1: '3', m3_2: '1', m3_3: '0' })).toBe(4);
  });

  it('bewertet Modul 6 qualitativ (selbst=0, teilweise=1, nicht=2)', () => {
    const answers = {
      haushalt: 'nicht', // 2
      einkaufen: 'online_begleitung', // 1
      kochen: 'selbst', // 0
      finanzen: 'voll', // 0
      entscheidungen: 'beratung', // 1
    };
    expect(computeModuleRawScore(6, answers)).toBe(4);
  });

  it('ignoriert unbekannte Antwortwerte defensiv', () => {
    expect(computeModuleRawScore(1, { m1_1: 'ungueltig', m1_2: '2' })).toBe(2);
  });

  it('akzeptiert auch numerische Antwortwerte', () => {
    expect(computeModuleRawScore(2, { m2_1: 3, m2_2: 1 })).toBe(4);
  });

  it('gibt 0 für unbekannte Modulnummern', () => {
    expect(computeModuleRawScore(99, { x: '3' })).toBe(0);
  });
});

describe('computeModuleScores', () => {
  it('baut alle sechs Modul-Rohpunkte aus DB-Zeilen', () => {
    const rows = [
      { module_number: 1, answers: { m1_1: '3', m1_2: '3' } }, // 6
      { module_number: 6, answers: { haushalt: 'nicht' } }, // 2
      { module_number: 10, answers: { entry_1: 'x' } }, // Tagebuch – ignoriert
    ];
    const scores = computeModuleScores(rows);
    expect(scores).toEqual({ 1: 6, 2: 0, 3: 0, 4: 0, 5: 0, 6: 2 });
  });

  it('behandelt fehlende/leere Antworten als 0', () => {
    expect(computeModuleScores([{ module_number: 2, answers: null }])[2]).toBe(0);
    expect(computeModuleScores([])).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 });
  });
});
