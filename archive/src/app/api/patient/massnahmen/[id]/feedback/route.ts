// src/app/api/patient/massnahmen/[id]/feedback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PflegeMassnahme } from '@/types/pflege-massnahmen';

function getAuthenticatedPatient(req: NextRequest): { patientId: string; email: string } | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return null;
  return {
    patientId: 'mock-patient-id',
    email: 'patient@example.com'
  };
}

interface CreateFeedbackRequest {
  bewertung: number;
  kommentar?: string;
  beduerfnisse?: string;
  besonderheiten?: string;
  erstelltVon: 'patient' | 'angehoeriger';
  name?: string;
}

function mapToInterface(dbRecord: any): PflegeMassnahme {
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
    interneNotizen: undefined,
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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const patient = getAuthenticatedPatient(req);
    if (!patient) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const { id } = await params;
    const body: CreateFeedbackRequest = await req.json();

    const supabase = createClient();
    
    const { data: massnahme, error: checkError } = await supabase
      .from('pflege_massnahmen')
      .select('id, patient_id, freigegeben_fuer_patient')
      .eq('id', id)
      .single();
    
    if (checkError || !massnahme) {
      return NextResponse.json({ error: 'Maßnahme nicht gefunden' }, { status: 404 });
    }
    
    if (massnahme.patient_id !== patient.patientId) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 });
    }
    
    if (!massnahme.freigegeben_fuer_patient) {
      return NextResponse.json({ error: 'Maßnahme nicht freigegeben' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('pflege_massnahmen')
      .update({
        patient_feedback: {
          bewertung: body.bewertung,
          kommentar: body.kommentar,
          beduerfnisse: body.beduerfnisse,
          besonderheiten: body.besonderheiten,
          erstellt_am: new Date().toISOString(),
          erstellt_von: body.erstelltVon,
          name: body.name
        },
        aktualisiert_am: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Feedback gespeichert',
      data: mapToInterface(data)
    });

  } catch (error) {
    console.error('Fehler beim Speichern des Feedbacks:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' }, 
      { status: 500 }
    );
  }
}
