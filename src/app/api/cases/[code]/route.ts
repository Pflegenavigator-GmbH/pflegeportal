// src/api/cases/[code]/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { handleApiError } from '@/src/lib/api/error-handler';
import { NotFoundError } from '@/src/lib/api/errors';
import { createServerSupabaseClient } from '@/src/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .eq('case_code', code.toUpperCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Fall', code);
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (err) {
    return handleApiError(err, 'api.cases.get', code);
  }
}
