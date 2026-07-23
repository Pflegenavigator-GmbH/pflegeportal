import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  FREISCHALTUNG_TTL_MS,
  istGueltigerFallcode,
  ladeFreischaltung,
  verwerfeFreischaltung,
} from './entitlement';

const FALLCODE = 'PF-1663-4638';

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

  it('erkennt gültige und ungültige Fallcodes', () => {
    expect(istGueltigerFallcode(FALLCODE)).toBe(true);
    expect(istGueltigerFallcode('pf-1663-4638')).toBe(true); // Groß-/Kleinschreibung egal
    expect(istGueltigerFallcode('OFFLINE_WD')).toBe(false);
    expect(istGueltigerFallcode(null)).toBe(false);
    expect(istGueltigerFallcode('')).toBe(false);
  });

  it('fragt ohne gültigen Fallcode gar nicht erst an', async () => {
    const ergebnis = await ladeFreischaltung(null);

    expect(ergebnis).toEqual({ status: 'gesperrt', grund: 'kein-fall' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('liefert freigeschaltet und fragt beim zweiten Mal aus dem Cache', async () => {
    fetchMock.mockResolvedValue(antwort(true));

    expect(await ladeFreischaltung(FALLCODE)).toEqual({ status: 'freigeschaltet' });
    expect(await ladeFreischaltung(FALLCODE)).toEqual({ status: 'freigeschaltet' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('meldet einen unbezahlten Fall als gesperrt', async () => {
    fetchMock.mockResolvedValue(antwort(false));

    expect(await ladeFreischaltung(FALLCODE)).toEqual({
      status: 'gesperrt',
      grund: 'nicht-bezahlt',
    });
  });

  it('bündelt gleichzeitige Anfragen zu einem einzigen Aufruf', async () => {
    fetchMock.mockResolvedValue(antwort(true));

    const ergebnisse = await Promise.all([
      ladeFreischaltung(FALLCODE),
      ladeFreischaltung(FALLCODE),
      ladeFreischaltung(FALLCODE),
    ]);

    expect(ergebnisse.every((e) => e.status === 'freigeschaltet')).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('fragt nach Ablauf der Gültigkeitsdauer erneut an', async () => {
    fetchMock.mockResolvedValue(antwort(true));
    await ladeFreischaltung(FALLCODE);

    vi.setSystemTime(Date.now() + FREISCHALTUNG_TTL_MS + 1);
    await ladeFreischaltung(FALLCODE);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('erkennt eine zwischenzeitliche Zahlung nach dem Verwerfen', async () => {
    fetchMock.mockResolvedValueOnce(antwort(false)).mockResolvedValueOnce(antwort(true));

    expect((await ladeFreischaltung(FALLCODE)).status).toBe('gesperrt');

    verwerfeFreischaltung(FALLCODE);

    expect((await ladeFreischaltung(FALLCODE)).status).toBe('freigeschaltet');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('erzwingt auf Wunsch eine frische Prüfung', async () => {
    fetchMock.mockResolvedValue(antwort(true));

    await ladeFreischaltung(FALLCODE);
    await ladeFreischaltung(FALLCODE, { erzwingeNeuladen: true });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('wertet einen Netzfehler als unbekannt und merkt ihn sich nicht', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(antwort(true));

    // Ein Ausfall darf zahlende Nutzer weder aussperren noch dauerhaft
    // festgeschrieben werden.
    expect(await ladeFreischaltung(FALLCODE)).toEqual({ status: 'unbekannt' });
    expect(await ladeFreischaltung(FALLCODE)).toEqual({ status: 'freigeschaltet' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('behandelt einen Serverfehler als unbekannt, fehlenden Zugriff als gesperrt', async () => {
    fetchMock.mockResolvedValueOnce(fehlerAntwort(503));
    expect(await ladeFreischaltung(FALLCODE)).toEqual({ status: 'unbekannt' });

    verwerfeFreischaltung();
    fetchMock.mockResolvedValueOnce(fehlerAntwort(401));
    expect(await ladeFreischaltung(FALLCODE)).toEqual({ status: 'gesperrt', grund: 'kein-fall' });
  });

  it('hält Fälle getrennt', async () => {
    const andererFall = 'PF-AAAA-BBBB';
    fetchMock.mockResolvedValueOnce(antwort(true)).mockResolvedValueOnce(antwort(false));

    expect((await ladeFreischaltung(FALLCODE)).status).toBe('freigeschaltet');
    expect((await ladeFreischaltung(andererFall)).status).toBe('gesperrt');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
