// src/app/api/gesetze/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { withEdgeCache } from '@/src/lib/redis/with-edge-cache';

export const runtime = 'edge';

interface GesetzInfo {
  sgb: string;
  name: string;
  fullName: string;
  anzahlParagraphs: number;
  kategorien: string[];
  letzteAenderung: string;
  verfuegbarAb?: string;
}

interface SuchErgebnis {
  gesamt: number;
  treffer: Array<{
    sgb: string;
    paragraph: string;
    titel: string;
    ausschnitt: string;
    relevance: number;
  }>;
  query: string;
  dauerMs: number;
}

const VERFUEGBARE_GESETZE: GesetzInfo[] = [
  {
    sgb: 'XI',
    name: 'SGB XI',
    fullName: 'Soziales Pflegeversicherungsgesetz',
    anzahlParagraphs: 92,
    kategorien: ['Pflegegeld', 'Pflegesachleistungen', 'Pflegegrad', 'Widerspruch', 'Anträge'],
    letzteAenderung: '01.01.2024',
    verfuegbarAb: '1995-01-01',
  },
  {
    sgb: 'V',
    name: 'SGB V',
    fullName: 'Gesetzliche Krankenversicherung',
    anzahlParagraphs: 365,
    kategorien: ['Krankenversicherung', 'Leistungen', 'Zuzahlungen', 'Prävention'],
    letzteAenderung: '01.01.2024',
  },
  {
    sgb: 'IX',
    name: 'SGB IX',
    fullName: 'Rehabilitation und Teilhabe behinderter Menschen',
    anzahlParagraphs: 232,
    kategorien: ['Rehabilitation', 'Teilhabe', 'Schwerbehinderung', 'Leistungen'],
    letzteAenderung: '01.01.2024',
  },
];

// Volltext-Index für die Suche (vereinfachte Demo-Daten)
const SUCH_INDEX = [
  {
    sgb: 'XI',
    paragraph: '1',
    titel: 'Leistungen zur Pflege',
    keywords: ['pflegebedürftig', 'pflegegeld', 'leistungen', 'pflege'],
  },
  {
    sgb: 'XI',
    paragraph: '14',
    titel: 'Pflegegrade',
    keywords: ['pflegegrad', 'md', 'medizinischer dienst', 'einstufung', 'begutachtung'],
  },
  {
    sgb: 'XI',
    paragraph: '15',
    titel: 'Pflegegeld',
    keywords: ['pflegegeld', 'geldleistung', 'monatlich', 'höhe', 'betrag'],
  },
  {
    sgb: 'XI',
    paragraph: '18',
    titel: 'Pflegesachleistungen',
    keywords: ['sachleistungen', 'pflegedienst', 'ambulant', 'stunden'],
  },
  {
    sgb: 'XI',
    paragraph: '19',
    titel: 'Kombinationsleistungen',
    keywords: ['kombi', 'kombinationsleistungen', 'geld', 'sachleistungen'],
  },
  {
    sgb: 'XI',
    paragraph: '45',
    titel: 'Widerspruch',
    keywords: ['widerspruch', 'beschwerde', 'einspruch', 'md', 'widerspruchsverfahren'],
  },
  {
    sgb: 'V',
    paragraph: '1',
    titel: 'Mitglieder',
    keywords: ['mitglied', 'versicherung', 'mitgliedschaft', 'kasse'],
  },
  {
    sgb: 'IX',
    paragraph: '1',
    titel: 'Ziel der Rehabilitation',
    keywords: ['reha', 'rehabilitation', 'teilhabe', 'behinderung'],
  },
  {
    sgb: 'IX',
    paragraph: '2',
    titel: 'Leistungsträger',
    keywords: ['reha', 'träger', 'leistungsträger', 'rentenversicherung'],
  },
];

/**
 * GET: Liste aller verfügbaren Gesetze
 */
async function handleGet(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const detail = searchParams.get('detail');
    const sgb = searchParams.get('sgb');

    // Filter nach spezifischem SGB
    if (sgb) {
      const gefundenesGesetz = VERFUEGBARE_GESETZE.find((g) => g.sgb === sgb.toUpperCase());
      if (!gefundenesGesetz) {
        return NextResponse.json(
          { error: 'Gesetz nicht gefunden', verfuegbar: VERFUEGBARE_GESETZE.map((g) => g.sgb) },
          { status: 404, headers: getCorsHeaders() }
        );
      }
      return NextResponse.json(gefundenesGesetz, { status: 200, headers: getCorsHeaders() });
    }

    // Standard: Liste aller Gesetze
    const response =
      detail === 'full'
        ? {
            gesetze: VERFUEGBARE_GESETZE,
            meta: { total: VERFUEGBARE_GESETZE.length, apiVersion: '1.0' },
          }
        : VERFUEGBARE_GESETZE;

    return NextResponse.json(response, { status: 200, headers: getCorsHeaders() });
  } catch (error) {
    // runtime = 'edge': console ist hier die passende (Node-freie) Log-Senke
    console.error('Gesetze LIST error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500, headers: getCorsHeaders() }
    );
  }
}

// Öffentlicher, für alle identischer Gesetzestext → über den Edge-Cache
// ausgeliefert. Der Wrapper schreibt bei einem Miss in Redis und setzt
// X-Cache: MISS; den HIT bedient die Middleware.
export const GET = withEdgeCache(handleGet);

/**
 * POST: Suche in Gesetzen
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { query, sgbFilter, limit = 10 } = body;

    if (!query || typeof query !== 'string' || query.length < 2) {
      return NextResponse.json(
        { error: 'Suchbegriff muss mindestens 2 Zeichen haben' },
        { status: 400, headers: getCorsHeaders() }
      );
    }

    const searchTerm = query.toLowerCase();

    // Suche durchführen
    const treffer = SUCH_INDEX.filter((eintrag) => {
      // SGB Filter
      if (sgbFilter && !sgbFilter.includes(eintrag.sgb)) {
        return false;
      }
      // Volltext-Suche
      const matchInTitel = eintrag.titel.toLowerCase().includes(searchTerm);
      const matchInKeywords = eintrag.keywords.some((k) => k.includes(searchTerm));
      return matchInTitel || matchInKeywords;
    })
      .map((eintrag) => {
        // Relevance scoring
        let relevance = 0;
        if (eintrag.titel.toLowerCase().includes(searchTerm)) relevance += 10;
        if (eintrag.keywords.some((k) => k === searchTerm)) relevance += 5;
        if (eintrag.keywords.some((k) => k.includes(searchTerm))) relevance += 3;

        return {
          sgb: eintrag.sgb,
          paragraph: eintrag.paragraph,
          titel: eintrag.titel,
          ausschnitt: generateAusschnitt(eintrag, searchTerm),
          relevance,
        };
      })
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);

    const ergebnis: SuchErgebnis = {
      gesamt: treffer.length,
      treffer,
      query: searchTerm,
      dauerMs: Date.now() - startTime,
    };

    return NextResponse.json(ergebnis, { status: 200, headers: getCorsHeaders() });
  } catch (error) {
    console.error('Gesetze SEARCH error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
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

function generateAusschnitt(eintrag: (typeof SUCH_INDEX)[0], searchTerm: string): string {
  const matchingKeyword = eintrag.keywords.find((k) => k.includes(searchTerm));
  return matchingKeyword ? `${eintrag.titel} - ${matchingKeyword}` : eintrag.titel;
}

function getCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };
}
