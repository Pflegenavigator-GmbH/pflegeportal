import { describe, it, expect } from 'vitest';

import { BriefPayload } from '@/src/types/briefe';

import { schwerbehindertenausweisGenerator } from './schwerbehindertenausweis';

describe('SchwerbehindertenausweisGenerator', () => {
  const validPayload: BriefPayload = {
    type: 'schwerbehindertenausweis',
    absender: {
      name: 'Max Mustermann',
      strasse: 'Musterstr. 1',
      plz: '12345',
      ort: 'Musterstadt',
      telefon: '0123456789',
    },
    empfaenger: {
      name: 'Versorgungsamt',
      strasse: 'Amtweg 1',
      plz: '54321',
      ort: 'Musterstadt',
    },
    betreff: 'Antrag auf GdB',
    inhalt: {
      anrede: 'Sehr geehrte Damen und Herren,',
      hauptteil: 'Ich beantrage die Feststellung meines GdB aufgrund chronischer Leiden.',
    },
    anlagen: ['Arztbericht.pdf'],
  };

  it('sollte einen Brief bei validen Daten erfolgreich generieren', () => {
    const brief = schwerbehindertenausweisGenerator.generateBrief(validPayload);

    expect(brief).toContain('Max Mustermann');
    expect(brief).toContain('Antrag auf GdB');
    expect(brief).toContain('- Arztbericht.pdf');
    expect(brief).toContain('§ 2 SGB IX');
  });

  it('sollte einen Fehler werfen, wenn Pflichtfelder im Schema fehlen', () => {
    // Wir senden ein leeres Objekt, das nicht dem Zod-Schema entspricht
    const invalidPayload = { type: 'schwerbehindertenausweis' };

    expect(() => {
      schwerbehindertenausweisGenerator.generateBrief(invalidPayload);
    }).toThrow(); // Zod.parse wird hier einen Fehler werfen
  });

  it('sollte Anlagen korrekt hinzufügen', () => {
    const payloadWithAnlagen = {
      ...validPayload,
      anlagen: ['Anlage 1', 'Anlage 2'],
    };

    const brief = schwerbehindertenausweisGenerator.generateBrief(payloadWithAnlagen);

    expect(brief).toContain('- Anlage 1');
    expect(brief).toContain('- Anlage 2');
  });
});
