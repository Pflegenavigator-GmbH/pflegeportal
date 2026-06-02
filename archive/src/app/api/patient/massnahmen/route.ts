// src/app/api/patient/massnahmen/route.ts
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

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const patient = getAuthenticatedPatient(req);
    if (!patient) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const kategorie = searchParams.get('kategorie') || undefined;
    const vonDatum = searchParams.get('von') || undefined;
    const bisDatum = searchParams.get('bis') || undefined;

    const supabase = createClient();
    
    let query = supabase
      .from('pflege_massnahmen')
      .select(`
        *,
        pflegekraft:pflegekraft_id (name),
        pflegedienst:pflegedienst_id (name)
      `)
      .eq('patient_id', patient.patientId)
      .eq('freigegeben_fuer_patient', true);
    
    if (kategorie) query = query.eq('kategorie', kategorie);
    if (vonDatum) query = query.gte('durchgefuehrt_am', vonDatum);
    if (bisDatum) query = query.lte('durchgefuehrt_am', bisDatum);
    
    query = query.order('durchgefuehrt_am', { ascending: false });
    
    const { data, error } = await query;

    if (error) throw error;

    if (data && data.length > 0) {
      const ids = data.map(m => m.id);
      await supabase
        .from('pflege_massnahmen')
        .update({ gelesen_am: new Date().toISOString() })
        .in('id', ids)
        .is('gelesen_am', null);
    }

    return NextResponse.json({
      success: true,
      data: data?.map(mapToInterface) || [],
      count: data?.length || 0
    });

  } catch (error) {
    console.error('Fehler beim Abrufen der Maßnahmen:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' }, 
      { status: 500 }
    );
  }
}
