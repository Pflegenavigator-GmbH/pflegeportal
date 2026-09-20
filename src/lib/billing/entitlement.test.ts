import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FREISCHALTUNG_TTL_MS, ladeFreischaltung, verwerfeFreischaltung } from './entitlement';

/** Antwort des /status-Endpunkts nachbilden. */
const antwort = (isUnlocked: boolean) =>
  ({
    ok: true,
    status: 200,
    json: async () => ({ success: true, data: { isUnlocked } }),
  }) as Response;

const fehlerAntwort = (status: number) =>
  ({ ok: false, status, json: async () => ({}) }) as Response;

describe('Freischaltungs-Cache', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    verwerfeFreischaltung();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('meldet ohne Sitzung "kein-fall" — der Server entscheidet das, nicht der Client', async () => {
    fetchMock.mockResolvedValue(fehlerAntwort(401));

    expect(await ladeFreischaltung()).toEqual({ status: 'gesperrt', grund: 'kein-fall' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('liefert freigeschaltet und fragt beim zweiten Mal aus dem Cache', async () => {
    fetchMock.mockResolvedValue(antwort(true));

    expect(await ladeFreischaltung()).toEqual({ status: 'freigeschaltet' });
    expect(await ladeFreischaltung()).toEqual({ status: 'freigeschaltet' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('meldet einen unbezahlten Fall als gesperrt', async () => {
    fetchMock.mockResolvedValue(antwort(false));

    expect(await ladeFreischaltung()).toEqual({
      status: 'gesperrt',
      grund: 'nicht-bezahlt',
    });
  });

  it('bündelt gleichzeitige Anfragen zu einem einzigen Aufruf', async () => {
    fetchMock.mockResolvedValue(antwort(true));

    const ergebnisse = await Promise.all([
      ladeFreischaltung(),
      ladeFreischaltung(),
      ladeFreischaltung(),
    ]);

    expect(ergebnisse.every((e) => e.status === 'freigeschaltet')).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('fragt nach Ablauf der Gültigkeitsdauer erneut an', async () => {
    fetchMock.mockResolvedValue(antwort(true));
    await ladeFreischaltung();

    vi.setSystemTime(Date.now() + FREISCHALTUNG_TTL_MS + 1);
    await ladeFreischaltung();

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('erkennt eine zwischenzeitliche Zahlung nach dem Verwerfen', async () => {
    fetchMock.mockResolvedValueOnce(antwort(false)).mockResolvedValueOnce(antwort(true));

    expect((await ladeFreischaltung()).status).toBe('gesperrt');

    verwerfeFreischaltung();

    expect((await ladeFreischaltung()).status).toBe('freigeschaltet');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('erzwingt auf Wunsch eine frische Prüfung', async () => {
    fetchMock.mockResolvedValue(antwort(true));

    await ladeFreischaltung();
    await ladeFreischaltung({ erzwingeNeuladen: true });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('wertet einen Netzfehler als unbekannt und merkt ihn sich nicht', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(antwort(true));

    // Ein Ausfall darf zahlende Nutzer weder aussperren noch dauerhaft
    // festgeschrieben werden.
    expect(await ladeFreischaltung()).toEqual({ status: 'unbekannt' });
    expect(await ladeFreischaltung()).toEqual({ status: 'freigeschaltet' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('behandelt einen Serverfehler als unbekannt, fehlenden Zugriff als gesperrt', async () => {
    fetchMock.mockResolvedValueOnce(fehlerAntwort(503));
    expect(await ladeFreischaltung()).toEqual({ status: 'unbekannt' });

    verwerfeFreischaltung();
    fetchMock.mockResolvedValueOnce(fehlerAntwort(401));
    expect(await ladeFreischaltung()).toEqual({ status: 'gesperrt', grund: 'kein-fall' });
  });

  it('kennt genau einen Status je Gerät', async () => {
    // Vorher lag der Cache je Fallcode. Seit #135 hat ein Gerät genau eine
    // Sitzung — ein zweiter Fall entsteht erst, wenn die Sitzung wechselt, und
    // dann verwirft `verwerfeFreischaltung` den Eintrag.
    fetchMock.mockResolvedValueOnce(antwort(true)).mockResolvedValueOnce(antwort(false));

    expect((await ladeFreischaltung()).status).toBe('freigeschaltet');
    verwerfeFreischaltung();
    expect((await ladeFreischaltung()).status).toBe('gesperrt');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
