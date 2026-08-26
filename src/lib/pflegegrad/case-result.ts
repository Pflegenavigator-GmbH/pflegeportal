import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import { calculatePflegegrad } from '@/src/lib/pflegegrad/rechner';
import { bestimmeUnvollstaendigeModule, computeModuleScores } from '@/src/lib/pflegegrad/scoring';
import type { PflegegradErgebnis } from '@/src/types/pflegegrad';
import type { Database } from '@/src/types/supabase';

const ADULT_MODULE_NUMBERS = [1, 2, 3, 4, 5, 6] as const;

/**
 * Berechnet das Erwachsenen-Ergebnis ausschließlich aus den serverseitig
 * gespeicherten Antworten. Vom Browser gelieferte Gesamtwerte werden nie
 * übernommen.
 */
export async function calculateCaseResult(
  supabase: SupabaseClient<Database>,
  caseId: string
): Promise<PflegegradErgebnis> {
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

  // Vollständigkeit kommt aus denselben Zeilen — nicht aus dem Punktwert.
  return calculatePflegegrad(computeModuleScores(zeilen), bestimmeUnvollstaendigeModule(zeilen));
}

/**
 * Aktualisiert die denormalisierten Such-/Statusfelder. Die Werte stammen
 * immer aus calculateCaseResult; diese Funktion akzeptiert keine Clientwerte.
 */
export async function calculateAndPersistCaseResult(
  supabase: SupabaseClient<Database>,
  caseId: string
): Promise<PflegegradErgebnis> {
  const result = await calculateCaseResult(supabase, caseId);
  const { error } = await supabase
    .from('cases')
    .update({
      care_level_guess: result.careLevel,
      total_score: result.totalScore,
      traffic_light: result.trafficLight,
      updated_at: new Date().toISOString(),
    })
    .eq('id', caseId);

  if (error) throw error;
  return result;
}
