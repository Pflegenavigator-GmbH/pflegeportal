// src/api/cases/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { handleApiError } from '@/src/lib/api/error-handler';
import { RateLimitError } from '@/src/lib/api/errors';
import { checkRateLimit, getClientIp } from '@/src/lib/api/rate-limit';
import { createAdminSupabaseClient } from '@/src/lib/supabase/admin';

interface CreateCaseRpcResponse {
  id: string;
  case_code: string;
  status: string;
}

// Max. 5 neue Fälle pro IP und Stunde — verhindert DB-Flooding über die
// ungeschützte Fallerstellung.
const CREATE_LIMIT = 5;
const CREATE_WINDOW_MS = 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (!checkRateLimit(`cases:create:${ip}`, CREATE_LIMIT, CREATE_WINDOW_MS)) {
      throw new RateLimitError(`Fallerstellung gedrosselt für IP ${ip}`);
    }

    const supabaseAdmin = createAdminSupabaseClient();

    const { data, error } = await supabaseAdmin.rpc('create_case');

    if (error) {
      throw error;
    }

    const caseData = data as unknown as CreateCaseRpcResponse;

    if (!caseData || !caseData.id || !caseData.case_code) {
      throw new Error(
        'Systemfehler: Unvollständige oder korrupte Datenstruktur von der Datenbank empfangen.'
      );
    }

    return NextResponse.json(
      {
        id: caseData.id,
        caseCode: caseData.case_code,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    return handleApiError(err, 'api.cases.create');
  }
}
