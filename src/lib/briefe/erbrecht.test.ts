import { describe, it, expect } from 'vitest';

import { erbrechtGenerator, ErbrechtData } from './erbrecht';

describe('ErbrechtGenerator', () => {
  const mockData: ErbrechtData = {
    empfaenger: { name: 'Notar Schmidt', strasse: 'Hauptstr 1', plz: '12345', ort: 'Berlin' },
    erblasser: {
      name: 'Max Mustermann',
      strasse: 'Testweg 1',
      plz: '54321',
      ort: 'München',
      telefon: '0123',
      geburtsdatum: '01.01.1950',
      familienstand: 'verheiratet',
    },
    verfahrensart: 'testament',
    erben: [{ name: 'Erika Mustermann', verwandtschaftsgrad: 'Ehefrau', vermoegensanteil: 50 }],
    vermoegen: { gesamtwert: 100000, immobilien: 50000 },
  };

  it('sollte ein valides Testament-Anschreiben generieren', () => {
    const brief = erbrechtGenerator.generateBrief(mockData);

    // Prüfe Kern-Elemente ohne Snapshot-Abhängigkeit
    expect(brief).toContain('Betreff: Notarielle Beurkundung eines Testaments');
    expect(brief).toContain('Max Mustermann');
    expect(brief).toContain('100.000'); // LocaleString formatierung
    expect(brief).toContain('Erika Mustermann');
  });

  it('sollte den Schnell-Generator für Testamente korrekt aufrufen', () => {
    const brief = erbrechtGenerator.generateTestament(
      {
        name: 'Max',
        strasse: 'Weg',
        plz: '123',
        ort: 'Stadt',
        telefon: '123',
        geburtsdatum: '01.01.1960',
      },
      [{ name: 'Erika', verwandtschaftsgrad: 'Frau' }],
      50000
    );

    expect(brief).toContain('Max');
    expect(brief).toContain('Erika');
    expect(brief).toContain('notarieller');
  });
});
