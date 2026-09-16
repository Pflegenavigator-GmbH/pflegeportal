// src/types/pflegegrad.ts
export type EinstufungAmpel = 'gruen' | 'gelb' | 'rot';

export interface ModuleScores {
  1: number; // Mobilität
  2: number; // Kognition
  3: number; // Verhalten
  4: number; // Selbstversorgung
  5: number; // Krankheitsbewältigung
  6: number; // Alltagsgestaltung
}

export interface Frage {
  id: string;
  text: string;
  hilfe: string;
}

export interface BewertungOption {
  value: string;
  label: string;
  punkte: number;
}

/**
 * Zusatzleistungen und Empfehlungen sind Schlüssel, keine Sätze.
 *
 * Bis zum 16.09.2026 lieferte der Rechner fertige deutsche Zeichenketten
 * („Pflegehilfsmittel (42€)"). Sie erschienen dadurch auch auf der englischen
 * Seite, und der Betrag stand ohne Fundstelle mitten im Rechenergebnis (#107).
 * Beträge kommen jetzt aus `rechtsstand/rechtswerte.ts`, Texte aus den
 * Sprachdateien.
 */
export type ZusatzLeistung = 'pflegehilfsmittel' | 'wohnumfeld';

export type Handlungsempfehlung = 'schwerbehindertenausweis' | 'wiederholung';

export interface PflegegradErgebnis {
  careLevel: number;
  totalScore: number;
  moduleScores: ModuleScores;
  weightedScores: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  maxOf23: number;
  trafficLight: EinstufungAmpel;
  buffer: number;
  missingData: boolean;
  benefits: {
    monthlyAmount: number;
    reliefBudget: number;
    additionalBenefits: ZusatzLeistung[];
  };
  recommendations: Handlungsempfehlung[];
}
