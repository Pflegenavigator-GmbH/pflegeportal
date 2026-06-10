import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// 1. Interfaces bleiben für deine App identisch (wichtig für die Abwärtskompatibilität!)
interface AvatarChatRequest {
  message: string;
  pflegegrad?: number | null;
  module?: string[];
  sessionId?: string;
  context?: {
    previousMessages?: Array<{ role: 'user' | 'assistant'; content: string }>;
    userProfile?: {
      age?: number;
      careSituation?: string;
      federalState?: string;
    };
  };
}

interface AvatarChatResponse {
  text: string;
  action?: {
    type: 'show_module' | 'open_calculator' | 'start_assessment' | 'generate_pdf' | 'navigate';
    payload?: Record<string, unknown>;
  };
  suggestions?: string[];
  sources?: Array<{
    title: string;
    url?: string;
    sgb?: string;
    paragraph?: string;
  }>;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: AvatarChatRequest = await request.json();
    const { message, pflegegrad, module: userModules, context } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400, headers: getCorsHeaders() }
      );
    }

    // ==========================================
    // 2. OPENCLAW API-CALL (Ersetzt die Mocks)
    // ==========================================
    const OPENCLAW_URL = process.env.OPENCLAW_URL;
    const OPENCLAW_TOKEN = process.env.OPENCLAW_TOKEN;

    if (!OPENCLAW_URL || !OPENCLAW_TOKEN) {
      console.error('OpenClaw Umgebungsvariablen sind nicht definiert!');
      return NextResponse.json(
        { error: 'Configuration error' },
        { status: 500, headers: getCorsHeaders() }
      );
    }

    // Verbindung zu OpenClaw herstellen
    const openClawResponse = await fetch(OPENCLAW_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hook-Token': OPENCLAW_TOKEN, // Manchmal erwartet OpenClaw das Token im 'X-Hook-Token' Header anstelle von Bearer. Falls 'Authorization' nicht klappt, nimm diesen.
      },
      body: JSON.stringify({
        event: 'agent_run',
        prompt: message,
        // Optionale Zusatzdaten für den PflegeNavigator
        context: {
          pflegegrad: pflegegrad,
          aktiveModule: userModules,
          userProfile: context?.userProfile,
        },
      }),
    });

    if (!openClawResponse.ok) {
      throw new Error(`OpenClaw antwortet mit Fehler-Status: ${openClawResponse.status}`);
    }

    if (!openClawResponse.ok) {
      throw new Error(`OpenClaw antwortet mit Fehler-Status: ${openClawResponse.status}`);
    }

    const openClawData = await openClawResponse.json();

    // Antwort für deine App strukturieren
    const response: AvatarChatResponse = {
      // Wichtig: Falls OpenClaw das Ergebnis in einem anderen Feld als '.output' liefert (z.B. '.text'), hier anpassen
      text: openClawData.output || 'Ich konnte leider keine Antwort generieren.',
      suggestions: generateSuggestions(pflegegrad),
      sources: openClawData.sources || [],
    };

    // Optional: Dynamische Aktionen triggern, falls OpenClaw bestimmte Key-Words liefert
    if (openClawData.output.toLowerCase().includes('rechner')) {
      response.action = { type: 'open_calculator', payload: { calculator: 'pflegegrad' } };
    }

    return NextResponse.json(response, {
      status: 200,
      headers: getCorsHeaders(),
    });
  } catch (error) {
    console.error('Avatar chat error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        text: 'Entschuldigung, es ist ein Fehler bei der Verarbeitung der KI-Anfrage aufgetreten.',
      },
      { status: 500, headers: getCorsHeaders() }
    );
  }
}

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(),
  });
}

function generateSuggestions(pflegegrad?: number | null): string[] {
  const suggestions: string[] = [];
  if (!pflegegrad) suggestions.push('Pflegegrad ermitteln');
  suggestions.push('Leistungen anzeigen', 'Antrag ausfüllen');
  return suggestions.slice(0, 3);
}

function getCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };
}
