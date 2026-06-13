// src/lib/pflegegrad/constants
export const NBA_CONFIG = {
  WEIGHTS: { 1: 0.1, 2: 0.15, 3: 0.15, 4: 0.4, 5: 0.2 },
  THRESHOLDS: [
    { level: 5, min: 90.0 },
    { level: 4, min: 70.0 },
    { level: 3, min: 47.5 },
    { level: 2, min: 27.0 },
    { level: 1, min: 12.5 },
  ],
  BENEFITS: {
    1: { monthly: 0, relief: 131 },
    2: { monthly: 347, relief: 131 },
    3: { monthly: 599, relief: 131 },
    4: { monthly: 800, relief: 131 },
    5: { monthly: 990, relief: 131 },
  },
} as const;
