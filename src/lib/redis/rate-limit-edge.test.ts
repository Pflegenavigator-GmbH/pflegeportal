import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Ohne Upstash-Env fällt das Modul auf den In-Memory-Limiter zurück — genau
// dieser Pfad wird hier geprüft (Env ist in Tests nicht gesetzt).
import { RATE_LIMIT_MAX, rateLimit } from './rate-limit-edge';

describe('rateLimit (In-Memory-Fallback ohne Redis)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-01T12:00:00Z'));
  });

  afterEach(() => vi.useRealTimers());

  it('lässt Anfragen bis zum Limit durch und blockt danach', async () => {
    const ip = `1.2.3.${Math.floor(Math.random() * 1000)}`;

    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      const ergebnis = await rateLimit(ip);
      expect(ergebnis.erlaubt).toBe(true);
    }

    const ueberschritten = await rateLimit(ip);
    expect(ueberschritten.erlaubt).toBe(false);
    expect(ueberschritten.verbleibend).toBe(0);
  });

  it('trennt verschiedene IPs', async () => {
    const a = `10.0.0.${Math.floor(Math.random() * 1000)}`;
    const b = `10.0.1.${Math.floor(Math.random() * 1000)}`;

    for (let i = 0; i < RATE_LIMIT_MAX; i++) await rateLimit(a);

    expect((await rateLimit(a)).erlaubt).toBe(false);
    expect((await rateLimit(b)).erlaubt).toBe(true);
  });

  it('meldet ein plausibles Reset-Fenster in der Zukunft', async () => {
    const { reset } = await rateLimit(`9.9.9.${Math.floor(Math.random() * 1000)}`);
    expect(reset).toBeGreaterThan(Date.now());
  });
});
