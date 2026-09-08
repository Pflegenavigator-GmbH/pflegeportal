import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/src/lib/logger';
import { createAdminSupabaseClient } from '@/src/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';

    if (!query.trim()) {
      return NextResponse.json([]);
    }

    // Öffentliches Verzeichnis (pflegedienste): Admin-Client, damit die Abfrage
    // auch bei aktivierter RLS ohne anon-Policy funktioniert
    const supabase = createAdminSupabaseClient();

    // Suche filtert über PostgreSQL ILIKE parallel nach Postleitzahl oder Stadtname
    const { data, error } = await supabase
      .from('pflegedienste')
      .select('*')
      .or(`stadt.ilike.%${query}%,plz.like.%${query}%`)
      .order('bewertung', { ascending: false })
      .limit(15);

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    logger.error({ err: error }, 'API-Fehler bei Pflegedienst-Suche');
    return NextResponse.json(
      { error: 'Die Suche konnte serverseitig nicht verarbeitet werden.' },
      { status: 500 }
    );
  }
}
