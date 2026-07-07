import { describe, it, expect } from 'vitest';

import { berechneGesamtGdB } from './berechne-gesamt-gdb';

describe('GdB-Gesamtberechnung', () => {
  it('sollte 0 zurückgeben, wenn keine Werte vorhanden sind', () => {
    expect(berechneGesamtGdB({})).toEqual({ gdb: 0, vorteile: [] });
  });

  it('sollte bei einem einzelnen Wert den GdB übernehmen', () => {
    expect(berechneGesamtGdB({ ohr: 30 })).toEqual(expect.objectContaining({ gdb: 30 }));
  });

  it('sollte nur Werte ab 20 addieren', () => {
    // Basis 50. Zusätzliche 30 (>=20) -> +10. Zusätzliche 10 (<20) -> ignoriert.
    // Ergebnis: 50 + 10 = 60
    const result = berechneGesamtGdB({ basis: 50, zusaetzlich: 30, klein: 10 });
    expect(result.gdb).toBe(60);
  });

  it('sollte den GdB auf maximal 100 begrenzen', () => {
    // Basis 90 + 20 + 20 -> 110 -> 100
    const result = berechneGesamtGdB({ b1: 90, b2: 20, b3: 20 });
    expect(result.gdb).toBe(100);
  });

  it('sollte bei 20 Punkten den GdB korrekt erhöhen', () => {
    // 20 ist die kritische Schwelle
    const result = berechneGesamtGdB({ basis: 30, folge: 20 });
    expect(result.gdb).toBe(40);
  });
});
