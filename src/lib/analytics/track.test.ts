import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { speichereEinwilligung, NUR_ESSENZIELL } from '@/src/lib/consent';

import { EREIGNISSE } from './events';
import { pfadOhneParameter, verfolge, verfolgeEinmalig, verfolgeSeitenaufruf } from './track';

const MIT_EINWILLIGUNG = { essential: true, analytics: true, marketing: false } as const;

/** Umami-Skript nachbilden, als wäre es geladen. */
function umamiLaden() {
  const track = vi.fn();
  (window as unknown as { umami: { track: typeof track } }).umami = { track };
  return track;
}

function umamiEntfernen() {
  delete (window as unknown as { umami?: unknown }).umami;
}

describe('Analytics-Versand', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    umamiEntfernen();
  });

  afterEach(() => {
    umamiEntfernen();
  });

  describe('Einwilligung ist Voraussetzung (AC 2/AC 3)', () => {
    it('sendet nichts, solange nicht entschieden wurde', () => {
      const track = umamiLaden();

      verfolge(EREIGNISSE.rechnerGestartet, { einstieg: 'neu' });
      verfolgeSeitenaufruf('/de/pflegegrad/start');

      expect(track).not.toHaveBeenCalled();
    });

    it('sendet nichts bei ausdrücklicher Ablehnung', () => {
      const track = umamiLaden();
      speichereEinwilligung(NUR_ESSENZIELL);

      verfolge(EREIGNISSE.checkoutAufgerufen, { paket: 'premium' });

      expect(track).not.toHaveBeenCalled();
    });

    it('sendet nach erteilter Einwilligung', () => {
      const track = umamiLaden();
      speichereEinwilligung(MIT_EINWILLIGUNG);

      verfolge(EREIGNISSE.checkoutAufgerufen, { paket: 'premium' });

      expect(track).toHaveBeenCalledWith('checkout_aufgerufen', { paket: 'premium' });
    });

    it('stoppt sofort nach dem Widerruf — nicht erst beim nächsten Seitenaufruf', () => {
      const track = umamiLaden();
      speichereEinwilligung(MIT_EINWILLIGUNG);
      verfolge(EREIGNISSE.rechnerGestartet, { einstieg: 'neu' });
      expect(track).toHaveBeenCalledTimes(1);

      // Das Skript bleibt im Speicher — nur die Prüfung stoppt den Versand.
      speichereEinwilligung(NUR_ESSENZIELL);
      verfolge(EREIGNISSE.rechnerGestartet, { einstieg: 'geladen' });
      verfolgeSeitenaufruf('/de/impressum');

      expect(track).toHaveBeenCalledTimes(1);
    });
  });

  describe('kein Fallcode in der Reichweitenmessung', () => {
    it('entfernt Query-String und Fragment aus dem Pfad', () => {
      // Der Fallcode ist der Zugangsschlüssel zum Gutachten — er darf einen
      // Analyse-Dienst nie erreichen.
      expect(pfadOhneParameter('/de/pflegegrad/start?check_code=PF-1663-4638')).toBe(
        '/de/pflegegrad/start'
      );
      expect(pfadOhneParameter('/de/pflegegrad/start?session_id=cs_test_a1b2#oben')).toBe(
        '/de/pflegegrad/start'
      );
      expect(pfadOhneParameter('/de/presse')).toBe('/de/presse');
    });

    it('meldet den Seitenaufruf ohne Parameter', () => {
      const track = umamiLaden();
      speichereEinwilligung(MIT_EINWILLIGUNG);

      verfolgeSeitenaufruf('/de/pflegegrad/start?check_code=PF-1663-4638&session_id=cs_test');

      const anpassen = track.mock.calls[0][0] as (
        e: Record<string, unknown>
      ) => Record<string, unknown>;
      const gesendet = anpassen({ url: '/ignoriert', website: 'abc' });

      expect(gesendet.url).toBe('/de/pflegegrad/start');
      expect(JSON.stringify(gesendet)).not.toContain('PF-1663-4638');
      expect(JSON.stringify(gesendet)).not.toContain('cs_test');
    });
  });

  describe('Robustheit', () => {
    it('bleibt still, wenn das Skript gar nicht geladen ist', () => {
      speichereEinwilligung(MIT_EINWILLIGUNG);

      // Kein window.umami — z.B. durch einen Ad-Blocker verhindert.
      expect(() => verfolge(EREIGNISSE.rechnerGestartet, { einstieg: 'neu' })).not.toThrow();
    });

    it('lässt einen Fehler im Analyse-Skript nicht in die App durch', () => {
      speichereEinwilligung(MIT_EINWILLIGUNG);
      (window as unknown as { umami: unknown }).umami = {
        track: () => {
          throw new Error('Netzwerkfehler');
        },
      };

      expect(() => verfolge(EREIGNISSE.kaufErfolgreich, { freigeschaltet: true })).not.toThrow();
    });
  });

  describe('verfolgeEinmalig', () => {
    it('zählt denselben Vorgang nur einmal', () => {
      const track = umamiLaden();
      speichereEinwilligung(MIT_EINWILLIGUNG);

      // Zweiter Aufruf = Reload mit derselben session_id in der URL.
      verfolgeEinmalig(EREIGNISSE.kaufErfolgreich, 'cs_test_123', { freigeschaltet: true });
      verfolgeEinmalig(EREIGNISSE.kaufErfolgreich, 'cs_test_123', { freigeschaltet: true });

      expect(track).toHaveBeenCalledTimes(1);
    });

    it('zählt einen zweiten Kauf getrennt', () => {
      const track = umamiLaden();
      speichereEinwilligung(MIT_EINWILLIGUNG);

      verfolgeEinmalig(EREIGNISSE.kaufErfolgreich, 'cs_test_123', { freigeschaltet: true });
      verfolgeEinmalig(EREIGNISSE.kaufErfolgreich, 'cs_test_456', { freigeschaltet: true });

      expect(track).toHaveBeenCalledTimes(2);
    });

    it('merkt sich ohne Einwilligung nichts — eine spätere Zustimmung zählt noch', () => {
      const track = umamiLaden();

      verfolgeEinmalig(EREIGNISSE.kaufErfolgreich, 'cs_test_123', { freigeschaltet: true });
      expect(track).not.toHaveBeenCalled();

      speichereEinwilligung(MIT_EINWILLIGUNG);
      verfolgeEinmalig(EREIGNISSE.kaufErfolgreich, 'cs_test_123', { freigeschaltet: true });

      expect(track).toHaveBeenCalledTimes(1);
    });
  });
});
