// src/api/cases/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

import { handleApiError } from '@/src/lib/api/error-handler';
import { Database } from '@/src/types/supabase';

interface CreateCaseRpcResponse {
  id: string;
  case_code: string;
  status: string;
}

export async function POST() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseSecretKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseSecretKey) {
      throw new Error(
        'Supabase URL oder der neue Secret Key (sb_secret) fehlt in den Server-Umgebungsvariablen.'
      );
    }

    // Erstellung des hochprivilegierten Admin-Clients auf Server-Ebene
    const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseSecretKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data, error } = await supabaseAdmin.rpc('create_case');

    if (error) {
      throw error; // Wird direkt vom typsicheren catch-Block abgefangen und normalisiert
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
    // Ersetzt das verbotene 'any' durch 'unknown' und nutzt das zentrale Error-Handling
    return handleApiError(err, 'api.cases.create.new_secret_key');
  }
}
