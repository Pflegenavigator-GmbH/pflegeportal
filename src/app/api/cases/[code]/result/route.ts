// src/api/cases/[code]/result/route.ts
// Serverseitige, autoritative Pflegegrad-Berechnung: liest die gespeicherten
// Antworten, berechnet Rohpunkte und Ergebnis deterministisch und persistiert
// die Kennzahlen am Fall. Der Client zeigt nur noch an, was hier entsteht.
import { NextRequest, NextResponse } from 'next/server';

import { requireCaseSession } from '@/src/lib/api/case-auth';
import { handleApiError } from '@/src/lib/api/error-handler';
import { calculatePflegegrad } from '@/src/lib/pflegegrad/rechner';
import { computeModuleScores } from '@/src/lib/pflegegrad/scoring';
import { createAdminSupabaseClient } from '@/src/lib/supabase/admin';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  try {
    const session = await requireCaseSession(code);
    const supabase = createAdminSupabaseClient();

    const { data: rows, error } = await supabase
      .from('answers')
      .select('module_number, answers')
      .eq('case_id', session.caseId)
      .in('module_number', [1, 2, 3, 4, 5, 6]);

    if (error) throw error;

    const moduleScores = computeModuleScores(
      (rows || []).map((r) => ({
        module_number: r.module_number,
        answers: (r.answers as Record<string, unknown> | null) ?? null,
      }))
    );
    const ergebnis = calculatePflegegrad(moduleScores);

    // Kennzahlen am Fall persistieren (Single Source of Truth in der DB)
    const { error: updateError } = await supabase
      .from('cases')
      .update({
        care_level_guess: ergebnis.careLevel,
        total_score: ergebnis.totalScore,
        traffic_light: ergebnis.trafficLight,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.caseId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, ergebnis });
  } catch (err) {
    return handleApiError(err, 'api.cases.result', code);
  }
}
