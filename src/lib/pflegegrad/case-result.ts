import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import { calculatePflegegrad } from '@/src/lib/pflegegrad/rechner';
import { bestimmeUnvollstaendigeModule, computeModuleScores } from '@/src/lib/pflegegrad/scoring';
import type { PflegegradErgebnis } from '@/src/types/pflegegrad';
import type { Database } from '@/src/types/supabase';

const ADULT_MODULE_NUMBERS = [1, 2, 3, 4, 5, 6] as const;
export type AdultModuleNumber = (typeof ADULT_MODULE_NUMBERS)[number];

export interface AdultAssessmentState {
  completedModules: AdultModuleNumber[];
  missingModules: AdultModuleNumber[];
  nextModule: AdultModuleNumber | null;
  hasResult: boolean;
  result: PflegegradErgebnis;
}

/**
 * Berechnet das Erwachsenen-Ergebnis ausschließlich aus den serverseitig
 * gespeicherten Antworten. Vom Browser gelieferte Gesamtwerte werden nie
 * übernommen.
 */
export async function loadAdultAssessmentState(
  supabase: SupabaseClient<Database>,
  caseId: string
): Promise<AdultAssessmentState> {
  const { data: rows, error } = await supabase
    .from('answers')
    .select('module_number, answers')
    .eq('case_id', caseId)
    .in('module_number', [...ADULT_MODULE_NUMBERS]);

  if (error) throw error;

  const zeilen = (rows ?? []).map((row) => ({
    module_number: row.module_number,
    answers: (row.answers as Record<string, unknown> | null) ?? null,
  }));

  // Fortschritt und Ergebnis entstehen aus demselben Snapshot der Antworten.
  // Null Punkte bleiben dabei ein gültiger, vollständig beantworteter Stand.
  const missingModules = bestimmeUnvollstaendigeModule(zeilen) as AdultModuleNumber[];
  const completedModules = ADULT_MODULE_NUMBERS.filter(
    (moduleNumber) => !missingModules.includes(moduleNumber)
  );

  return {
    completedModules,
    missingModules,
    nextModule: missingModules[0] ?? null,
    hasResult: missingModules.length === 0,
    result: calculatePflegegrad(computeModuleScores(zeilen), missingModules),
  };
}

/**
 * Kompatibler Ergebnis-Zugriff für Aufrufer, die keinen Fortschritt benötigen.
 */
export async function calculateCaseResult(
  supabase: SupabaseClient<Database>,
  caseId: string
): Promise<PflegegradErgebnis> {
  return (await loadAdultAssessmentState(supabase, caseId)).result;
}
