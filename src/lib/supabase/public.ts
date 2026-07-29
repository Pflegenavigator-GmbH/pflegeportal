// src/lib/supabase/public.ts
import { createClient } from '@supabase/supabase-js';

import { Database } from '@/src/types/supabase';

/**
 * Cookie-freier Anon-Client für öffentliche Lesezugriffe (z.B. Presseportal).
 *
 * Bewusst OHNE Cookies/Session: `createServerSupabaseClient` liest Cookies und
 * zwingt die Route damit ins dynamische Rendering — das würde ISR/CDN-Caching
 * aushebeln. Dieser Client bleibt statisch-/ISR-tauglich.
 *
 * Sicherheit: Es kommt der Anon-Key mit aktiver RLS zum Einsatz. Für `posts`
 * gibt die Policy ausschließlich `status = 'published'` frei — Entwürfe sind
 * damit auch hier unsichtbar.
 */
export function createPublicSupabaseClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}
