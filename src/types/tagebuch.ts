// src/types/tagebuch.ts

export type PflegeHelfer = 'Hauptpflegeperson' | 'Pflegedienst' | 'Andere Person' | 'Niemand';
export type SchlafQualitaet = 'Gut' | 'Unterbrochen' | 'Schlecht';

export interface TagebuchEintrag {
  date: string;
  content: string;
  helfer: PflegeHelfer;
  schmerzen: number; // Skala 1-10
  schlaf: SchlafQualitaet;
  sturz: boolean;
  arzttermin: boolean;
  krankenhaus: boolean;
  bettlaegerig: boolean;
  medikamentenKontrolle: boolean;
  created_at: string;
}

export interface TagebuchData {
  [key: string]: TagebuchEintrag;
}
