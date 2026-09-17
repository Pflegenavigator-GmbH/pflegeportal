// src/api/cases/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { handleApiError } from '@/src/lib/api/error-handler';
import { RateLimitError } from '@/src/lib/api/errors';
import { checkRateLimit, getClientIp } from '@/src/lib/api/rate-limit';
import { berechneCaseCodeHash, erzeugeFallcode } from '@/src/lib/case-code-server';
import { createAdminSupabaseClient } from '@/src/lib/supabase/admin';

// Max. 5 neue Fälle pro IP und Stunde — verhindert DB-Flooding über die
// ungeschützte Fallerstellung.
const CREATE_LIMIT = 5;
const CREATE_WINDOW_MS = 60 * 60 * 1000;

/**
 * Wie oft ein neuer Code versucht wird, falls der Unique-Index anschlägt.
 *
 * Die alte DB-Funktion `create_case` hatte keinen solchen Versuch: Eine
 * Kollision hätte die Fallanlage abgebrochen. Bei 32^8 Möglichkeiten ist schon
 * der erste Versuch praktisch immer frei — die Schleife kostet nichts und
 * nimmt den Fall aus der Welt.
 */
const MAX_VERSUCHE = 5;

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (!checkRateLimit(`cases:create:${ip}`, CREATE_LIMIT, CREATE_WINDOW_MS)) {
      throw new RateLimitError(`Fallerstellung gedrosselt für IP ${ip}`);
    }

    const supabaseAdmin = createAdminSupabaseClient();

    // Der Code entsteht seit #153 hier, nicht mehr in der DB-Funktion
    // `create_case`: Dort kam er aus `random()` — kein kryptografischer
    // Zufall — und der Pepper für den Suchschlüssel darf ohnehin nicht in
    // PostgreSQL liegen. Gespeichert wird nur der Hash; den Klartext bekommt
    // die Anfragende genau einmal, hier in der Antwort.
    for (let versuch = 1; versuch <= MAX_VERSUCHE; versuch++) {
      const fallcode = erzeugeFallcode();

      const { data, error } = await supabaseAdmin
        .from('cases')
        .insert({
          case_code_hash: berechneCaseCodeHash(fallcode),
          status: 'draft',
          billing_status: 'pending',
          schwerbehinderung: false,
          versicherungs_typ: 'gesetzlich',
          total_score: 0,
        })
        .select('id')
        .single();

      if (!error && data) {
        return NextResponse.json({ id: data.id, caseCode: fallcode }, { status: 201 });
      }

      // 23505 = unique_violation: derselbe Suchschlüssel existiert bereits.
      // Jeder andere Fehler ist keiner, den ein neuer Code heilt.
      if (error?.code !== '23505') {
        throw error;
      }
    }

    throw new Error('Kein freier Fallcode nach mehreren Versuchen.');
  } catch (err: unknown) {
    return handleApiError(err, 'api.cases.create');
  }
}
