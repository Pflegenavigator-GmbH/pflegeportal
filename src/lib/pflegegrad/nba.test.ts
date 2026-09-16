// src/lib/pflegegrad/nba.test.ts
import { describe, expect, it } from 'vitest';

import { ERWARTETE_FRAGEN } from './fragen';
import {
  KRITERIEN_GESAMT,
  MODULE_KRITERIEN,
  MODULE_MAX_RAW,
  severityFraction,
  severityStufe,
  weightedModulePoints,
  type AdultModuleNumber,
} from './nba';

const MODULE: AdultModuleNumber[] = [1, 2, 3, 4, 5, 6];

describe('Kriterienzahl je Modul (#137)', () => {
  it('leitet die erhobenen Kriterien aus dem Fragenkatalog ab', () => {
    // Abgeschriebene Zahlen laufen auseinander, sobald jemand eine Frage
    // ergänzt — genau das darf der Ergebnisseite nicht passieren.
    for (const modul of MODULE) {
      expect(MODULE_KRITERIEN[modul].erhoben).toBe(ERWARTETE_FRAGEN[modul].length);
    }
  });

  it('erhebt in jedem Modul weniger als der amtliche Katalog, außer in Modul 6', () => {
    for (const modul of MODULE) {
      const { erhoben, amtlich } = MODULE_KRITERIEN[modul];
      expect(erhoben).toBeLessThanOrEqual(amtlich);
    }
    // Der Grund für dieses Ticket: Modul 3 erhebt 4 von 13 Kriterien.
    expect(MODULE_KRITERIEN[3]).toEqual({ erhoben: 4, amtlich: 13 });
  });

  it('summiert auf 28 von 64 Kriterien', () => {
    expect(KRITERIEN_GESAMT).toEqual({ erhoben: 28, amtlich: 64 });
  });
});

describe('Schweregradstufe', () => {
  it('bildet den Rohpunkte-Anteil auf die fünf Stufen ab', () => {
    // Modul 1: 12 mögliche Rohpunkte.
    expect(severityStufe(0, 12)).toBe(0);
    expect(severityStufe(3, 12)).toBe(1);
    expect(severityStufe(6, 12)).toBe(2);
    expect(severityStufe(9, 12)).toBe(3);
    expect(severityStufe(12, 12)).toBe(4);
  });

  it('bleibt mit der gewichteten Berechnung im Gleichschritt', () => {
    // Die Anzeige zeigt die Stufe, die Wertung nutzt den Anteil. Beide müssen
    // dieselbe Quelle haben, sonst widerspricht die Seite sich selbst.
    for (const modul of MODULE) {
      const maxRaw = MODULE_MAX_RAW[modul];
      for (let raw = 0; raw <= maxRaw; raw++) {
        expect(severityStufe(raw, maxRaw) / 4).toBe(severityFraction(raw, maxRaw));
      }
    }
  });

  it('meldet keine Stufe über 4, auch bei unmöglich hohen Rohwerten', () => {
    expect(severityStufe(99, 12)).toBe(4);
    expect(weightedModulePoints(4, 99)).toBe(40);
  });
});
