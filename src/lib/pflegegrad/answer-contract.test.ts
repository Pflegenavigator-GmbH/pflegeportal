import { describe, expect, it } from 'vitest';

import { istErlaubteErwachsenenAntwort, pruefeErwachsenenAntworten } from './answer-contract';

describe('Erwachsenen-Antwortvertrag', () => {
  const modul1 = { m1_1: '0', m1_2: '1', m1_3: '2', m1_4: '3' };
  const modul6 = {
    haushalt: 'selbst',
    einkaufen: 'online_begleitung',
    kochen: 'teilweise',
    finanzen: 'voll',
    entscheidungen: 'beratung',
  };

  it('akzeptiert vollständige Standard- und Modul-6-Antworten', () => {
    expect(pruefeErwachsenenAntworten(1, modul1, true)).toBeNull();
    expect(pruefeErwachsenenAntworten(6, modul6, true)).toBeNull();
  });

  it('lehnt modulfremde Zusatzschlüssel ab', () => {
    expect(pruefeErwachsenenAntworten(1, { ...modul1, extra_1: '3' }, true)).toContain(
      'gehört nicht zu Modul 1'
    );
  });

  it('lehnt fehlende Pflichtantworten und ungültige Werte ab', () => {
    expect(pruefeErwachsenenAntworten(1, { m1_1: '0' }, true)).toContain('Pflichtantwort');
    expect(pruefeErwachsenenAntworten(6, { ...modul6, haushalt: 'ja' }, true)).toContain(
      'Ungültiger Antwortwert'
    );
  });

  it('erlaubt der Modul-3-UI alle tatsächlich angebotenen Werte 0–3', () => {
    expect(istErlaubteErwachsenenAntwort(3, 'm3_1', '2')).toBe(true);
  });

  it('prüft beim Legacy-Einzelpfad nur das übermittelte Feld', () => {
    expect(pruefeErwachsenenAntworten(2, { m2_3: 2 }, false)).toBeNull();
  });
});
