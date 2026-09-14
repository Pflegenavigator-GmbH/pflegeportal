// src/api/cases/[code]/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { requireCaseSession } from '@/src/lib/api/case-auth';
import { handleApiError } from '@/src/lib/api/error-handler';
import { NotFoundError } from '@/src/lib/api/errors';
import { createAdminSupabaseClient } from '@/src/lib/supabase/admin';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  try {
    const session = await requireCaseSession(code);

    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .eq('id', session.caseId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // case_id statt Fallcode — die Meldung landet im Protokoll (Issue #145)
        throw new NotFoundError('Fall', session.caseId);
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (err) {
    return handleApiError(err, 'api.cases.get');
  }
}
