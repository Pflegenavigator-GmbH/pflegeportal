// src/lib/system-log.ts
import { schwaerzeFallcodes, schwaerzeFallcodesInJson } from '@/src/lib/log-schwaerzung';
import { logger } from '@/src/lib/logger';
import { createAdminSupabaseClient } from '@/src/lib/supabase/admin';
import type { Database, Json } from '@/src/types/supabase';

type SystemLogLevel = Database['public']['Tables']['system_logs']['Insert']['level'];

export interface SystemLogEintrag {
  level: SystemLogLevel;
  source: string;
  message: string;
  metadata?: Record<string, unknown>;
  /**
   * Fallbezug für die Auswertung — die interne `case_id`, NIE der Fallcode.
   * Landet in der Spalte `case_id` (Fremdschlüssel, `on delete set null`):
   * Wird der Fall gelöscht, verschwindet der Verweis von selbst.
   */
  caseId?: string;
}

/**
 * Einziger Schreibweg nach `system_logs`.
 *
 * Schwärzt Fallcodes in `message` und `metadata`, bevor etwas die Datenbank
 * erreicht (Issue #145). Die Spalte `case_code` wird bewusst nicht mehr
 * befüllt — ein Zugangsmittel gehört in keine Protokolltabelle.
 *
 * Wirft nie: Ein fehlgeschlagener Protokolleintrag darf die eigentliche
 * Anfrage nicht scheitern lassen. Der Fehlschlag selbst geht ins Laufzeit-Log.
 */
export async function schreibeSystemLog(eintrag: SystemLogEintrag): Promise<void> {
  const { level, source, message, metadata, caseId } = eintrag;

  try {
    const supabase = createAdminSupabaseClient();
    const { error } = await supabase.from('system_logs').insert({
      level,
      source,
      message: schwaerzeFallcodes(message),
      metadata: schwaerzeFallcodesInJson(metadata ?? {}) as Json,
      case_id: caseId ?? null,
    });

    if (error) throw error;
  } catch (err) {
    logger.error({ err, source }, 'System-Log konnte nicht in Supabase geschrieben werden');
  }
}
