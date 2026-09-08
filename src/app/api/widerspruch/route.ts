// src/app/api/widerspruch/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/src/lib/logger';
import { calculatePflegegrad } from '@/src/lib/pflegegrad/rechner';
import {
  berechneFrist,
  generiereWiderspruchBrief,
  generateWiderspruchBegruendung,
  calculateWiderspruchChance,
} from '@/src/lib/widerspruch/utils';
import { ModuleScores } from '@/src/types/pflegegrad';

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
      bescheidDatum,
    } = body;

    if (
      !caseCode ||
      typeof currentLevel !== 'number' ||
      typeof expectedLevel !== 'number' ||
      !moduleScores
    ) {
      return NextResponse.json({ error: 'Fehlende oder ungültige Pflichtfelder' }, { status: 400 });
    }

    // 1. Berechnung (Single Source of Truth)
    const calculation = calculatePflegegrad(moduleScores as ModuleScores);

    // 2. Fristen berechnen (Fallback auf heute - 14 Tage, falls kein Datum mitgegeben wurde)
    const datumFuerFrist = bescheidDatum
      ? new Date(bescheidDatum)
      : new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const frist = berechneFrist(datumFuerFrist, 'pflegegrad');

    // 3. Begründung & Brief generieren
    const begruendung = generateWiderspruchBegruendung(
      currentLevel,
      expectedLevel,
      moduleScores as ModuleScores,
      reasons
    );

    const briefText = generiereWiderspruchBrief(
      {
        typ: 'pflegegrad',
        caseCode,
        bescheidDatum: datumFuerFrist.toISOString(),
        versicherterName: '[Vor- und Nachname]',
        strasse: '[Straße und Hausnummer]',
        plz: '[PLZ]',
        ort: '[Ort]',
        pflegekasse: insuranceName || '[Name der Pflegekasse]',
        versicherungsnummer: insuranceNumber,
        begruendung: begruendung,
      },
      frist
    );

    const widerspruchChance = calculateWiderspruchChance(
      currentLevel,
      expectedLevel,
      moduleScores as ModuleScores
    );

    return NextResponse.json({
      success: true,
      caseCode,
      briefText,
      begruendung,
      calculation,
      widerspruchChance,
      fristInfo: frist,
      checklist: [
        'Widerspruch innerhalb 4 Wochen nach Bescheid-Zugang einreichen',
        'Kopie des Widerspruchsbescheids an die Pflegekasse',
        'Ärztliche Berichte und aktuelles Pflegeprotokoll beilegen',
        'Versand per Einschreiben mit Rückschein',
      ],
      nextSteps: [
        'Brief ausdrucken, unterschreiben und versenden',
        'Frist dokumentieren',
        'Auf Antwort warten (i.d.R. 4-6 Wochen)',
      ],
    });
  } catch (error) {
    logger.error({ err: error }, 'Widerspruch-Fehler');
    return NextResponse.json({ error: 'Interner Server-Fehler' }, { status: 500 });
  }
}
