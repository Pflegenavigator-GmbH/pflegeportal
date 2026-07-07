import { describe, it, expect } from 'vitest';

import { isRTL, getTextDirection } from './rtl';

describe('RTL Utilities', () => {
  it('sollte Arabisch korrekt als RTL identifizieren', () => {
    expect(isRTL('ar')).toBe(true);
    expect(getTextDirection('ar')).toBe('rtl');
  });

  it('sollte Deutsch als LTR identifizieren', () => {
    expect(isRTL('de')).toBe(false);
    expect(getTextDirection('de')).toBe('ltr');
  });
});
