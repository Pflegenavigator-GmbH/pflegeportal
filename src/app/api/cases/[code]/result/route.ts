// src/api/cases/[code]/result/route.ts
// Serverseitige, autoritative Pflegegrad-Berechnung: liest die gespeicherten
// Antworten und berechnet Rohpunkte und Ergebnis deterministisch. GET bleibt
// read-only; persistiert wird ausschließlich beim Speichern von Antworten.
import { NextRequest, NextResponse } from 'next/server';

import { requireCaseSession } from '@/src/lib/api/case-auth';
import { handleApiError } from '@/src/lib/api/error-handler';
import { calculateCaseResult } from '@/src/lib/pflegegrad/case-result';
import { createAdminSupabaseClient } from '@/src/lib/supabase/admin';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  try {
    const session = await requireCaseSession(code);
    const supabase = createAdminSupabaseClient();

    const ergebnis = await calculateCaseResult(supabase, session.caseId);

    return NextResponse.json({ success: true, ergebnis });
  } catch (err) {
    return handleApiError(err, 'api.cases.result', code);
  }
}
