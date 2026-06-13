// src/test-utils/factories/scores.ts
import { ModuleScores } from '@/src/types/pflegegrad';

/**
 * Erstellt ein Score-Objekt.
 * Standardmäßig sind alle Module auf 0 gesetzt.
 */
export const createMockScores = (overrides: Partial<ModuleScores> = {}): ModuleScores => ({
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: 0,
  6: 0,
  ...overrides,
});
