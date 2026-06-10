// src/types/gbd.ts
export interface GdBSektor {
  id: string;
  label: string;
  beschreibung: string;
  werte: { label: string; wert: number }[];
}

export interface GdbErgebnis {
  gdb: number;
  vorteile: string[];
}
