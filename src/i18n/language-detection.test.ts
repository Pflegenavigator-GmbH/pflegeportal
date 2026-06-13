import { describe, it, expect, vi, beforeEach } from 'vitest';

import { detectBrowserLanguage } from './language-detection';

describe('Language Detection', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', {});
  });

  it('sollte standardmäßig "de" zurückgeben, wenn keine navigator-Daten vorhanden sind', () => {
    expect(detectBrowserLanguage()).toBe('de');
  });

  it('sollte die Browser-Sprache korrekt erkennen (z.B. "en-US" -> "en")', () => {
    vi.stubGlobal('navigator', { languages: ['en-US'] });
    expect(detectBrowserLanguage()).toBe('en');
  });

  it('sollte auf "de" zurückfallen, wenn eine unbekannte Sprache erkannt wird', () => {
    vi.stubGlobal('navigator', { languages: ['xx-XX'] });
    expect(detectBrowserLanguage()).toBe('de');
  });

  it('sollte die Browser-Sprache korrekt erkennen', () => {
    // Stelle sicher, dass die Liste nur Strings enthält
    vi.stubGlobal('navigator', { languages: ['en-US'] });
    expect(detectBrowserLanguage()).toBe('en');
  });
});
