// src/app/api/widerspruch/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {calculatePflegegrad} from "@/src/lib/pflegegrad/rechner";
import {ModuleScores} from "@/src/types/pflegegrad";
import {calculateWiderspruchChance} from "@/src/lib/pflegegrad-berechnung";

/**
 * POST /api/widerspruch
 * Erstellt Widerspruch mit Begründung und Berechnung
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      caseCode,
      currentLevel,
      expectedLevel,
      moduleScores,
      reasons,
      insuranceNumber,
      insuranceName,
    } = body;

    // Validierung
    if (!caseCode || !currentLevel || !expectedLevel || !moduleScores) {
      return NextResponse.json(
        { error: 'Fehlende Pflichtfelder' },
        { status: 400 }
      );
    }

    // Pflegegrad berechnen für Validierung
    const calculation = calculatePflegegrad(moduleScores as ModuleScores);
    
    // Widerspruch-Chance berechnen
    const widerspruchChance = calculateWiderspruchChance(
      currentLevel,
      expectedLevel,
      moduleScores as ModuleScores
    );

    // Begründung generieren
    const begruendung = generateWiderspruchBegruendung(
      currentLevel,
      expectedLevel,
      moduleScores as ModuleScores,
      reasons
    );

    // Brief-Text erstellen
    const briefText = generateWiderspruchBrief(
      caseCode,
      currentLevel,
      expectedLevel,
      begruendung,
      insuranceNumber,
      insuranceName
    );

    // Checkliste
    const checklist = [
      '☐ Widerspruch innerhalb 4 Wochen nach Bescheid-Zugang',
      '☐ Kopie des Widerspruchsbescheids an die Pflegekasse',
      '☐ Eigene Kopie für Unterlagen aufbewahren',
      '☐ Arztberichte beilegen (falls vorhanden)',
      '☐ Pflegeprotokoll/Tagebuch beilegen (DiPA)',
      '☐ Zeugen/Aufzeichnungen der Pflege notieren',
      '☐ Per Einschreiben mit Rückschein versenden',
      '☐ Frist dokumentieren (Datum Zugang des Bescheids)',
    ];

    // Nächste Schritte
    const nextSteps = [
      '1. Brief ausdrucken und unterschreiben',
      '2. Kopie des Bescheids beilegen',
      '3. Per Einschreiben an die Pflegekasse senden',
      '4. Fristen-Countdown starten (4 Wochen)',
      '5. Auf Antwort warten (4-6 Wochen)',
      '6. Wiederholungsbegutachtung vorbereiten',
    ];

    return NextResponse.json({
      success: true,
      caseCode,
      briefText,
      begruendung,
      checklist,
      nextSteps,
      calculation,
      widerspruchChance,
      fristInfo: 'WICHTIG: Widerspruch muss innerhalb von 4 Wochen nach Zugang des Bescheids eingelegt werden!',
      legalBase: '§ 124 SGB XI',
    });
  } catch (error) {
    console.error('Widerspruch-Fehler:', error);
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
}

/**
 * Generiert Widerspruchs-Begründung
 */
function generateWiderspruchBegruendung(
  currentLevel: number,
  expectedLevel: number,
  scores: ModuleScores,
  userReasons?: string
): string {
  const parts: string[] = [];

  // Einleitung
  parts.push(`Nach den NBA-Kriterien (Neues Begutachtungs-Assessment) ergibt sich aus meinen Einschränkungen ein höherer Pflegebedarf als im Pflegegrad ${currentLevel} berücksichtigt.`);
  parts.push('');

  // Modul-Beschreibungen
  if (scores[4] > 40) {
    parts.push('Selbstversorgung (40% Gewichtung):');
    parts.push('- Deutliche Einschränkungen bei Körperpflege, An-/Auskleiden, Essen/Trinken');
    parts.push('- Tägliche Unterstützung erforderlich');
    parts.push('');
  }

  if (scores[2] > 15 || scores[3] > 15) {
    parts.push('Kognition/Verhalten (15% Gewichtung):');
    if (scores[2] > scores[3]) {
      parts.push('- Einschränkungen bei Erinnerung, Orientierung, Entscheidungsfähigkeit');
    } else {
      parts.push('- Probleme bei Schlaf, Erschöpfung, Verhalten');
    }
    parts.push('');
  }

  if (scores[5] > 20) {
    parts.push('Krankheitsbewältigung (20% Gewichtung):');
    parts.push('- Komplexe medizinische Maßnahmen erforderlich');
    parts.push('- Medikamentenmanagement, Wundversorgung');
    parts.push('');
  }

  if (scores[1] > 10) {
    parts.push('Mobilität (10% Gewichtung):');
    parts.push('- Einschränkungen bei Aufstehen, Gehen, Treppensteigen');
    parts.push('');
  }

  // Zusammenfassung
  parts.push(`Die Summe meiner Beeinträchtigungen in den verschiedenen Lebensbereichen entspricht dem Pflegegrad ${expectedLevel}.`);
  parts.push(`Die aktuelle Einstufung in Pflegegrad ${currentLevel} berücksichtigt meinen tatsächlichen Hilfebedarf nicht ausreichend.`);
  parts.push('');

  // Benutzer-Gründe
  if (userReasons) {
    parts.push('Zusätzliche Begründung:');
    parts.push(userReasons);
    parts.push('');
  }

  // Rechtliche Basis
  parts.push('Rechtliche Grundlage:');
  parts.push('Gemäß § 124 SGB XI habe ich Anspruch auf eine Wiederholungsbegutachtung, wenn die Einstufung nicht meinem tatsächlichen Pflegebedarf entspricht.');

  return parts.join('\n');
}

/**
 * Generiert Widerspruchs-Brief
 */
function generateWiderspruchBrief(
  caseCode: string,
  currentLevel: number,
  expectedLevel: number,
  begruendung: string,
  insuranceNumber?: string,
  insuranceName?: string
): string {
  return `WIDERSPRUCH GEGEN DEN BESCHEID DER PFLEGEKASSE

Fallcode: ${caseCode}
Datum: ${new Date().toLocaleDateString('de-DE')}

${insuranceName || '[Name der Pflegekasse]'}
${'[Anschrift der Pflegekasse]'}

Betreff: Widerspruch gegen Pflegegrad-Einstufung

Sehr geehrte Damen und Herren,

hiermit lege ich fristgerecht Widerspruch gegen Ihren Bescheid vom [DATUM EINTRAGEN] ein.

Meine Versicherungsnummer: ${insuranceNumber || '[BITTE EINTRAGEN]'}
Mein aktueller Pflegegrad: ${currentLevel}
Beantragter Pflegegrad: ${expectedLevel}

BEGRÜNDUNG:

${begruendung}

Ich bitte um eine Wiederholungsbegutachtung durch den Medizinischen Dienst der Krankenversicherung (MD) bzw. Medicproof (bei Privatversicherten).

Die Begutachtung soll alle sechs Module des NBA umfassen und meinen tatsächlichen Hilfebedarf im Alltag berücksichtigen.

Mit freundlichen Grüßen

[Unterschrift]
[Vor- und Nachname]

Anlagen:
- Kopie des Widerspruchsbescheids
- Aktuelle ärztliche Berichte (falls vorhanden)
- Pflegeprotokoll/Tagebuch (DiPA)

---
Hinweis: Dieser Widerspruch wurde mit Unterstützung von PflegeNavigator EU erstellt. 
PflegeNavigator bietet keine Rechtsberatung. Die Auswertung dient als Orientierungshilfe.`;
}
