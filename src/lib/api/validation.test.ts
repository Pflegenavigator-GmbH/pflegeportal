// src/lib/api/validation.test.ts
import { describe, it, expect } from 'vitest';

import {
  isSafeObjectKey,
  isValidEmail,
  isValidQuestionKey,
  isValidTagebuchEntryKey,
  withKey,
  withoutKey,
} from './validation';

describe('isSafeObjectKey', () => {
  it('sperrt die Prototype-Pollution-Schlüssel', () => {
    expect(isSafeObjectKey('__proto__')).toBe(false);
    expect(isSafeObjectKey('constructor')).toBe(false);
    expect(isSafeObjectKey('prototype')).toBe(false);
    expect(isSafeObjectKey('m1_frage')).toBe(true);
  });
});

describe('isValidQuestionKey', () => {
  it('akzeptiert die realen Frageschlüssel der Module', () => {
    for (const key of ['m1_frage_1', 'm5_2', 'haushalt', 'k_mob_1', 'kinder_assessment_data']) {
      expect(isValidQuestionKey(key)).toBe(true);
    }
  });

  it('lehnt gefährliche oder unförmige Schlüssel ab', () => {
    for (const key of [
      '__proto__',
      'constructor',
      'prototype',
      '',
      ' m1',
      'a'.repeat(101),
      'x y',
    ]) {
      expect(isValidQuestionKey(key)).toBe(false);
    }
  });
});

describe('isValidTagebuchEntryKey', () => {
  it('akzeptiert nur das eigene entry_<Zeitstempel>-Format', () => {
    expect(isValidTagebuchEntryKey(`entry_${Date.now()}`)).toBe(true);
    expect(isValidTagebuchEntryKey('entry_1')).toBe(true);
    expect(isValidTagebuchEntryKey('entry_')).toBe(false);
    expect(isValidTagebuchEntryKey('entry_abc')).toBe(false);
    expect(isValidTagebuchEntryKey('__proto__')).toBe(false);
    expect(isValidTagebuchEntryKey('constructor')).toBe(false);
  });
});

describe('withKey', () => {
  it('fügt einen Schlüssel hinzu und lässt die Quelle unverändert', () => {
    const source = { a: 1 };
    const result = withKey(source, 'entry_1', 42);
    expect(result).toEqual({ a: 1, entry_1: 42 });
    expect(source).toEqual({ a: 1 }); // unverändert
  });

  it('überschreibt einen bestehenden Schlüssel', () => {
    expect(withKey({ a: 1 }, 'a', 9)).toEqual({ a: 9 });
  });

  it('verschmutzt bei gefährlichem Schlüssel niemals den Prototyp', () => {
    const result = withKey<unknown>({}, '__proto__', { polluted: true });
    // __proto__ wird als eigene Eigenschaft angelegt (Object.fromEntries), nicht im Prototyp
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
  });
});

describe('withoutKey', () => {
  it('entfernt einen Schlüssel und lässt die Quelle unverändert', () => {
    const source = { a: 1, b: 2 };
    expect(withoutKey(source, 'a')).toEqual({ b: 2 });
    expect(source).toEqual({ a: 1, b: 2 });
  });

  it('ist unkritisch bei fehlenden oder gefährlichen Schlüsseln', () => {
    expect(withoutKey({ a: 1 }, 'missing')).toEqual({ a: 1 });
    expect(() => withoutKey({ a: 1 }, '__proto__')).not.toThrow();
  });
});

describe('isValidEmail', () => {
  it('akzeptiert übliche Adressen', () => {
    for (const email of ['a@b.de', 'max.mustermann+test@sub.example.co.uk', 'x_1%y@foo-bar.org']) {
      expect(isValidEmail(email)).toBe(true);
    }
  });

  it('lehnt ungültige Adressen ab', () => {
    for (const email of ['', 'foo', 'foo@bar', 'foo@bar.', '@bar.de', 'a b@c.de', 'a@b@c.de']) {
      expect(isValidEmail(email)).toBe(false);
    }
  });

  it('lehnt überlange Eingaben sofort ab (ReDoS-Schutz)', () => {
    const long = `${'a'.repeat(300)}@example.com`;
    const start = performance.now();
    expect(isValidEmail(long)).toBe(false);
    // Angriffs-typische Eingabe: viele Punkte ohne Match-Möglichkeit
    expect(isValidEmail(`a@${'b.'.repeat(120)}`)).toBe(false);
    expect(performance.now() - start).toBeLessThan(50);
  });
});
