// src/app/api/pflege/massnahmen/route.ts
/**
 * API Routes für Pflege-Maßnahmen
 * RESTful API für CRUD-Operationen
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  PflegeMassnahme, 
  CreateMassnahmeRequest, 
  MassnahmenFilter,
  PflegeKategorie,
  MassnahmeStatus
} from '@/types/pflege-massnahmen';

// ============================================
// HILFSFUNKTIONEN
// ============================================

function getAuthenticatedUser(req: NextRequest): { userId: string; rolle: string; pflegedienstId?: string } | null {
  // In Produktion: JWT-Token validieren
  // Für Entwicklung: Mock-User
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return null;
  
  return {
    userId: 'mock-user-id',
    rolle: 'pflegekraft',
    pflegedienstId: 'mock-pflegedienst-id'
  };
}

// ============================================
// POST /api/pflege/massnahmen
// Neue Maßnahme erstellen
// ============================================

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const body: CreateMassnahmeRequest = await req.json();
    
    // Validierung
    if (!body.patientId || !body.beschreibung || !body.kategorie) {
      return NextResponse.json(
        { error: 'Pflichtfelder fehlen: patientId, beschreibung, kategorie' }, 
        { status: 400 }
      );
    }

    const supabase = createClient();
    
    // Maßnahme erstellen
    const { data, error } = await supabase
      .from('pflege_massnahmen')
      .insert({
        patient_id: body.patientId,
        pflegekraft_id: user.userId,
        pflegedienst_id: user.pflegedienstId,
        kategorie: body.kategorie,
        unterkategorie: body.unterkategorie,
        beschreibung: body.beschreibung,
        durchgefuehrt_am: body.durchgefuehrtAm,
        naechster_termin: body.naechsterTermin,
        dauer_minuten: body.dauerMinuten,
        notizen: body.notizen,
        interne_notizen: body.interneNotizen,
        vitalzeichen: body.vitalzeichen,
        schmerz_score: body.schmerzScore,
        zustand_patient: body.zustandPatient,
        status: body.status || MassnahmeStatus.DURCHGEFUEHRT,
        freigegeben_fuer_patient: false,
        erstellt_am: new Date().toISOString(),
        aktualisiert_am: new Date().toISOString(),
        version: 1
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: mapDatabaseToInterface(data)
    }, { status: 201 });

  } catch (error) {
    console.error('Fehler beim Erstellen der Maßnahme:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' }, 
      { status: 500 }
    );
  }
}

// ============================================
// GET /api/pflege/massnahmen
// Alle Maßnahmen abrufen (mit Filter)
// ============================================

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    
    const filter: MassnahmenFilter = {
      patientId: searchParams.get('patientId') || undefined,
      pflegekraftId: searchParams.get('pflegekraftId') || undefined,
      kategorie: searchParams.get('kategorie') as PflegeKategorie || undefined,
      status: searchParams.get('status') as MassnahmeStatus || undefined,
      vonDatum: searchParams.get('vonDatum') || undefined,
      bisDatum: searchParams.get('bisDatum') || undefined,
      freigegeben: searchParams.get('freigegeben') === 'true' ? true : 
                   searchParams.get('freigegeben') === 'false' ? false : undefined,
      suchbegriff: searchParams.get('q') || undefined
    };

    const supabase = createClient();
    
    let query = supabase
      .from('pflege_massnahmen')
      .select(`
        *,
        patient:patient_id (name, geburtsdatum),
        pflegekraft:pflegekraft_id (name),
        pflegedienst:pflegedienst_id (name)
      `);
    
    // Filter anwenden
    if (filter.patientId) query = query.eq('patient_id', filter.patientId);
    if (filter.pflegekraftId) query = query.eq('pflegekraft_id', filter.pflegekraftId);
    if (filter.kategorie) query = query.eq('kategorie', filter.kategorie);
    if (filter.status) query = query.eq('status', filter.status);
    if (filter.freigegeben !== undefined) query = query.eq('freigegeben_fuer_patient', filter.freigegeben);
    if (filter.vonDatum) query = query.gte('durchgefuehrt_am', filter.vonDatum);
    if (filter.bisDatum) query = query.lte('durchgefuehrt_am', filter.bisDatum);
    
    // Suche in Beschreibung
    if (filter.suchbegriff) {
      query = query.ilike('beschreibung', `%${filter.suchbegriff}%`);
    }
    
    // Nur eigene Patienten (Pflegedienst-Scope)
    if (user.pflegedienstId) {
      query = query.eq('pflegedienst_id', user.pflegedienstId);
    }
    
    // Sortierung
    query = query.order('durchgefuehrt_am', { ascending: false });
    
    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data?.map(mapDatabaseToInterface) || [],
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

// ============================================
// HILFSFUNKTIONEN
// ============================================

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
