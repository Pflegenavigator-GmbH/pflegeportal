// src/app/api/cases/[code]/bescheid-datum/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { requireCaseSession } from '@/src/lib/api/case-auth';
import { handleApiError } from '@/src/lib/api/error-handler';
import { ValidationError } from '@/src/lib/api/errors';
import { logger } from '@/src/lib/logger';
import { createAdminSupabaseClient } from '@/src/lib/supabase/admin';
import { pruefeBescheidDatum } from '@/src/lib/widerspruch/bescheid-datum';

interface BescheidDatumRequest {
  /** ISO-Datum (YYYY-MM-DD) oder null zum Zurücksetzen. */
  bescheidDatum?: unknown;
}

/**
 * Speichert den Zugang des Pflegegrad-Bescheids am Fall.
 *
 * Verbindliche Prüfinstanz: Die Validierung im Formular dient nur der
 * schnellen Rückmeldung und wird hier unabhängig wiederholt.
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  try {
    const session = await requireCaseSession(code);
    const body = (await request.json()) as BescheidDatumRequest;

    // Explizites Zurücksetzen erlauben — der Nutzer darf eine Fehleingabe
    // wieder entfernen, statt mit einem falschen Datum festzusitzen.
    let wert: string | null = null;

    if (body.bescheidDatum !== null && body.bescheidDatum !== undefined) {
      const pruefung = pruefeBescheidDatum(body.bescheidDatum);
      if (!pruefung.gueltig) {
        throw new ValidationError(pruefung.fehler);
      }
      wert = pruefung.wert;
    }

    const supabase = createAdminSupabaseClient();
    const { error } = await supabase
      .from('cases')
      .update({ bescheid_datum: wert })
      .eq('id', session.caseId);

    if (error) throw error;

    logger.info({ caseCode: code, gesetzt: wert !== null }, 'Bescheiddatum am Fall aktualisiert');

    return NextResponse.json({ success: true, data: { bescheidDatum: wert } });
  } catch (err) {
    return handleApiError(err, 'api.cases.bescheid-datum.put', code);
  }
}

/** Liefert das gespeicherte Bescheiddatum des Falls. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  try {
    const session = await requireCaseSession(code);

    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('cases')
      .select('bescheid_datum')
      .eq('id', session.caseId)
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: { bescheidDatum: data?.bescheid_datum ?? null },
    });
  } catch (err) {
    return handleApiError(err, 'api.cases.bescheid-datum.get', code);
  }
}
