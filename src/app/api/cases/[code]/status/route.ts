// src/app/api/cases/[code]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/src/lib/supabase/server';
import { handleApiError } from '@/src/lib/api/error-handler';
import { ValidationError, NotFoundError } from '@/src/lib/api/errors';

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    const { code } = await params;
    try {
        if (!code || !code.match(/^PF-[A-Z0-9]{4}-[A-Z0-9]{4}$/)) {
            throw new ValidationError('Das eingegebene Fallcode-Format ist ungültig.');
        }

        const supabase = await createServerSupabaseClient();
        const { data: currentCase, error } = await supabase
            .from('cases')
            .select('id, case_code, status, billing_status, product_tier, access_unlocked_at, care_level_guess, total_score, traffic_light')
            .eq('case_code', code.toUpperCase())
            .single();

        if (error || !currentCase) {
            throw new NotFoundError('Fall', code);
        }

        return NextResponse.json({
            success: true,
            data: {
                id: currentCase.id,
                caseCode: currentCase.case_code,
                status: currentCase.status,
                billingStatus: currentCase.billing_status,
                productTier: currentCase.product_tier,
                isUnlocked: currentCase.billing_status === 'paid' || currentCase.billing_status === 'free',
                calculations: {
                    careLevelGuess: currentCase.care_level_guess,
                    totalScore: currentCase.total_score,
                    trafficLight: currentCase.traffic_light
                }
            }
        });
    } catch (err) {
        return handleApiError(err, 'api.cases.status', code);
    }
}