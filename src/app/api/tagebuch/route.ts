// src/app/api/tagebuch/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { requireCaseSession } from '@/src/lib/api/case-auth';
import { handleApiError } from '@/src/lib/api/error-handler';
import { ValidationError } from '@/src/lib/api/errors';
import { isValidTagebuchEntryKey, safeAssign, safeDelete } from '@/src/lib/api/validation';
import { TAGEBUCH_MODULE_NUMBER } from '@/src/lib/pflegegrad/assessment-modules';
import { createAdminSupabaseClient } from '@/src/lib/supabase/admin';
import { Json } from '@/src/types/supabase';
import { TagebuchData, TagebuchEintrag } from '@/src/types/tagebuch';

// ⚠️ Historisch lag das Tagebuch unter module_number 5 und kollidierte mit den
// Antworten von Pflegegrad-Modul 5 (beide haben sich gegenseitig überschrieben).
// Neuer, kollisionsfreier Namespace: TAGEBUCH_MODULE_NUMBER (10).

// GET: Abrufen aller Einträge eines Falls
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const caseCode = searchParams.get('caseCode');

  if (!caseCode) {
    return NextResponse.json({ error: 'Fallcode erforderlich' }, { status: 400 });
  }

  try {
    const session = await requireCaseSession(caseCode);
    const supabase = createAdminSupabaseClient();

    const { data: existingRecord, error } = await supabase
      .from('answers')
      .select('answers')
      .eq('case_id', session.caseId)
      .eq('module_number', TAGEBUCH_MODULE_NUMBER)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json(existingRecord?.answers || {});
  } catch (err) {
    return handleApiError(err, 'api.tagebuch.get', caseCode);
  }
}

// POST: Hinzufügen oder Aktualisieren eines Eintrags im JSONB-Tree
export async function POST(request: NextRequest) {
  let caseCode: string | undefined;
  try {
    const body = (await request.json()) as {
      caseCode?: string;
      entryKey?: string | null;
      payload?: TagebuchEintrag;
    };
    caseCode = body.caseCode;
    const { entryKey, payload } = body;

    if (!caseCode || !payload || !payload.date) {
      throw new ValidationError('Payload unvollständig.');
    }

    const session = await requireCaseSession(caseCode);
    const supabase = createAdminSupabaseClient();

    // Hole den bestehenden Tree
    const { data: existingRecord } = await supabase
      .from('answers')
      .select('answers')
      .eq('case_id', session.caseId)
      .eq('module_number', TAGEBUCH_MODULE_NUMBER)
      .maybeSingle();

    // 🛡️ Nutzer-Schlüssel strikt validieren (Schutz vor Prototype Pollution):
    // erlaubt ist ausschließlich das selbst vergebene Format entry_<Zeitstempel>
    if (entryKey && !isValidTagebuchEntryKey(entryKey)) {
      throw new ValidationError('Ungültiger Eintrags-Schlüssel.');
    }

    // Prototyploses Objekt: Es gibt kein __proto__, das verschmutzt werden könnte
    const currentAnswers: TagebuchData = Object.assign(
      Object.create(null),
      (existingRecord?.answers as unknown as TagebuchData) || {}
    );

    // ID generieren, falls es ein neuer Eintrag ist (Key = Zeitstempel oder bestehender Key)
    const targetKey = entryKey || `entry_${Date.now()}`;

    const existingCreatedAt = Object.prototype.hasOwnProperty.call(currentAnswers, targetKey)
      ? currentAnswers[targetKey]?.created_at
      : undefined;

    safeAssign(currentAnswers, targetKey, {
      ...payload,
      created_at: existingCreatedAt || new Date().toISOString(),
    });

    const { error: upsertError } = await supabase.from('answers').upsert(
      {
        case_id: session.caseId,
        module_number: TAGEBUCH_MODULE_NUMBER,
        module_name: 'tagebuch',
        answers: currentAnswers as unknown as Json,
        completed_at: new Date().toISOString(),
      },
      {
        onConflict: 'case_id,module_number',
      }
    );

    if (upsertError) throw upsertError;

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err, 'api.tagebuch.post', caseCode);
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
    // 🛡️ Schutz vor Prototype Pollution: nur das eigene Schlüsselformat zulassen
    if (!isValidTagebuchEntryKey(entryKey)) {
      throw new ValidationError('Ungültiger Eintrags-Schlüssel.');
    }

    const session = await requireCaseSession(caseCode);
    const supabase = createAdminSupabaseClient();

    const { data: existingRecord } = await supabase
      .from('answers')
      .select('answers')
      .eq('case_id', session.caseId)
      .eq('module_number', TAGEBUCH_MODULE_NUMBER)
      .maybeSingle();

    if (!existingRecord?.answers) {
      return NextResponse.json({ success: true });
    }

    const currentAnswers: TagebuchData = Object.assign(
      Object.create(null),
      existingRecord.answers as unknown as TagebuchData
    );
    // Löscht nur eigene, ungefährliche Schlüssel (Prototype-Pollution-Sperre inline)
    safeDelete(currentAnswers, entryKey);

    const { error: updateError } = await supabase.from('answers').upsert(
      {
        case_id: session.caseId,
        module_number: TAGEBUCH_MODULE_NUMBER,
        module_name: 'tagebuch',
        answers: currentAnswers as unknown as Json,
        completed_at: new Date().toISOString(),
      },
      {
        onConflict: 'case_id,module_number',
      }
    );

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err, 'api.tagebuch.delete', caseCode);
  }
}
