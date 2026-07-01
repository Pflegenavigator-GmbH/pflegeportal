// src/app/api/tagebuch/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/src/lib/logger';
import { createServerSupabaseClient } from '@/src/lib/supabase/server';

// GET: Abrufen aller Einträge eines Falls
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const caseCode = searchParams.get('caseCode');

  if (!caseCode) {
    return NextResponse.json({ error: 'Fallcode erforderlich' }, { status: 400 });
  }

  try {
    const supabase = await createServerSupabaseClient();

    // 1. Hole die interne case_id über den Code
    const { data: caseData, error: caseError } = await supabase
        .from('cases')
        .select('id')
        .eq('case_code', caseCode.toUpperCase())
        .single();

    if (caseError || !caseData) {
      return NextResponse.json({ error: 'Fall nicht gefunden' }, { status: 404 });
    }

    // 2. Hole den JSONB-Eintrag aus der answers-Tabelle (Modul 5 = Tagebuch)
    const { data: existingRecord, error } = await supabase
        .from('answers')
        .select('answers')
        .eq('case_id', caseData.id)
        .eq('module_number', 5)
        .maybeSingle();

    if (error) throw error;

    // Liefert das Dictionary zurück oder ein leeres Objekt
    return NextResponse.json(existingRecord?.answers || {});
  } catch (err) {
    logger.error({ err, caseCode }, 'Fehler in GET /api/tagebuch');
    return NextResponse.json({ error: 'Serverfehler beim Laden' }, { status: 500 });
  }
}

// POST: Hinzufügen oder Aktualisieren eines Eintrags im JSONB-Tree
export async function POST(request: NextRequest) {
  try {
    const { caseCode, entryKey, payload } = await request.json();

    if (!caseCode || !payload || !payload.date) {
      return NextResponse.json({ error: 'Payload unvollständig' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    const { data: caseData, error: caseError } = await supabase
        .from('cases')
        .select('id')
        .eq('case_code', caseCode.toUpperCase())
        .single();

    if (caseError || !caseData) {
      return NextResponse.json({ error: 'Fall nicht gefunden' }, { status: 404 });
    }

    // Hole den bestehenden Tree
    const { data: existingRecord } = await supabase
        .from('answers')
        .select('answers')
        .eq('case_id', caseData.id)
        .eq('module_number', 5)
        .maybeSingle();

    const currentAnswers = (existingRecord?.answers as Record<string, any>) || {};

    // ID generieren, falls es ein neuer Eintrag ist (Key = Zeitstempel oder bestehender Key)
    const targetKey = entryKey || `entry_${Date.now()}`;

    // Neuen Eintrag hinzufügen oder bestehenden überschreiben
    currentAnswers[targetKey] = {
      ...payload,
      created_at: currentAnswers[targetKey]?.created_at || new Date().toISOString(),
    };

    // Upsert in die answers-Tabelle
    const { error: upsertError } = await supabase
        .from('answers')
        .upsert(
            {
              case_id: caseData.id,
              module_number: 5,
              module_name: 'tagebuch',
              answers: currentAnswers,
              completed_at: new Date().toISOString(),
            },
            {
              onConflict: 'case_id,module_number',
            }
        );

    if (upsertError) throw upsertError;

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error({ err }, 'Fehler in POST /api/tagebuch');
    return NextResponse.json({ error: 'Serverfehler beim Speichern' }, { status: 500 });
  }
}

// DELETE: Entfernen eines Eintrags aus dem JSONB-Tree
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const caseCode = searchParams.get('caseCode');
  const entryKey = searchParams.get('entryKey');

  if (!caseCode || !entryKey) {
    return NextResponse.json({ error: 'Parameter unvollständig' }, { status: 400 });
  }

  try {
    const supabase = await createServerSupabaseClient();

    const { data: caseData, error: caseError } = await supabase
        .from('cases')
        .select('id')
        .eq('case_code', caseCode.toUpperCase())
        .single();

    if (caseError || !caseData) {
      return NextResponse.json({ error: 'Fall nicht gefunden' }, { status: 404 });
    }

    const { data: existingRecord } = await supabase
        .from('answers')
        .select('answers')
        .eq('case_id', caseData.id)
        .eq('module_number', 5)
        .maybeSingle();

    if (!existingRecord?.answers) {
      return NextResponse.json({ success: true });
    }

    const currentAnswers = existingRecord.answers as Record<string, any>;

    // Den Schlüssel aus dem JSONB-Objekt löschen
    delete currentAnswers[entryKey];

    const { error: updateError } = await supabase
        .from('answers')
        .upsert({
          case_id: caseData.id,
          module_number: 5,
          module_name: 'tagebuch',
          answers: currentAnswers,
          completed_at: new Date().toISOString(),
        }, {
          onConflict: 'case_id,module_number',
        });

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error({ err }, 'Fehler in DELETE /api/tagebuch');
    return NextResponse.json({ error: 'Serverfehler beim Löschen' }, { status: 500 });
  }
}
