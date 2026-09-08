import { describe, expect, it } from 'vitest';

import {
  istPresseKategorie,
  KATEGORIE_ALLE,
  normalisiereKategorie,
  PRESSE_KATEGORIEN,
} from './kategorien';

describe('Presse-Kategorien', () => {
  it('erkennt gültige Kategorie-Schlüssel', () => {
    for (const k of PRESSE_KATEGORIEN) {
      expect(istPresseKategorie(k)).toBe(true);
    }
    expect(istPresseKategorie('recht')).toBe(true);
    expect(istPresseKategorie('Recht')).toBe(false); // groß = anderer Schlüssel
    expect(istPresseKategorie('unfug')).toBe(false);
    expect(istPresseKategorie(null)).toBe(false);
    expect(istPresseKategorie(KATEGORIE_ALLE)).toBe(false); // 'alle' ist kein DB-Wert
  });

  it('normalisiert Filterwerte, Unbekanntes wird zu „alle"', () => {
    expect(normalisiereKategorie('recht')).toBe('recht');
    expect(normalisiereKategorie('alle')).toBe(KATEGORIE_ALLE);
    expect(normalisiereKategorie('quatsch')).toBe(KATEGORIE_ALLE);
    expect(normalisiereKategorie(undefined)).toBe(KATEGORIE_ALLE);
    expect(normalisiereKategorie(42)).toBe(KATEGORIE_ALLE);
  });
});
