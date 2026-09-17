// src/lib/case-code-server.test.ts
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import { CASE_CODE_PATTERN } from './case-code';
import { berechneCaseCodeHash, erzeugeFallcode, gleicherFallcode } from './case-code-server';

vi.mock('server-only', () => ({}));

/** Zeichen, die neue Codes meiden: 0/O und 1/I sind beim Abtippen verwechselbar. */
const VERWECHSELBAR = /[01IO]/;

describe('berechneCaseCodeHash (#153)', () => {
  it('ist deterministisch und unabhängig von Schreibweise und Leerraum', () => {
    const erwartet = berechneCaseCodeHash('PF-ABCD-1234');

    expect(berechneCaseCodeHash('  pf-abcd-1234 ')).toBe(erwartet);
    expect(erwartet).toMatch(/^[0-9a-f]{64}$/);
  });

  it('liefert für verschiedene Codes verschiedene Schlüssel', () => {
    expect(berechneCaseCodeHash('PF-ABCD-1234')).not.toBe(berechneCaseCodeHash('PF-ABCD-1235'));
  });

  it('hängt am Pepper — mit einem anderen Secret passt kein gespeicherter Schlüssel', () => {
    const mitTestPepper = berechneCaseCodeHash('PF-ABCD-1234');

    const vorher = process.env.CASE_CODE_PEPPER;
    process.env.CASE_CODE_PEPPER = 'ein-voellig-anderer-pepper-32-zeichen!!';
    const mitAnderemPepper = berechneCaseCodeHash('PF-ABCD-1234');
    process.env.CASE_CODE_PEPPER = vorher;

    expect(mitAnderemPepper).not.toBe(mitTestPepper);
  });

  it('scheitert laut ohne Pepper, statt still niemanden zu finden', () => {
    const vorher = process.env.CASE_CODE_PEPPER;
    delete process.env.CASE_CODE_PEPPER;

    expect(() => berechneCaseCodeHash('PF-ABCD-1234')).toThrow(/CASE_CODE_PEPPER/);

    process.env.CASE_CODE_PEPPER = 'zu-kurz';
    expect(() => berechneCaseCodeHash('PF-ABCD-1234')).toThrow(/CASE_CODE_PEPPER/);

    process.env.CASE_CODE_PEPPER = vorher;
  });

  it('verweigert die Ableitung für nicht normalisierbare Codes', () => {
    // Ein solcher Eintrag träfe später niemanden mehr.
    expect(() => berechneCaseCodeHash('ABCD1234')).toThrow(/kanonischen Format/);
  });
});

describe('erzeugeFallcode (#153)', () => {
  it('erzeugt Codes im kanonischen Format', () => {
    for (let i = 0; i < 50; i++) {
      expect(CASE_CODE_PATTERN.test(erzeugeFallcode())).toBe(true);
    }
  });

  it('meidet verwechselbare Zeichen', () => {
    for (let i = 0; i < 200; i++) {
      const code = erzeugeFallcode().replace(/^PF-/, '').replace('-', '');
      expect(VERWECHSELBAR.test(code), code).toBe(false);
    }
  });

  it('wiederholt sich nicht — der Zufall kommt aus dem System, nicht aus random()', () => {
    const codes = new Set(Array.from({ length: 500 }, () => erzeugeFallcode()));
    expect(codes.size).toBe(500);
  });
});

describe('Keine Klartextsuche mehr (#153)', () => {
  /**
   * Quelltext-Sperre. Die Klartextspalte verschwindet erst mit der zweiten
   * Migration; bis dahin bliebe eine Abfrage darauf funktionsfähig und wäre
   * genau deshalb leicht zu übersehen.
   */
  it('keine Abfrage sucht über die Spalte case_code', () => {
    const src = path.resolve(__dirname, '..');
    const KLARTEXTSUCHE = /\.(eq|match|filter)\(\s*['"]case_code['"]/;

    const fundstellen = readdirSync(src, { recursive: true, encoding: 'utf8' })
      .filter((datei) => /\.(ts|tsx)$/.test(datei))
      .filter((datei) => !/\.test\.(ts|tsx)$/.test(datei))
      .flatMap((datei) =>
        readFileSync(path.join(src, datei), 'utf8')
          .split('\n')
          .map((zeile, index) => ({ zeile, ort: `${datei}:${index + 1}` }))
          .filter(({ zeile }) => KLARTEXTSUCHE.test(zeile))
          .map(({ ort, zeile }) => `${ort}  ${zeile.trim()}`)
      );

    expect(fundstellen).toEqual([]);
  });
});

describe('gleicherFallcode', () => {
  it('vergleicht in konstanter Zeit, aber inhaltlich korrekt', () => {
    expect(gleicherFallcode('PF-ABCD-1234', 'PF-ABCD-1234')).toBe(true);
    expect(gleicherFallcode('PF-ABCD-1234', 'PF-ABCD-1235')).toBe(false);
    expect(gleicherFallcode('PF-ABCD-1234', 'PF-ABCD-123')).toBe(false);
    expect(gleicherFallcode(null, 'PF-ABCD-1234')).toBe(false);
    expect(gleicherFallcode('PF-ABCD-1234', null)).toBe(false);
  });
});
