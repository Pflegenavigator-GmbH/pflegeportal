// src/api/cases/[code]/answer/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { handleApiError } from '@/src/lib/api/error-handler';
import { ValidationError, NotFoundError } from '@/src/lib/api/errors';
import { createServerSupabaseClient } from '@/src/lib/supabase/server';

const MODULE_NUMBER_MAP: Record<string, number> = {
  pflegegrad: 1,
  emr: 2,
  gdb: 3,
  sgb14: 4,
  tagebuch: 5,
  widerspruch: 6,
  widerruf: 7,
};

interface AnswerPayload {
  moduleName: string;
  questionKey: string;
  answerValue: string | number | boolean | unknown;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  try {
    const supabase = await createServerSupabaseClient();

    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('id')
      .eq('case_code', code.toUpperCase())
      .single();

    if (caseError || !caseData) {
      throw new NotFoundError('Fall', code);
    }

    const { data, error } = await supabase
      .from('answers')
      .select('*')
      .eq('case_id', caseData.id)
      .order('module_number');

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (err) {
    return handleApiError(err, 'api.cases.answer.get', code);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  try {
    const { moduleName, questionKey, answerValue }: AnswerPayload = await request.json();

    if (!moduleName || !questionKey) {
      throw new ValidationError('Modulname oder Frageschlüssel fehlt.');
    }

    const supabase = await createServerSupabaseClient();
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('id')
      .eq('case_code', code.toUpperCase())
      .single();

    if (caseError || !caseData) {
      throw new NotFoundError('Fall', code);
    }

    const moduleNumber = MODULE_NUMBER_MAP[moduleName.toLowerCase()] || 1;

    const { data: existingRecord } = await supabase
      .from('answers')
      .select('answers')
      .eq('case_id', caseData.id)
      .eq('module_number', moduleNumber)
      .maybeSingle();

    const updatedAnswers = (existingRecord?.answers as Record<string, unknown>) || {};
    updatedAnswers[questionKey] = answerValue;

    const { data, error } = await supabase
      .from('answers')
      .upsert(
        {
          case_id: caseData.id,
          module_number: moduleNumber,
          module_name: moduleName,
          answers: updatedAnswers,
          completed_at: new Date().toISOString(),
        },
        {
          onConflict: 'case_id,module_number',
        }
      )
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err) {
    return handleApiError(err, 'api.cases.answer.post', code);
  }
}
