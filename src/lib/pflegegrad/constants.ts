// src/lib/pflegegrad/constants.ts

export const NBA_CONFIG = {
  MATRIX: {
    modul1: (roh: number): number => {
      if (roh === 0) return 0;
      if (roh <= 1) return 2.5;
      if (roh <= 3) return 5.0;
      if (roh <= 5) return 7.5;
      return 10.0;
    },
    modul2: (roh: number): number => {
      if (roh === 0) return 0;
      if (roh <= 5) return 3.75;
      if (roh <= 10) return 7.5;
      if (roh <= 14) return 11.25;
      return 15.0;
    },
    modul3: (roh: number): number => {
      if (roh === 0) return 0;
      if (roh <= 6) return 3.75;
      if (roh <= 13) return 7.5;
      if (roh <= 20) return 11.25;
      return 15.0;
    },
    modul4: (roh: number): number => {
      if (roh === 0) return 0;
      if (roh <= 1) return 10.0;
      if (roh <= 6) return 20.0;
      if (roh <= 12) return 30.0;
      return 40.0;
    },
    modul5: (roh: number): number => {
      if (roh === 0) return 0;
      if (roh <= 1) return 5.0;
      if (roh <= 4) return 10.0;
      if (roh <= 7) return 15.0;
      return 20.0;
    },
    modul6: (roh: number): number => {
      if (roh === 0) return 0;
      if (roh <= 2) return 3.75;
      if (roh <= 5) return 7.5;
      if (roh <= 7) return 11.25;
      return 15.0;
    },
  },
  THRESHOLDS: [
    { level: 5, min: 90.0 },
    { level: 4, min: 70.0 },
    { level: 3, min: 47.5 },
    { level: 2, min: 27.0 },
    { level: 1, min: 12.5 },
  ],
  BENEFITS: {
    1: { monthly: 0, relief: 125 }, // Gesetzlicher Satz 2026
    2: { monthly: 332, relief: 125 },
    3: { monthly: 573, relief: 125 },
    4: { monthly: 765, relief: 125 },
    5: { monthly: 947, relief: 125 },
  },
} as const;
