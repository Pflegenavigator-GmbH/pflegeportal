// src/api/cases/[code]/scores/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { requireCaseSession } from '@/src/lib/api/case-auth';
import { handleApiError } from '@/src/lib/api/error-handler';
import { ValidationError, NotFoundError } from '@/src/lib/api/errors';
import { createAdminSupabaseClient } from '@/src/lib/supabase/admin';

interface UpdateScoresBody {
  careLevelGuess?: unknown;
  totalScore?: unknown;
  trafficLight?: unknown;
}

const TRAFFIC_LIGHTS = ['gruen', 'gelb', 'rot'] as const;
type TrafficLight = (typeof TRAFFIC_LIGHTS)[number];

function isTrafficLight(value: unknown): value is TrafficLight {
  return typeof value === 'string' && (TRAFFIC_LIGHTS as readonly string[]).includes(value);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  try {
    const session = await requireCaseSession(code);

    const body: UpdateScoresBody = await request.json();
    const { careLevelGuess, totalScore, trafficLight } = body;

    // Runtime-Validierung inkl. Wertebereichen — die Werte landen im Gutachten
    if (
      typeof careLevelGuess !== 'number' ||
      careLevelGuess < 0 ||
      careLevelGuess > 5 ||
      typeof totalScore !== 'number' ||
      totalScore < 0 ||
      totalScore > 100 ||
      !isTrafficLight(trafficLight)
    ) {
      throw new ValidationError('Berechnungswerte unvollständig oder fehlerhaft.');
    }

    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('cases')
      .update({
        care_level_guess: careLevelGuess,
        total_score: totalScore,
        traffic_light: trafficLight,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.caseId)
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
