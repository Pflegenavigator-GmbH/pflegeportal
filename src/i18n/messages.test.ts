import { describe, expect, it } from 'vitest';

import { ueberlagere } from './messages';

describe('ueberlagere (schlüsselgenauer Fallback)', () => {
  it('nimmt die Übersetzung, wo vorhanden', () => {
    const ergebnis = ueberlagere({ titel: 'Impressum' }, { titel: 'Legal notice' });
    expect(ergebnis.titel).toBe('Legal notice');
  });

  it('behält die Referenzsprache für fehlende Schlüssel', () => {
    // Der eigentliche Fehler zuvor: Eine halb gefüllte Datei fiel NICHT
    // zurück, der Nutzer sah `common.footer.links.impressum`.
    const ergebnis = ueberlagere(
      { impressum: 'Impressum', datenschutz: 'Datenschutz' },
      { impressum: 'Legal notice' }
    );

    expect(ergebnis).toEqual({ impressum: 'Legal notice', datenschutz: 'Datenschutz' });
  });

  it('führt verschachtelte Strukturen Ebene für Ebene zusammen', () => {
    const ergebnis = ueberlagere(
      { footer: { links: { impressum: 'Impressum', agb: 'AGB' }, copyright: '© 2026' } },
      { footer: { links: { impressum: 'Legal notice' } } }
    );

    expect(ergebnis).toEqual({
      footer: { links: { impressum: 'Legal notice', agb: 'AGB' }, copyright: '© 2026' },
    });
  });

  it('wertet leere Zeichenketten als „nicht übersetzt"', () => {
    // Übersetzungswerkzeuge legen Schlüssel gern leer an. Eine leere
    // Beschriftung wäre schlechter als eine deutsche.
    const ergebnis = ueberlagere(
      { speichern: 'Speichern', hilfe: 'Hilfe' },
      { speichern: '', hilfe: '   ' }
    );

    expect(ergebnis).toEqual({ speichern: 'Speichern', hilfe: 'Hilfe' });
  });

  it('lässt die Referenz unverändert, wenn keine Übersetzung vorliegt', () => {
    const basis = { a: '1', b: { c: '2' } };

    expect(ueberlagere(basis, null)).toEqual(basis);
    expect(ueberlagere(basis, undefined)).toEqual(basis);
  });

  it('verändert die übergebenen Objekte nicht', () => {
    // Die Referenz wird pro Anfrage geladen und darf nicht mutiert werden.
    const basis = { footer: { links: { impressum: 'Impressum' } } };
    const uebersetzung = { footer: { links: { impressum: 'Legal notice' } } };

    ueberlagere(basis, uebersetzung);

    expect(basis.footer.links.impressum).toBe('Impressum');
    expect(uebersetzung.footer.links.impressum).toBe('Legal notice');
  });

  it('ersetzt einen Zweig, wenn die Übersetzung dort keinen Zweig hat', () => {
    // Strukturbruch zwischen den Sprachen: Die Übersetzung gewinnt, damit ein
    // bewusst vereinfachter Text nicht durch die Referenz überschrieben wird.
    const ergebnis = ueberlagere(
      { hinweis: { kurz: 'A', lang: 'B' } },
      { hinweis: 'Nur ein Satz' }
    );

    expect(ergebnis.hinweis).toBe('Nur ein Satz');
  });

  it('übernimmt Schlüssel, die es in der Referenz nicht gibt', () => {
    // Sollte nicht vorkommen (die Prüfung meldet solche Waisen), darf aber
    // nichts kaputt machen.
    const ergebnis = ueberlagere({ a: '1' }, { b: '2' });
    expect(ergebnis).toEqual({ a: '1', b: '2' });
  });
});
