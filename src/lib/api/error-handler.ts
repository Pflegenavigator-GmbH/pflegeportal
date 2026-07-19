// src/app/lib/api/error-handler.ts
import { NextResponse } from 'next/server';

import { normalizeError, shouldLogError } from '@/src/lib/api/errors';
import { logger } from '@/src/lib/logger';
import { createAdminSupabaseClient } from '@/src/lib/supabase/admin';

export async function handleApiError(
  error: unknown,
  source: string,
  caseCode?: string
): Promise<NextResponse> {
  // Normalisiert jeden Fehler (egal ob String, nativer Error oder Supabase-Fehler) in unsere Struktur
  const normalized = normalizeError(error);

  // caseCode ist nutzerkontrolliert: auf harmlose Zeichen reduzieren, damit
  // weder Format-Platzhalter noch Zeilenumbrüche in Logs landen
  // (CodeQL: js/tainted-format-string, js/log-injection)
  const safeCaseCode = (caseCode ?? '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64) || 'kein';

  // Strukturiertes Log statt String-Interpolation: Nutzerwerte sind Felder,
  // nie Teil der Log-Message selbst
  logger.error(
    {
      source,
      caseCode: safeCaseCode,
      code: normalized.code,
      message: normalized.message,
      context: normalized.context,
    },
    'API-Fehler'
  );

  // Nur loggen, wenn das Log-Level nicht 'debug' ist
  if (shouldLogError(normalized)) {
    try {
      const supabase = createAdminSupabaseClient();

      // Automatische Dokumentation im System-Audit-Trail (Supabase)
      await supabase.from('system_logs').insert({
        level: normalized.logLevel,
        source,
        message: normalized.message,
        // JSON.parse(JSON.stringify(...)) erzwingt serialisierbare Werte —
        // context ist ein freies Record und nicht per se Json-kompatibel
        metadata: JSON.parse(
          JSON.stringify({
            context: normalized.context,
            code: normalized.code,
            retryable: normalized.retryable,
            timestamp: normalized.timestamp,
          })
        ),
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
