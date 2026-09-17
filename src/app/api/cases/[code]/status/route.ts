// src/app/api/cases/[code]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { requireCaseSession } from '@/src/lib/api/case-auth';
import { handleApiError } from '@/src/lib/api/error-handler';
import { ValidationError, NotFoundError } from '@/src/lib/api/errors';
import { istGueltigerFallcode } from '@/src/lib/case-code';
import { createAdminSupabaseClient } from '@/src/lib/supabase/admin';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  try {
    if (!istGueltigerFallcode(code)) {
      throw new ValidationError('Das eingegebene Fallcode-Format ist ungültig.');
    }

    const session = await requireCaseSession(code);

    const supabase = createAdminSupabaseClient();
    const { data: currentCase, error } = await supabase
      .from('cases')
      .select(
        'id, status, billing_status, product_tier, access_unlocked_at, care_level_guess, total_score, traffic_light'
      )
      .eq('id', session.caseId)
      .single();

    if (error || !currentCase) {
      // case_id statt Fallcode — die Meldung landet im Protokoll (Issue #145)
      throw new NotFoundError('Fall', session.caseId);
    }

    return NextResponse.json({
      success: true,
      data: {
        id: currentCase.id,
        // Aus der geprüften Sitzung, nicht aus der Datenbank: Der Klartext
        // steht dort nicht mehr (#153).
        caseCode: session.caseCode,
        status: currentCase.status,
        billingStatus: currentCase.billing_status,
        productTier: currentCase.product_tier,
        isUnlocked: currentCase.billing_status === 'paid' || currentCase.billing_status === 'free',
        calculations: {
          careLevelGuess: currentCase.care_level_guess,
          totalScore: currentCase.total_score,
          trafficLight: currentCase.traffic_light,
        },
      },
    });
  } catch (err) {
    return handleApiError(err, 'api.cases.status');
  }
}
