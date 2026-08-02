import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CASE_CODE_EVENT, clearCaseData, getStoredCaseCode, storeCaseCode } from './case-storage';

/** Alles, was zu einem Fall gehört und verschwinden muss. */
const FALL_DATEN = {
  'pflegegrad-ergebnis': JSON.stringify({ grad: 3, punkte: 47.5 }),
  widersprueche_pipeline: JSON.stringify([{ id: 1, bescheidDatum: '2026-05-02' }]),
  pflege_zielgruppe: 'kind',
};

/** Geräteeinstellungen, die einen Fallwechsel überleben müssen. */
const GERAETE_DATEN = {
  user_consent: JSON.stringify({ essential: true, analytics: true, marketing: false }),
  'pf-a11y': JSON.stringify({ contrast: 'high', fontSize: 'large' }),
  'pflegenavigator-language': 'de',
};

function befuelleSpeicher() {
  for (const [k, v] of Object.entries({ ...FALL_DATEN, ...GERAETE_DATEN })) {
    localStorage.setItem(k, v);
  }
}

describe('case-storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('clearCaseData (Fall schließen)', () => {
    it('entfernt alle fallbezogenen Daten, nicht nur den Fallcode', () => {
      // Diese Daten haben Gesundheitsbezug (Art. 9 DSGVO). Auf einem geteilten
      // Rechner dürfen sie nicht zurückbleiben, wenn der Nutzer bewusst
      // schließt.
      storeCaseCode('PF-DELETE-ME');
      befuelleSpeicher();

      clearCaseData();

      expect(getStoredCaseCode()).toBeNull();
      for (const schluessel of Object.keys(FALL_DATEN)) {
        expect(localStorage.getItem(schluessel), `${schluessel} muss weg sein`).toBeNull();
      }
    });

    it('lässt Geräteeinstellungen unangetastet', () => {
      // Die Einwilligung zu löschen würde erneut fragen und einen Widerruf
      // aufheben; die Barrierefreiheits-Einstellungen zu löschen träfe genau
      // die Menschen, die darauf angewiesen sind.
      storeCaseCode('PF-DELETE-ME');
      befuelleSpeicher();

      clearCaseData();

      for (const [schluessel, wert] of Object.entries(GERAETE_DATEN)) {
        expect(localStorage.getItem(schluessel), `${schluessel} muss bleiben`).toBe(wert);
      }
    });

    it('meldet die Änderung an die Oberfläche', () => {
      const zuhoerer = vi.fn();
      window.addEventListener(CASE_CODE_EVENT, zuhoerer);

      clearCaseData();

      expect(zuhoerer).toHaveBeenCalled();
      window.removeEventListener(CASE_CODE_EVENT, zuhoerer);
    });
  });

  describe('storeCaseCode', () => {
    it('normalisiert auf Großschreibung und entfernt Leerzeichen', () => {
      storeCaseCode('  pf-abcd-1234  ');
      expect(getStoredCaseCode()).toBe('PF-ABCD-1234');
    });

    it('räumt beim Wechsel auf einen ANDEREN Fall die alten Daten weg', () => {
      storeCaseCode('PF-ALT-0001');
      befuelleSpeicher();

      storeCaseCode('PF-NEU-0002');

      // Sonst zeigte der neue Fall das Ergebnis des alten: Die Startseite
      // leitet auf /ergebnis um, sobald `pflegegrad-ergebnis` gesetzt ist —
      // egal zu welchem Fall der Eintrag gehört.
      expect(localStorage.getItem('pflegegrad-ergebnis')).toBeNull();
      expect(localStorage.getItem('widersprueche_pipeline')).toBeNull();
      expect(getStoredCaseCode()).toBe('PF-NEU-0002');
    });

    it('behält die Daten, wenn derselbe Fall erneut gesetzt wird', () => {
      // Passiert bei jedem Reload und beim Öffnen eines geteilten Links —
      // ein Aufräumen wäre hier Datenverlust ohne Grund.
      storeCaseCode('PF-GLEICH-1');
      befuelleSpeicher();

      storeCaseCode('pf-gleich-1'); // andere Schreibweise, gleicher Fall

      expect(localStorage.getItem('pflegegrad-ergebnis')).toBe(FALL_DATEN['pflegegrad-ergebnis']);
    });
  });

  it('ist serverseitig gefahrlos aufrufbar', () => {
    // getStoredCaseCode läuft auch in Server-Komponenten durch den Import.
    expect(() => getStoredCaseCode()).not.toThrow();
  });
});
