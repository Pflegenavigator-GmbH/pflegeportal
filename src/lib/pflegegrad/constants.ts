// src/lib/pflegegrad/constants.ts
//
// Hinweis: Das Bewertungsmodell (Modulgewichte, Schweregrad-Stufung,
// Pflegegrad-Schwellen) liegt jetzt zentral in src/lib/pflegegrad/nba.ts.
// Hier verbleiben nur die gesetzlichen Leistungsbeträge.
//
// Rechtsstand: src/lib/rechtsstand/rechtswerte.ts, Schlüssel
// `leistungen.pflegegeld` und `leistungen.entlastungsbetrag`. Dort steht auch,
// dass diese Werte dem Stand vor dem 01.01.2025 entsprechen — die Umstellung
// ist #107.

export const NBA_CONFIG = {
  BENEFITS: {
    1: { monthly: 0, relief: 125 }, // Gesetzlicher Satz 2026
    2: { monthly: 332, relief: 125 },
    3: { monthly: 573, relief: 125 },
    4: { monthly: 765, relief: 125 },
    5: { monthly: 947, relief: 125 },
  },
} as const;
