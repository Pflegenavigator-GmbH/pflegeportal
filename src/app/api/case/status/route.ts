// src/app/api/case/status/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { requireCaseSession } from '@/src/lib/api/case-auth';
import { handleApiError } from '@/src/lib/api/error-handler';
import { NotFoundError } from '@/src/lib/api/errors';
import { createAdminSupabaseClient } from '@/src/lib/supabase/admin';

export async function GET(_request: NextRequest) {
  try {
    // Kein Fallcode mehr im Pfad und keine Formatprüfung: Der Fall ergibt sich
    // aus der Sitzung (#135).
    const session = await requireCaseSession();

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
        // Der Fallcode wird bewusst NICHT zurückgegeben: Serverseitig existiert
        // er seit #153 nur noch als Hash, und die Sitzung kommt seit #135 ohne
        // ihn aus.
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
