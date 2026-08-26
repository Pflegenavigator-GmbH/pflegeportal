// src/lib/pflegegrad/scoring.test.ts
import { describe, it, expect } from 'vitest';

import {
  bestimmeUnvollstaendigeModule,
  computeModuleRawScore,
  computeModuleScores,
} from './scoring';

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

  it('zählt ausschließlich die fachlich erwarteten Fragen', () => {
    // Die API prüft Schlüssel nur auf Form, nicht auf Zugehörigkeit. Ohne
    // diese Begrenzung konnte eine gültige Fallsitzung ihre Punkte durch
    // mitgesendete Fremdschlüssel beliebig hochschreiben.
    const ehrlich = { m1_1: '0', m1_2: '0', m1_3: '0', m1_4: '0' };
    const mitFremdschluesseln = { ...ehrlich, extra_1: '3', extra_2: '3', extra_3: '3' };

    expect(computeModuleRawScore(1, mitFremdschluesseln)).toBe(0);
    expect(computeModuleRawScore(1, mitFremdschluesseln)).toBe(computeModuleRawScore(1, ehrlich));
  });

  it('ignoriert modulfremde Beimischungen wie die Kinder-Stammdaten', () => {
    // `serializeKinderModuleData` legt meta_-Felder neben die Antworten.
    // Modul 7 wird ohnehin nicht bepunktet — die Begrenzung macht solche
    // Beimischungen aber grundsätzlich unschädlich.
    const answers = { m2_1: '3', m2_2: '0', meta_child_age: 3, meta_child_name: 'Test' };

    expect(computeModuleRawScore(2, answers)).toBe(3);
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

describe('bestimmeUnvollstaendigeModule', () => {
  const vollstaendig = {
    1: { m1_1: '3', m1_2: '3', m1_3: '3', m1_4: '3' },
    2: { m2_1: '0', m2_2: '0', m2_3: '0', m2_4: '0', m2_5: '0' },
    3: { m3_1: '0', m3_2: '0', m3_3: '0', m3_4: '0' },
    4: { m4_1: '0', m4_2: '0', m4_3: '0', m4_4: '0', m4_5: '0', m4_6: '0' },
    5: { m5_1: '0', m5_2: '0', m5_3: '0', m5_4: '0' },
    // Modul 6 speichert unter den fachlichen Schlüsseln, nicht unter den
    // Übersetzungs-IDs (m6_q1 …) — siehe FRAGEN_MODUL_6_KEYS.
    6: {
      haushalt: 'selbst',
      einkaufen: 'ja',
      kochen: 'selbst',
      finanzen: 'voll',
      entscheidungen: 'selbst',
    },
  } as const;

  const alleZeilen = () =>
    Object.entries(vollstaendig).map(([modul, answers]) => ({
      module_number: Number(modul),
      answers: { ...answers } as Record<string, unknown>,
    }));

  it('wertet durchgehend mit null Punkten beantwortete Module als vollständig', () => {
    // Der Kern der Korrektur: Volle Selbstständigkeit ergibt null Punkte und
    // ist ein gültiges Ergebnis — kein fehlender Datensatz.
    expect(bestimmeUnvollstaendigeModule(alleZeilen())).toEqual([]);
  });

  it('meldet Module ohne jede Antwortzeile', () => {
    const ohneModul3 = alleZeilen().filter((z) => z.module_number !== 3);
    expect(bestimmeUnvollstaendigeModule(ohneModul3)).toEqual([3]);
  });

  it('meldet Module mit fehlender Einzelantwort', () => {
    const zeilen = alleZeilen();
    const modul4 = zeilen.find((z) => z.module_number === 4)!;
    delete modul4.answers.m4_6;

    expect(bestimmeUnvollstaendigeModule(zeilen)).toEqual([4]);
  });

  it('zählt unbekannte Antwortwerte nicht als beantwortet', () => {
    // Ein Wert, den die Punktetabelle nicht kennt, flösse sonst still mit
    // null Punkten ein und sähe aus wie eine gültige Antwort.
    const zeilen = alleZeilen();
    const modul6 = zeilen.find((z) => z.module_number === 6)!;
    modul6.answers.entscheidungen = 'betreuung';

    expect(bestimmeUnvollstaendigeModule(zeilen)).toEqual([6]);
  });

  it('meldet bei leerer Eingabe alle sechs Module', () => {
    expect(bestimmeUnvollstaendigeModule([])).toEqual([1, 2, 3, 4, 5, 6]);
  });
});
