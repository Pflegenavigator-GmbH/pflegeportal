// src/app/lib/api/error-handler.ts
import { NextResponse } from 'next/server';

import { normalizeError, shouldLogError } from '@/src/lib/api/errors';
import { logger } from '@/src/lib/logger';
import { schreibeSystemLog } from '@/src/lib/system-log';

/**
 * Übersetzt jeden Fehler in eine sichere HTTP-Antwort und protokolliert ihn.
 *
 * Nimmt bewusst KEINEN Fallcode entgegen. Früher lag hier ein dritter
 * Parameter `caseCode`, der bei jedem Fehler einer Fallroute ins Laufzeit-Log
 * und nach `system_logs.case_code` geschrieben wurde — ein Zugangsmittel im
 * Klartext in zwei Protokollen (Issue #145). Ein Fallbezug, wo nötig, kommt
 * als `caseId` über den Fehlerkontext.
 */
export async function handleApiError(error: unknown, source: string): Promise<NextResponse> {
  // Normalisiert jeden Fehler (egal ob String, nativer Error oder Supabase-Fehler) in unsere Struktur
  const normalized = normalizeError(error);

  // Strukturiertes Log statt String-Interpolation: Nutzerwerte sind Felder,
  // nie Teil der Log-Message selbst
  logger.error(
    {
      source,
      code: normalized.code,
      message: normalized.message,
      context: normalized.context,
    },
    'API-Fehler'
  );

  // Nur loggen, wenn das Log-Level nicht 'debug' ist
  if (shouldLogError(normalized)) {
    // Automatische Dokumentation im System-Audit-Trail (Supabase)
    await schreibeSystemLog({
      level: normalized.logLevel,
      source,
      message: normalized.message,
      metadata: {
        context: normalized.context,
        code: normalized.code,
        retryable: normalized.retryable,
        timestamp: normalized.timestamp,
      },
    });
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
