import { describe, expect, it } from 'vitest';

import { cacheSchluessel, istCachebar } from './edge-cache';

describe('Edge-Cache Allowlist (Sicherheitsinvariante)', () => {
  it('gibt öffentlichen Gesetzestext frei', () => {
    expect(istCachebar('/api/gesetze')).toBe(true);
    expect(istCachebar('/api/gesetze/xi/15')).toBe(true);
    expect(istCachebar('/api/gesetze/v/27')).toBe(true);
  });

  it('cacht NIEMALS fallbezogene oder session-gebundene Routen', () => {
    // Diese liefern pro Nutzer unterschiedliche Daten — ein geteilter Cache
    // wäre ein Cross-User-Datenleck. Der Test schützt die Kern-Invariante.
    for (const pfad of [
      '/api/cases/PF-1663-4638',
      '/api/cases/PF-1663-4638/result',
      '/api/cases/PF-1663-4638/status',
      '/api/cases/PF-1663-4638/answers',
      '/api/cases/PF-1663-4638/bescheid-datum',
      '/api/pdf/generate',
      '/api/checkout/create-session',
      '/api/stripe/webhook',
      '/api/tagebuch',
    ]) {
      expect(istCachebar(pfad)).toBe(false);
    }
  });

  it('lässt sich nicht durch einen Pfad austricksen, der nur mit dem Allowlist-Wort beginnt', () => {
    // '/api/gesetze-geheim' darf NICHT als '/api/gesetze' durchgehen.
    expect(istCachebar('/api/gesetzestrick')).toBe(false);
    expect(istCachebar('/api/gesetze-intern/cases')).toBe(false);
  });
});

describe('Cache-Schlüssel', () => {
  it('bindet den Pfad ein', () => {
    expect(cacheSchluessel('/api/gesetze', '')).toBe('mw:cache:/api/gesetze');
  });

  it('normalisiert die Query-Reihenfolge, damit dieselbe Anfrage denselben Eintrag trifft', () => {
    const a = cacheSchluessel('/api/gesetze', '?sgb=xi&detail=full');
    const b = cacheSchluessel('/api/gesetze', '?detail=full&sgb=xi');
    expect(a).toBe(b);
    expect(a).toBe('mw:cache:/api/gesetze?detail=full&sgb=xi');
  });

  it('unterscheidet verschiedene Query-Werte', () => {
    expect(cacheSchluessel('/api/gesetze', '?sgb=xi')).not.toBe(
      cacheSchluessel('/api/gesetze', '?sgb=v')
    );
  });
});
