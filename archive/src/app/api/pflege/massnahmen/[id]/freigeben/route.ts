// src/app/api/pfege/massnahmen/[id]/freigeben/route.ts
/**
 * API Routes für Pflege-Maßnahmen (Freigabe)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { FreigabeRequest, PflegeMassnahme } from '@/types/pflege-massnahmen';

function getAuthenticatedUser(req: NextRequest): { userId: string; rolle: string; pflegedienstId?: string } | null {
  // In Produktion: JWT-Token validieren
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return null;
  
  return {
    userId: 'mock-user-id',
    rolle: 'pflegekraft',
    pflegedienstId: 'mock-pflegedienst-id'
  };
}

function mapDatabaseToInterface(dbRecord: any): PflegeMassnahme {
  return {
    id: dbRecord.id,
    patientId: dbRecord.patient_id,
    patientName: dbRecord.patient?.name,
    pflegekraftId: dbRecord.pflegekraft_id,
    pflegekraftName: dbRecord.pflegekraft?.name,
    pflegedienstId: dbRecord.pflegedienst_id,
    pflegedienstName: dbRecord.pflegedienst?.name,
    kategorie: dbRecord.kategorie,
    unterkategorie: dbRecord.unterkategorie,
    beschreibung: dbRecord.beschreibung,
    durchgefuehrtAm: dbRecord.durchgefuehrt_am,
    naechsterTermin: dbRecord.naechster_termin,
    dauerMinuten: dbRecord.dauer_minuten,
    notizen: dbRecord.notizen,
    interneNotizen: dbRecord.interne_notizen,
    dokumente: dbRecord.dokumente,
    vitalzeichen: dbRecord.vitalzeichen,
    schmerzScore: dbRecord.schmerz_score,
    zustandPatient: dbRecord.zustand_patient,
    status: dbRecord.status,
    abbruchGrund: dbRecord.abbruch_grund,
    freigegebenFuerPatient: dbRecord.freigegeben_fuer_patient,
    freigegebenAm: dbRecord.freigegeben_am,
    freigegebenVon: dbRecord.freigegeben_von,
    patientFeedback: dbRecord.patient_feedback,
    erstelltAm: dbRecord.erstellt_am,
    aktualisiertAm: dbRecord.aktualisiert_am,
    version: dbRecord.version
  };
}

// ============================================
// PATCH /api/pflege/massnahmen/:id/freigeben
// Maßnahme für Patient freigeben
// ============================================

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const { id } = await params;
    const body: FreigabeRequest = await req.json();

    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('pflege_massnahmen')
      .update({
        freigegeben_fuer_patient: body.freigegeben,
        freigegeben_am: body.freigegeben ? new Date().toISOString() : null,
        freigegeben_von: body.freigegeben ? user.userId : null,
        aktualisiert_am: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: mapDatabaseToInterface(data),
      message: body.freigegeben 
        ? 'Maßnahme für Patient freigegeben' 
        : 'Freigabe zurückgezogen'
    });

  } catch (error) {
    console.error('Fehler bei der Freigabe:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' }, 
      { status: 500 }
    );
  }
}
