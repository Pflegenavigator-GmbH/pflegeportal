import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  abonniereEinwilligung,
  EINWILLIGUNG_KEY,
  hatAnalyticsEinwilligung,
  leseEinwilligung,
  NUR_ESSENZIELL,
  parseEinwilligung,
  speichereEinwilligung,
  widerrufeEinwilligung,
} from './consent';

describe('Einwilligung', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('parseEinwilligung', () => {
    it('meldet „noch nicht entschieden" bei fehlendem Eintrag', () => {
      expect(parseEinwilligung(null)).toBeNull();
      expect(parseEinwilligung('')).toBeNull();
    });

    it('liest eine erteilte Analyse-Einwilligung', () => {
      expect(parseEinwilligung(JSON.stringify({ analytics: true }))?.analytics).toBe(true);
    });

    it('behandelt beschädigte Daten als „nicht entschieden", nicht als Zustimmung', () => {
      // Im Zweifel wird erneut gefragt — raten wäre hier die falsche Richtung.
      expect(parseEinwilligung('{kaputt')).toBeNull();
      expect(parseEinwilligung('"nur ein String"')).toBeNull();
      expect(parseEinwilligung('null')).toBeNull();
    });

    it('wertet nur echtes true als Zustimmung', () => {
      // Ein truthy-Wert wie "yes" oder 1 darf keine Einwilligung begründen.
      expect(parseEinwilligung(JSON.stringify({ analytics: 'yes' }))?.analytics).toBe(false);
      expect(parseEinwilligung(JSON.stringify({ analytics: 1 }))?.analytics).toBe(false);
    });

    it('lässt „essenziell" nicht abwählen', () => {
      expect(parseEinwilligung(JSON.stringify({ essential: false }))?.essential).toBe(true);
    });
  });

  describe('speichern und lesen', () => {
    it('legt die Auswahl ab und liest sie zurück', () => {
      speichereEinwilligung({ essential: true, analytics: true, marketing: false });

      expect(leseEinwilligung()).toEqual({
        essential: true,
        analytics: true,
        marketing: false,
      });
      expect(hatAnalyticsEinwilligung()).toBe(true);
    });

    it('benachrichtigt Zuhörer im selben Tab', () => {
      // Der eigentliche Bug zuvor: der Banner sendete einen anderen Event-Namen,
      // als der Hook abonniert hatte — Einwilligungen kamen nie an.
      const beiAenderung = vi.fn();
      const abbestellen = abonniereEinwilligung(beiAenderung);

      speichereEinwilligung({ essential: true, analytics: true, marketing: false });

      expect(beiAenderung).toHaveBeenCalledTimes(1);
      abbestellen();
    });

    it('meldet nach dem Abbestellen nichts mehr', () => {
      const beiAenderung = vi.fn();
      abonniereEinwilligung(beiAenderung)();

      speichereEinwilligung(NUR_ESSENZIELL);

      expect(beiAenderung).not.toHaveBeenCalled();
    });
  });

  describe('Widerruf (Art. 7 Abs. 3 DSGVO)', () => {
    it('entzieht die Analyse-Einwilligung sofort', () => {
      speichereEinwilligung({ essential: true, analytics: true, marketing: true });
      expect(hatAnalyticsEinwilligung()).toBe(true);

      widerrufeEinwilligung();

      expect(hatAnalyticsEinwilligung()).toBe(false);
      expect(leseEinwilligung()).toEqual(NUR_ESSENZIELL);
    });

    it('gilt als getroffene Entscheidung — der Banner kehrt nicht zurück', () => {
      widerrufeEinwilligung();

      // Nicht null: der Nutzer hat entschieden, nur eben ablehnend.
      expect(leseEinwilligung()).not.toBeNull();
      expect(localStorage.getItem(EINWILLIGUNG_KEY)).toBeTruthy();
    });

    it('benachrichtigt Zuhörer, damit laufendes Tracking sofort stoppt', () => {
      const beiAenderung = vi.fn();
      const abbestellen = abonniereEinwilligung(beiAenderung);

      widerrufeEinwilligung();

      expect(beiAenderung).toHaveBeenCalled();
      abbestellen();
    });
  });

  it('verträgt einen blockierten Speicher (privater Modus)', () => {
    const spion = vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });

    // Kein Absturz, sondern die datenschutzfreundliche Voreinstellung.
    expect(() => leseEinwilligung()).not.toThrow();
    expect(hatAnalyticsEinwilligung()).toBe(false);

    spion.mockRestore();
  });
});
