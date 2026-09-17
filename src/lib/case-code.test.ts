// src/lib/case-code.test.ts
import { describe, expect, it } from 'vitest';

import { CASE_CODE_PATTERN, istGueltigerFallcode, normalizeCaseCode } from './case-code';

describe('normalizeCaseCode (#153)', () => {
  it('bringt Groß- und Kleinschreibung sowie Leerraum auf die kanonische Form', () => {
    expect(normalizeCaseCode('  pf-abcd-1234  ')).toBe('PF-ABCD-1234');
    expect(normalizeCaseCode('PF-ABCD-1234')).toBe('PF-ABCD-1234');
  });

  it('weist ab, was nicht dem Format entspricht — statt es zurechtzubiegen', () => {
    // Ein zurechtgebogener Code träfe über den Hash einen ANDEREN Fall oder
    // gar keinen. Deshalb lieber ablehnen.
    for (const eingabe of [
      'PFABCD1234',
      'PF-ABC-1234',
      'PF-ABCD-12345',
      'XX-ABCD-1234',
      'PF-ABCD_1234',
      'PF-ÄBCD-1234',
      '',
      '   ',
      null,
      undefined,
    ]) {
      expect(normalizeCaseCode(eingabe), String(eingabe)).toBeNull();
    }
  });

  it('akzeptiert Bestandscodes mit verwechselbaren Zeichen', () => {
    // Neue Codes vermeiden 0/O und 1/I, alte enthalten sie — der Testfall
    // heißt PF-C1HB-FH1I. Die Prüfung darf ihn nicht aussperren.
    expect(normalizeCaseCode('PF-C1HB-FH1I')).toBe('PF-C1HB-FH1I');
    expect(normalizeCaseCode('PF-0O0O-1I1I')).toBe('PF-0O0O-1I1I');
  });

  it('ist die eine Regel — Muster und Prüffunktion sagen dasselbe', () => {
    expect(CASE_CODE_PATTERN.test('PF-ABCD-1234')).toBe(true);
    expect(istGueltigerFallcode('pf-abcd-1234')).toBe(true);
    expect(istGueltigerFallcode('ABCD1234')).toBe(false);
  });
});
