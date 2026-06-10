// src/app/api/tagebuch/page.tsx
import { NextResponse } from 'next/server';

import { createServerSupabaseClient } from '@/src/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const caseCode = searchParams.get('caseCode');

    if (!caseCode) {
      return NextResponse.json({ error: 'Missing caseCode' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('id')
      .eq('case_code', caseCode)
      .single();

    if (caseError || !caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('answers')
      .select('*')
      .eq('case_id', caseData.id)
      .eq('module_number', 5)
      .single(); // Wir holen das gesamte JSON-Objekt des Moduls

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = Not found
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data?.answers || {});
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { caseCode, content, date, originalDate } = await request.json(); // originalDate hilft uns beim Bearbeiten

    if (!caseCode || !content)
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const supabase = await createServerSupabaseClient();
    const { data: caseData } = await supabase
      .from('cases')
      .select('id')
      .eq('case_code', caseCode)
      .single();
    if (!caseData) return NextResponse.json({ error: 'Case not found' }, { status: 404 });

    // Wenn wir bearbeiten, nutzen wir das Datum des alten Eintrags als Key
    const entryKey = `entry_${new Date(originalDate || date).getTime()}`;

    const { data: existing } = await supabase
      .from('answers')
      .select('answers')
      .eq('case_id', caseData.id)
      .eq('module_number', 5)
      .maybeSingle();

    const answers = existing?.answers || {};

    // Wenn das Datum geändert wurde und der alte Key existiert, lösche ihn vorher
    if (originalDate && originalDate !== date) {
      delete answers[`entry_${new Date(originalDate).getTime()}`];
    }

    answers[entryKey] = {
      content,
      date: date,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('answers').upsert(
      {
        case_id: caseData.id,
        module_number: 5,
        module_name: 'tagebuch', // <-- WICHTIG: Das muss mitgeschickt werden!
        answers: answers,
        completed_at: new Date().toISOString(),
      },
      { onConflict: 'case_id,module_number' }
    );

    if (error) throw error;
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const caseCode = searchParams.get('caseCode');
    const entryKey = searchParams.get('entryKey');

    if (!caseCode || !entryKey)
      return NextResponse.json({ error: 'Missing params' }, { status: 400 });

    const supabase = await createServerSupabaseClient();

    // Fall ID holen
    const { data: caseData } = await supabase
      .from('cases')
      .select('id')
      .eq('case_code', caseCode)
      .single();

    // Bestehendes JSON laden
    const { data: existing } = await supabase
      .from('answers')
      .select('answers')
      .eq('case_id', caseData!.id)
      .eq('module_number', 5)
      .single();

    const answers = existing?.answers || {};
    delete answers[entryKey]; // Eintrag entfernen

    // Speichern
    await supabase
      .from('answers')
      .update({ answers })
      .eq('case_id', caseData!.id)
      .eq('module_number', 5);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
