// src/app/api/briefe/route.ts
import { NextRequest, NextResponse } from 'next/server';

import {
  allgemeinerBriefGenerator,
  antragPflegegradGenerator,
  schwerbehindertenausweisGenerator,
} from '@/src/lib/briefe';
import { BriefPayload } from '@/src/types/briefe';

export async function POST(request: NextRequest) {
  try {
    const body: BriefPayload = await request.json();
    let briefText = '';

    // Absolut typsicheres, dynamisches Routing der Generatoren
    switch (body.type) {
      case 'antrag-pflegegrad':
        briefText = antragPflegegradGenerator.generateBrief(body);
        break;
      case 'schwerbehindertenausweis':
        briefText = schwerbehindertenausweisGenerator.generateBrief(body);
        break;
      default:
        briefText = allgemeinerBriefGenerator.generateBrief(body);
        break;
    }

    return NextResponse.json({
      success: true,
      brief: briefText,
      meta: { zeichenAnzahl: briefText.length },
    });
  } catch (error) {
    console.error('Zentraler Brief-API-Fehler:', error);
    return NextResponse.json({ error: 'Fehler bei der Schrifttum-Generierung' }, { status: 500 });
  }
}
