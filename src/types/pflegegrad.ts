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
    additionalBenefits: string[];
  };
  recommendations: string[];
}
