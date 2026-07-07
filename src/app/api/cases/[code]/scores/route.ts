// src/api/cases/[code]/scores/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { handleApiError } from '@/src/lib/api/error-handler';
import { ValidationError, NotFoundError } from '@/src/lib/api/errors';
import { createServerSupabaseClient } from '@/src/lib/supabase/server';

interface UpdateScoresBody {
  careLevelGuess: number;
  totalScore: number;
  trafficLight: 'gruen' | 'gelb' | 'rot';
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  try {
    const body: UpdateScoresBody = await request.json();
    const { careLevelGuess, totalScore, trafficLight } = body;

    if (careLevelGuess === undefined || totalScore === undefined || !trafficLight) {
      throw new ValidationError('Berechnungswerte unvollständig oder fehlerhaft.');
    }

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('cases')
      .update({
        care_level_guess: careLevelGuess,
        total_score: totalScore,
        traffic_light: trafficLight,
        updated_at: new Date().toISOString(),
      })
      .eq('case_code', code.toUpperCase())
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw new NotFoundError('Fall', code);
      throw error;
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err) {
    return handleApiError(err, 'api.cases.scores.update', code);
  }
}
