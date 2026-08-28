// src/api/cases/[code]/result/route.ts
// Serverseitige, autoritative Pflegegrad-Berechnung: liest die gespeicherten
// Antworten und berechnet Rohpunkte und Ergebnis deterministisch. GET bleibt
// read-only; die Antwortzeilen sind die einzige persistierte Wahrheit.
import { NextRequest, NextResponse } from 'next/server';

import { requireCaseSession } from '@/src/lib/api/case-auth';
import { handleApiError } from '@/src/lib/api/error-handler';
import { loadAdultAssessmentState } from '@/src/lib/pflegegrad/case-result';
import { createAdminSupabaseClient } from '@/src/lib/supabase/admin';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  try {
    const session = await requireCaseSession(code);
    const supabase = createAdminSupabaseClient();

    const assessment = await loadAdultAssessmentState(supabase, session.caseId);

    if (!assessment.hasResult) {
      return NextResponse.json(
        {
          success: false,
          error: 'Das Assessment ist noch nicht vollständig.',
          nextModule: assessment.nextModule,
        },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true, ergebnis: assessment.result });
  } catch (err) {
    return handleApiError(err, 'api.cases.result', code);
  }
}
