import { describe, expect, it } from 'vitest';

import { heuteAlsIso, isoVorTagen, pruefeBescheidDatum } from './bescheid-datum';

/** Fester Bezugstag: Montag, 13.07.2026. */
const HEUTE = new Date(2026, 6, 13);

describe('heuteAlsIso', () => {
  it('liefert das lokale Datum ohne UTC-Verschiebung', () => {
    // toISOString() würde in Europe/Berlin bei Datumsgrenzen den Vortag liefern.
    expect(heuteAlsIso(new Date(2026, 6, 13, 0, 30))).toBe('2026-07-13');
    expect(heuteAlsIso(new Date(2026, 6, 13, 23, 30))).toBe('2026-07-13');
  });
});

describe('isoVorTagen', () => {
  it('rechnet Tage korrekt zurück', () => {
    expect(isoVorTagen(0, HEUTE)).toBe('2026-07-13');
    expect(isoVorTagen(1, HEUTE)).toBe('2026-07-12');
    expect(isoVorTagen(7, HEUTE)).toBe('2026-07-06');
  });

  it('trägt über Monats- und Jahresgrenzen', () => {
    expect(isoVorTagen(7, new Date(2026, 0, 3))).toBe('2025-12-27');
  });
});

describe('pruefeBescheidDatum', () => {
  it('akzeptiert ein Datum in der Vergangenheit und heute', () => {
    expect(pruefeBescheidDatum('2026-06-15', HEUTE)).toEqual({
      gueltig: true,
      wert: '2026-06-15',
    });
    expect(pruefeBescheidDatum('2026-07-13', HEUTE)).toEqual({
      gueltig: true,
      wert: '2026-07-13',
    });
  });

  it('weist Zukunftsdaten ab', () => {
    // Kernregel: Ein Bescheid liegt immer in der Vergangenheit. Ein
    // Zukunftsdatum würde die Restfrist überschätzen — genau der Fehler,
    // vor dem der Monitor schützen soll.
    const ergebnis = pruefeBescheidDatum('2026-07-14', HEUTE);
    expect(ergebnis.gueltig).toBe(false);
    expect(ergebnis).toHaveProperty('fehler', 'Das Datum liegt in der Zukunft.');
  });

  it('weist nicht existierende Daten ab', () => {
    expect(pruefeBescheidDatum('2026-02-31', HEUTE).gueltig).toBe(false);
    expect(pruefeBescheidDatum('2026-13-01', HEUTE).gueltig).toBe(false);
  });

  it('weist unbrauchbare Eingaben ab', () => {
    for (const eingabe of ['', '   ', '13.07.2026', 'heute', null, undefined, 42, {}]) {
      expect(pruefeBescheidDatum(eingabe, HEUTE).gueltig).toBe(false);
    }
  });

  it('weist unplausibel alte Daten ab', () => {
    // Die Pflegeversicherung besteht seit 1995 — davor ist es ein Tippfehler.
    expect(pruefeBescheidDatum('1994-12-31', HEUTE).gueltig).toBe(false);
    expect(pruefeBescheidDatum('1995-01-01', HEUTE).gueltig).toBe(true);
  });

  it('toleriert umgebende Leerzeichen', () => {
    expect(pruefeBescheidDatum('  2026-06-15  ', HEUTE)).toEqual({
      gueltig: true,
      wert: '2026-06-15',
    });
  });

  it('akzeptiert genau die Werte der Schnellauswahl', () => {
    // Absicherung gegen Off-by-one: Kein Schnellwahl-Knopf darf ein Datum
    // erzeugen, das die eigene Validierung ablehnt.
    for (const tage of [0, 1, 7]) {
      expect(pruefeBescheidDatum(isoVorTagen(tage, HEUTE), HEUTE).gueltig).toBe(true);
    }
  });
});
