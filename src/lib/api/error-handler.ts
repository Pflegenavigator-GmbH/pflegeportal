// src/app/lib/api/error-handler.ts
import { NextResponse } from 'next/server';

import { normalizeError, shouldLogError } from '@/src/lib/api/errors';
import { createServerSupabaseClient } from '@/src/lib/supabase/server';

export async function handleApiError(
  error: unknown,
  source: string,
  caseCode?: string
): Promise<NextResponse> {
  // Normalisiert jeden Fehler (egal ob String, nativer Error oder Supabase-Fehler) in unsere Struktur
  const normalized = normalizeError(error);

  // Konsolen-Log für die lokale Entwicklung / Hetzner-Server-Logs
  console.error(`[API ERROR] [${source}] [Case: ${caseCode || 'Kein'}] [${normalized.code}]:`, {
    message: normalized.message,
    context: normalized.context,
  });

  // Nur loggen, wenn das Log-Level nicht 'debug' ist
  if (shouldLogError(normalized)) {
    try {
      const supabase = await createServerSupabaseClient();

      // Automatische Dokumentation im System-Audit-Trail (Supabase)
      await supabase.from('system_logs').insert({
        level: normalized.logLevel,
        source,
        message: normalized.message,
        metadata: {
          context: normalized.context,
          code: normalized.code,
          retryable: normalized.retryable,
          timestamp: normalized.timestamp,
        },
        case_code: caseCode || null,
      });
    } catch (logErr) {
      console.error('Kritisch: System-Log konnte nicht in Supabase geschrieben werden:', logErr);
    }
  }

  return NextResponse.json(
    {
      success: false,
      error: {
        code: normalized.code,
        message: normalized.userMessage, // Dem User wird IMMER die sichere, verständliche Nachricht gezeigt
        retryable: normalized.retryable,
      },
    },
    { status: normalized.statusCode || 500 }
  );
}
