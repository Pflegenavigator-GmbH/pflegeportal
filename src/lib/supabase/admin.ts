// src/lib/supabase/admin.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { Database } from '@/src/types/supabase';

/**
 * Hochprivilegierter Server-Client (Service-Role).
 * NIEMALS in Client-Komponenten importieren — der Key umgeht RLS vollständig.
 * Alle serverseitigen Schreibzugriffe (Webhook, Answers, Tagebuch, Logging)
 * laufen über diesen Client; die Autorisierung übernimmt requireCaseSession().
 */
export function createAdminSupabaseClient(): SupabaseClient<Database> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'SUPABASE_URL oder SUPABASE_SERVICE_ROLE_KEY fehlt in den Server-Umgebungsvariablen.'
    );
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
