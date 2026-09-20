import { beforeEach, describe, expect, it } from 'vitest';

import { clearCaseData, ERGEBNIS_KEY, storeCaseCode } from '@/src/lib/case-storage';

import {
  entferneErgebnis,
  hatErgebnisFuerAktuellenFall,
  ladeErgebnis,
  speichereErgebnis,
} from './ergebnis-storage';

const ERGEBNIS = {
  careLevel: 3,
  totalScore: 47.5,
  benefits: { monthlyAmount: 599, reliefBudget: 131 },
};

describe('Ergebnis-Speicher (fallgebunden)', () => {
  beforeEach(() => {
    localStorage.clear();
    // Der Fallcode lebt seit #135 im Arbeitsspeicher des Moduls und übersteht
    // ein `localStorage.clear()` — er muss eigens zurückgesetzt werden.
    clearCaseData();
    localStorage.clear();
  });

  it('speichert und liest das Ergebnis des aktuellen Falls', () => {
    storeCaseCode('PF-AAAA-1111');
    speichereErgebnis(ERGEBNIS);

    expect(ladeErgebnis()).toEqual(ERGEBNIS);
    expect(hatErgebnisFuerAktuellenFall()).toBe(true);
  });

  it('gibt das Ergebnis eines FREMDEN Falls nicht heraus', () => {
    // Der eigentliche Fehler: Ohne Fallbezug hätte die Startseite hier auf die
    // Ergebnisseite umgeleitet und den Pflegegrad einer fremden Person gezeigt.
    storeCaseCode('PF-AAAA-1111');
    speichereErgebnis(ERGEBNIS);

    // Fremden Fall setzen, ohne das übliche Aufräumen — simuliert einen
    // künftigen Codepfad, der die Invariante bricht. Der Eintrag im Speicher
    // bleibt dabei absichtlich stehen.
    const gemerkt = localStorage.getItem(ERGEBNIS_KEY);
    storeCaseCode('PF-BBBB-2222');
    localStorage.setItem(ERGEBNIS_KEY, gemerkt ?? '');

    expect(ladeErgebnis()).toBeNull();
    expect(hatErgebnisFuerAktuellenFall()).toBe(false);
  });

  it('entfernt einen fremden Eintrag beim Lesen (Selbstheilung)', () => {
    storeCaseCode('PF-AAAA-1111');
    speichereErgebnis(ERGEBNIS);

    const gemerkt = localStorage.getItem(ERGEBNIS_KEY);
    storeCaseCode('PF-BBBB-2222');
    localStorage.setItem(ERGEBNIS_KEY, gemerkt ?? '');

    ladeErgebnis();

    // Die Altlast wird nicht bloß ignoriert, sondern beseitigt.
    expect(localStorage.getItem(ERGEBNIS_KEY)).toBeNull();
  });

  it('speichert nichts ohne bekannten Fallcode', () => {
    // Nach einem Neuladen ist der Code aus dem Arbeitsspeicher verschwunden
    // (#135). Ein Ergebnis ohne Zuordnung wäre beim Lesen ohnehin wertlos.
    speichereErgebnis(ERGEBNIS);

    expect(localStorage.getItem(ERGEBNIS_KEY)).toBeNull();
  });

  it('verträgt einen beschädigten Eintrag', () => {
    storeCaseCode('PF-AAAA-1111');
    localStorage.setItem(ERGEBNIS_KEY, '{kaputt');

    expect(ladeErgebnis()).toBeNull();
    expect(localStorage.getItem(ERGEBNIS_KEY)).toBeNull();
  });

  it('verwirft einen Eintrag im alten Format ohne Fallbezug', () => {
    // Bestandsdaten aus der Zeit vor dieser Änderung: lieber einmal neu
    // rechnen lassen als ein möglicherweise fremdes Ergebnis anzeigen.
    storeCaseCode('PF-AAAA-1111');
    localStorage.setItem(ERGEBNIS_KEY, JSON.stringify(ERGEBNIS));

    expect(ladeErgebnis()).toBeNull();
  });

  it('entfernt das Ergebnis beim Zurücksetzen der Begutachtung', () => {
    storeCaseCode('PF-AAAA-1111');
    speichereErgebnis(ERGEBNIS);

    entferneErgebnis();

    expect(hatErgebnisFuerAktuellenFall()).toBe(false);
  });

  it('überlebt den regulären Fallwechsel nicht', () => {
    // Zusammenspiel mit dem Aufräumen in storeCaseCode — beide Schutzschichten
    // greifen, nicht nur eine.
    storeCaseCode('PF-AAAA-1111');
    speichereErgebnis(ERGEBNIS);

    storeCaseCode('PF-BBBB-2222');

    expect(localStorage.getItem(ERGEBNIS_KEY)).toBeNull();
  });
});
