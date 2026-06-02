import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/src/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('query') || '';

        if (!query.trim()) {
            return NextResponse.json([]);
        }

        // Server-seitigen Supabase Client für sichere Abfragen initiieren
        const supabase = await createServerSupabaseClient();

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
        console.error('API-Fehler bei Pflegedienst-Suche:', error);
        return NextResponse.json(
            { error: 'Die Suche konnte serverseitig nicht verarbeitet werden.' },
            { status: 500 }
        );
    }
}