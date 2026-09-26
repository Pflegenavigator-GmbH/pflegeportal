import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Der Schalter greift nur, wenn Redis überhaupt konfiguriert ist. In Tests ist
// keine Upstash-Umgebung gesetzt, also wird der Client-Zustand vorgegeben.
vi.mock('./client', () => ({
  redis: {},
  istRedisAktiv: true,
}));

/**
 * Der Zustand liegt modulweit — je Laufzeit-Instanz genau einer. Für jeden
 * Test wird das Modul deshalb frisch geladen, statt eine Rücksetzfunktion
 * einzuführen, die es nur wegen der Tests gäbe.
 */
async function ladeSchalter() {
  vi.resetModules();
  return import('./verfuegbarkeit');
}

describe('Verfügbarkeitsschalter für Redis (#176)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-24T10:00:00Z'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('erlaubt Aufrufe, solange nichts fehlgeschlagen ist', async () => {
    const { redisVerfuegbar } = await ladeSchalter();
    expect(redisVerfuegbar()).toBe(true);
  });

  it('überspringt nach einem Fehlschlag jeden weiteren Aufruf der Sperrzeit', async () => {
    const { redisVerfuegbar, meldeRedisAusfall } = await ladeSchalter();

    meldeRedisAusfall('rate-limit', new Error('ENOTFOUND'));

    // Das ist der Kern des Tickets: Ohne diese Sperre zahlte jede einzelne
    // API-Anfrage erneut für denselben toten Host.
    for (let i = 0; i < 50; i++) {
      expect(redisVerfuegbar()).toBe(false);
    }
  });

  it('wagt nach Ablauf der Sperre genau einen Versuch', async () => {
    const { redisVerfuegbar, meldeRedisAusfall, SPERRDAUER_MS } = await ladeSchalter();

    meldeRedisAusfall('rate-limit', new Error('ENOTFOUND'));
    vi.advanceTimersByTime(SPERRDAUER_MS);

    expect(redisVerfuegbar()).toBe(true);
    // Der Versuch verlängert die Sperre sofort wieder, sonst liefen alle
    // gleichzeitigen Anfragen gemeinsam gegen den toten Host.
    expect(redisVerfuegbar()).toBe(false);
  });

  it('gibt Redis nach einem geglückten Versuch wieder frei', async () => {
    const { redisVerfuegbar, meldeRedisAusfall, meldeRedisErfolg, SPERRDAUER_MS } =
      await ladeSchalter();

    meldeRedisAusfall('rate-limit', new Error('ENOTFOUND'));
    vi.advanceTimersByTime(SPERRDAUER_MS);

    expect(redisVerfuegbar()).toBe(true);
    meldeRedisErfolg();

    expect(redisVerfuegbar()).toBe(true);
    expect(redisVerfuegbar()).toBe(true);
  });

  it('meldet den Ausfall einmal je Sperrzeit statt bei jeder Anfrage', async () => {
    const { redisVerfuegbar, meldeRedisAusfall, SPERRDAUER_MS } = await ladeSchalter();

    meldeRedisAusfall('rate-limit', new Error('ENOTFOUND'));
    for (let i = 0; i < 20; i++) redisVerfuegbar();

    expect(console.error).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(SPERRDAUER_MS);
    redisVerfuegbar();
    meldeRedisAusfall('rate-limit', new Error('ENOTFOUND'));

    expect(console.error).toHaveBeenCalledTimes(2);
  });

  it('nennt in der Meldung die Zahl der übersprungenen Aufrufe', async () => {
    const { redisVerfuegbar, meldeRedisAusfall, SPERRDAUER_MS } = await ladeSchalter();

    meldeRedisAusfall('cache-lesen', new Error('ENOTFOUND'));
    for (let i = 0; i < 7; i++) redisVerfuegbar();

    vi.advanceTimersByTime(SPERRDAUER_MS);
    redisVerfuegbar();
    meldeRedisAusfall('cache-lesen', new Error('ENOTFOUND'));

    const letzteMeldung = vi.mocked(console.error).mock.calls.at(-1)?.[0] as string;
    expect(letzteMeldung).toContain('7');
    expect(letzteMeldung).toContain('degradiert');
  });

  it('meldet die Erholung', async () => {
    const { meldeRedisAusfall, meldeRedisErfolg } = await ladeSchalter();

    meldeRedisAusfall('rate-limit', new Error('ENOTFOUND'));
    meldeRedisErfolg();

    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(vi.mocked(console.warn).mock.calls[0][0]).toContain('erholt');
  });

  it('schweigt, solange alles läuft', async () => {
    const { redisVerfuegbar, meldeRedisErfolg } = await ladeSchalter();

    for (let i = 0; i < 20; i++) {
      redisVerfuegbar();
      meldeRedisErfolg();
    }

    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('gibt den Zustand für die Diagnose aus', async () => {
    const { meldeRedisAusfall, redisZustand, redisVerfuegbar } = await ladeSchalter();

    expect(redisZustand()).toMatchObject({ konfiguriert: true, nutzbar: true, gesperrtBis: null });

    meldeRedisAusfall('rate-limit', new Error('ENOTFOUND'));
    redisVerfuegbar();

    const zustand = redisZustand();
    expect(zustand.nutzbar).toBe(false);
    expect(zustand.gesperrtBis).toBeGreaterThan(Date.now());
    expect(zustand.uebersprungeneAufrufe).toBe(1);
  });
});
