import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Eigene Datei, weil hier — anders als in `rate-limit-edge.test.ts` — ein
 * konfiguriertes, aber gestörtes Redis nachgestellt wird. Genau dieser Fall
 * lag in Produktion vor (#176): Zugangsdaten gesetzt, Host nicht auflösbar.
 */
const limitAufruf = vi.fn();

vi.mock('./client', () => ({
  redis: {},
  istRedisAktiv: true,
}));

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: class {
    static slidingWindow = () => ({});
    limit = limitAufruf;
  },
}));

async function ladeModule() {
  vi.resetModules();
  return {
    rateLimitModul: await import('./rate-limit-edge'),
    schalter: await import('./verfuegbarkeit'),
  };
}

describe('Rate-Limit bei gestörtem Redis (#176)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-24T10:00:00Z'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    limitAufruf.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('versucht Redis nur einmal, nicht bei jeder Anfrage', async () => {
    limitAufruf.mockRejectedValue(new Error('getaddrinfo ENOTFOUND'));
    const { rateLimitModul } = await ladeModule();

    for (let i = 0; i < 30; i++) {
      await rateLimitModul.rateLimit('203.0.113.7');
    }

    expect(limitAufruf).toHaveBeenCalledTimes(1);
  });

  it('begrenzt weiter — prozesslokal statt verteilt', async () => {
    limitAufruf.mockRejectedValue(new Error('getaddrinfo ENOTFOUND'));
    const { rateLimitModul } = await ladeModule();
    const ip = `198.51.100.${Math.floor(Math.random() * 1000)}`;

    for (let i = 0; i < rateLimitModul.RATE_LIMIT_MAX; i++) {
      expect((await rateLimitModul.rateLimit(ip)).erlaubt).toBe(true);
    }

    // Ein Ausfall darf das Limit nicht aushebeln; er verkleinert nur seine
    // Reichweite auf diese Instanz.
    expect((await rateLimitModul.rateLimit(ip)).erlaubt).toBe(false);
  });

  it('nimmt Redis wieder in Betrieb, sobald es antwortet', async () => {
    limitAufruf.mockRejectedValue(new Error('getaddrinfo ENOTFOUND'));
    const { rateLimitModul, schalter } = await ladeModule();

    await rateLimitModul.rateLimit('192.0.2.1');
    expect(limitAufruf).toHaveBeenCalledTimes(1);

    limitAufruf.mockResolvedValue({ success: true, limit: 60, remaining: 59, reset: Date.now() });
    vi.advanceTimersByTime(schalter.SPERRDAUER_MS);

    const ergebnis = await rateLimitModul.rateLimit('192.0.2.1');

    expect(limitAufruf).toHaveBeenCalledTimes(2);
    expect(ergebnis.verbleibend).toBe(59);

    // Ab jetzt wieder jede Anfrage über Redis.
    await rateLimitModul.rateLimit('192.0.2.1');
    expect(limitAufruf).toHaveBeenCalledTimes(3);
  });
});
