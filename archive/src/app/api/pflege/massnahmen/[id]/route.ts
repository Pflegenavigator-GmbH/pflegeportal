// src/app/api/pflege/massnahmen/[id]/route.ts
/**
 * API Routes für Pflege-Maßnahmen (Einzelne Maßnahme)
 * RESTful API für CRUD-Operationen
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { UpdateMassnahmeRequest, PflegeMassnahme } from '@/types/pflege-massnahmen';

// ============================================
// HILFSFUNKTIONEN
// ============================================

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
// PUT /api/pflege/massnahmen/:id
// Maßnahme aktualisieren
// ============================================

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const { id } = await params;
    const body: UpdateMassnahmeRequest = await req.json();

    const supabase = createClient();
    
    // Prüfe Berechtigung
    const { data: existing } = await supabase
      .from('pflege_massnahmen')
      .select('pflegekraft_id, version')
      .eq('id', id)
      .single();
    
    if (!existing) {
      return NextResponse.json({ error: 'Maßnahme nicht gefunden' }, { status: 404 });
    }
    
    // Optimistic Locking
    if (body.version && existing.version !== body.version) {
      return NextResponse.json(
        { error: 'Konflikt: Maßnahme wurde zwischenzeitlich geändert' }, 
        { status: 409 }
      );
    }

    // Update
    const updateData: any = {
      aktualisiert_am: new Date().toISOString(),
      version: existing.version + 1
    };
    
    if (body.beschreibung !== undefined) updateData.beschreibung = body.beschreibung;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.notizen !== undefined) updateData.notizen = body.notizen;
    if (body.interneNotizen !== undefined) updateData.interne_notizen = body.interneNotizen;
    if (body.vitalzeichen !== undefined) updateData.vitalzeichen = body.vitalzeichen;
    if (body.schmerzScore !== undefined) updateData.schmerz_score = body.schmerzScore;
    if (body.zustandPatient !== undefined) updateData.zustand_patient = body.zustandPatient;
    if (body.abbruchGrund !== undefined) updateData.abbruch_grund = body.abbruchGrund;
    if (body.naechsterTermin !== undefined) updateData.naechster_termin = body.naechsterTermin;

    const { data, error } = await supabase
      .from('pflege_massnahmen')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: mapDatabaseToInterface(data)
    });

  } catch (error) {
    console.error('Fehler beim Aktualisieren der Maßnahme:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' }, 
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/pflege/massnahmen/:id
// Maßnahme löschen (nur mit Berechtigung)
// ============================================

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const { id } = await params;
    
    // Nur Leitung darf löschen
    if (user.rolle !== 'leitung') {
      return NextResponse.json(
        { error: 'Nur Pflegedienstleitung darf Maßnahmen löschen' }, 
        { status: 403 }
      );
    }

    const supabase = createClient();
    
    const { error } = await supabase
      .from('pflege_massnahmen')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Maßnahme gelöscht'
    });

  } catch (error) {
    console.error('Fehler beim Löschen der Maßnahme:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' }, 
      { status: 500 }
    );
  }
}
