// src/app/api/briefe/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { BriefGeneratorFactory } from '@/src/lib/briefe/generator-factory';
import { logger } from '@/src/lib/logger';
import { BriefPayloadSchema } from '@/src/types/briefe-schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Zod validiert hier zentral. Wenn das fehlschlägt, springt er in den 'catch' Block.
    const data = BriefPayloadSchema.parse(body);

    // 2. Factory wählt automatisch den richtigen Generator
    const generator = BriefGeneratorFactory.getGenerator(data.type);

    // 3. Generierung
    const briefText = generator.generateBrief(data);

    return NextResponse.json({
      success: true,
      brief: briefText,
      meta: { zeichenAnzahl: briefText.length },
    });
  } catch (error) {
    // Wenn Zod einen Fehler wirft, siehst du hier genau, WELCHES Feld falsch ist
    logger.error({ err: error }, 'Brief-Generierungs-Fehler');
    return NextResponse.json(
      { error: 'Validierungsfehler: Bitte prüfen Sie Ihre Eingabedaten.' },
      { status: 400 }
    );
  }
}
