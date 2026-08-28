// src/app/api/cases/[code]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { requireCaseSession } from '@/src/lib/api/case-auth';
import { handleApiError } from '@/src/lib/api/error-handler';
import { NotFoundError } from '@/src/lib/api/errors';
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
    const { data: currentCase, error } = await supabase
      .from('cases')
      .select('id, case_code, status, billing_status, product_tier, access_unlocked_at')
      .eq('id', session.caseId)
      .single();

    if (error || !currentCase) {
      throw new NotFoundError('Fall', code);
    }

    const assessment = await loadAdultAssessmentState(supabase, session.caseId);

    return NextResponse.json({
      success: true,
      data: {
        id: currentCase.id,
        caseCode: currentCase.case_code,
        status: currentCase.status,
        billingStatus: currentCase.billing_status,
        productTier: currentCase.product_tier,
        isUnlocked: session.isUnlocked,
        assessment: {
          completedModules: assessment.completedModules,
          missingModules: assessment.missingModules,
          nextModule: assessment.nextModule,
          hasResult: assessment.hasResult,
        },
        calculations: {
          careLevelGuess: assessment.result.careLevel,
          totalScore: assessment.result.totalScore,
          trafficLight: assessment.result.trafficLight,
          missingData: assessment.result.missingData,
        },
      },
    });
  } catch (err) {
    return handleApiError(err, 'api.cases.status', code);
  }
}
