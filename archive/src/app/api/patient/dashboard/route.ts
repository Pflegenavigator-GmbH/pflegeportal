// src/app/api/patient/dashboard/route.ts
/**
 * Patienten-API
 * Für Pflegebedürftige: Dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PatientenDashboard, PflegeMassnahme } from '@/types/pflege-massnahmen';

// ============================================
// HILFSFUNKTIONEN
// ============================================

function getAuthenticatedPatient(req: NextRequest): { patientId: string; email: string } | null {
  // In Produktion: JWT-Token validieren
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
    interneNotizen: undefined, // Patient sieht keine internen Notizen
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
// GET /api/patient/dashboard
// Patienten-Dashboard abrufen
// ============================================

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const patient = getAuthenticatedPatient(req);
    if (!patient) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const supabase = createClient();
    
    // Patienten-Profil laden
    const { data: patientProfil, error: profilError } = await supabase
      .from('patienten')
      .select('name, pflegegrad, adresse')
      .eq('id', patient.patientId)
      .single();
    
    if (profilError) throw profilError;

    // Heutige Maßnahmen (freigegeben)
    const heute = new Date().toISOString().split('T')[0];
    const { data: heutigeMassnahmen, error: massnahmenError } = await supabase
      .from('pflege_massnahmen')
      .select(`
        *,
        pflegekraft:pflegekraft_id (name),
        pflegedienst:pflegedienst_id (name)
      `)
      .eq('patient_id', patient.patientId)
      .eq('freigegeben_fuer_patient', true)
      .gte('durchgefuehrt_am', `${heute}T00:00:00`)
      .lte('durchgefuehrt_am', `${heute}T23:59:59`)
      .order('durchgefuehrt_am', { ascending: false });
    
    if (massnahmenError) throw massnahmenError;

    // Statistik: Durchgeführt vs. Geplant
    const { data: statistikHeute } = await supabase
      .rpc('get_massnahmen_statistik', {
        p_patient_id: patient.patientId,
        p_datum: heute
      });

    // Ungelesene Einträge
    const { count: ungelesen } = await supabase
      .from('pflege_massnahmen')
      .select('*', { count: 'exact' })
      .eq('patient_id', patient.patientId)
      .eq('freigegeben_fuer_patient', true)
      .is('gelesen_am', null);

    // Nächste Termine (geplant)
    const { data: naechsteTermine } = await supabase
      .from('pflege_termine')
      .select(`
        *,
        pflegekraft:pflegekraft_id (name)
      `)
      .eq('patient_id', patient.patientId)
      .gte('datum', heute)
      .order('datum', { ascending: true })
      .limit(5);

    // Wochenstatistik (letzte 7 Tage)
    const { data: wochenStatistik } = await supabase
      .rpc('get_wochen_statistik', {
        p_patient_id: patient.patientId
      });

    const dashboard: PatientenDashboard = {
      patientId: patient.patientId,
      patientName: patientProfil?.name || 'Unbekannt',
      pflegegrad: patientProfil?.pflegegrad,
      
      heuteErledigt: statistikHeute?.durchgefuehrt || 0,
      heuteGeplant: statistikHeute?.geplant || 0,
      heuteVerspaetet: statistikHeute?.verspaetet || 0,
      
      aktuelleMassnahmen: heutigeMassnahmen?.map(mapToInterface) || [],
      letzteAktualisierung: new Date().toISOString(),
      
      naechsteTermine: naechsteTermine?.map((t: any) => ({
        id: t.id,
        datum: t.datum,
        uhrzeitVon: t.uhrzeit_von,
        uhrzeitBis: t.uhrzeit_bis,
        titel: t.titel,
        beschreibung: t.beschreibung,
        kategorie: t.kategorie,
        pflegekraftName: t.pflegekraft?.name,
        bestaetigt: t.bestaetigt
      })) || [],
      
      statistik7Tage: wochenStatistik || {
        montag: { anzahlMassnahmen: 0, durchgefuehrt: 0, verspaetet: 0, abgebrochen: 0 },
        dienstag: { anzahlMassnahmen: 0, durchgefuehrt: 0, verspaetet: 0, abgebrochen: 0 },
        mittwoch: { anzahlMassnahmen: 0, durchgefuehrt: 0, verspaetet: 0, abgebrochen: 0 },
        donnerstag: { anzahlMassnahmen: 0, durchgefuehrt: 0, verspaetet: 0, abgebrochen: 0 },
        freitag: { anzahlMassnahmen: 0, durchgefuehrt: 0, verspaetet: 0, abgebrochen: 0 },
        samstag: { anzahlMassnahmen: 0, durchgefuehrt: 0, verspaetet: 0, abgebrochen: 0 },
        sonntag: { anzahlMassnahmen: 0, durchgefuehrt: 0, verspaetet: 0, abgebrochen: 0 }
      },
      
      ungeleseneEintraege: ungelesen || 0,
      neueDokumente: 0, // TODO implementieren
      wartendesFeedback: 0 // TODO implementieren
    };

    return NextResponse.json({
      success: true,
      data: dashboard
    });

  } catch (error) {
    console.error('Fehler beim Laden des Dashboards:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' }, 
      { status: 500 }
    );
  }
}
