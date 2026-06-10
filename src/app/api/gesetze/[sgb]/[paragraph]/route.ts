// src/app/api/gesetz/[sgb]/[paragraph]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface GesetzParagraph {
  sgb: string;
  paragraph: string;
  titel: string;
  inhalt: string;
  absaetze: Array<{
    nummer: number;
    inhalt: string;
    untergliederung?: string[];
  }>;
  verwandte?: Array<{
    sgb: string;
    paragraph: string;
    relation: 'verweist_auf' | 'wird_verwiesen_von' | 'ergaenzt';
  }>;
  stand: string;
  geaendert_am?: string;
}

// SGB XI - Soziale Pflegeversicherung (Auszug)
const SGB_XI_DATEN: Record<string, GesetzParagraph> = {
  '1': {
    sgb: 'XI',
    paragraph: '1',
    titel: 'Leistungen zur Pflege',
    inhalt:
      'Versicherte haben Anspruch auf Pflegegeld, Pflegesachleistungen, Kombinationsleistungen sowie weitere in diesem Buch geregelte Leistungen, wenn sie wegen einer Krankheit oder einer Behinderung für gewöhnliche und regelmäßig wiederkehrende Verrichtungen im Ablauf des täglichen Lebens auf Dauer, voraussichtlich für mindestens sechs Monate, außerstande sind, diese Verrichtungen ganz oder teilweise selbst zu besorgen (Pflegebedürftigkeit).',
    absaetze: [
      {
        nummer: 1,
        inhalt:
          'Versicherte haben Anspruch auf Pflegegeld, Pflegesachleistungen, Kombinationsleistungen sowie weitere in diesem Buch geregelte Leistungen, wenn sie wegen einer Krankheit oder einer Behinderung für gewöhnliche und regelmäßig wiederkehrende Verrichtungen im Ablauf des täglichen Lebens auf Dauer, voraussichtlich für mindestens sechs Monate, außerstande sind, diese Verrichtungen ganz oder teilweise selbst zu besorgen (Pflegebedürftigkeit).',
      },
      {
        nummer: 2,
        inhalt:
          'Verrichtungen im Ablauf des täglichen Lebens sind insbesondere: Körperpflege, Ernährung, Mobilität sowie hauswirtschaftliche Versorgung.',
        untergliederung: [
          'Körperpflege: das Waschen und Duschen, das Zurechtmachen, einschließlich des Duschens der Haare, des Zahnpflegebedarfs, Rasierens, Schneidens der Fingernägel und Zehennägel, des An- und Auskleidens und der Hilfe beim Benutzen der Toilette',
          'Ernährung: das Zubereiten der Mahlzeiten, die Hilfe beim Essen und Trinken',
          'Mobilität: das Hin- und Herbringen in der Wohnung sowie das Treppensteigen, das Verlassen und Wiedereintreten in die Wohnung sowie die Hilfe beim Benutzen von Hilfsmitteln zur Fortbewegung',
          'hauswirtschaftliche Versorgung: die Reinigung der Wohnung, das Besorgen und Vorbereiten der Mahlzeiten, das Waschen der Wäsche, das Besorgen der notwendigen Einkäufe, das Erledigen notwendiger Behördengänge sowie das Begleiten bei notwendigen Besorgungen, bei Aktivitäten außerhalb der Wohnung, bei notwendigen Untersuchungen und Behandlungen und bei der Teilnahme am Erwerbsleben und an sozialen Aktivitäten',
        ],
      },
      {
        nummer: 3,
        inhalt:
          'Die Leistungen werden gewährt, unabhängig davon, von wem die Pflege tatsächlich erbracht wird.',
      },
      {
        nummer: 4,
        inhalt:
          'Die Pflegekassen dürfen für die Leistungen nach diesem Buch keine Zuzahlungen der Pflegebedürftigen oder der Angehörigen verlangen.',
      },
    ],
    verwandte: [
      { sgb: 'XI', paragraph: '14', relation: 'ergaenzt' },
      { sgb: 'XI', paragraph: '15', relation: 'ergaenzt' },
    ],
    stand: '01.01.2024',
  },
  '14': {
    sgb: 'XI',
    paragraph: '14',
    titel: 'Pflegegrade',
    inhalt:
      'Die Pflegebedürftigkeit wird nach dem Ausmaß der Beeinträchtigung der Selbstständigkeit oder der Fähigkeiten in fünf Pflegegrade eingeteilt.',
    absaetze: [
      {
        nummer: 1,
        inhalt:
          'Die Pflegebedürftigkeit wird nach dem Ausmaß der Beeinträchtigung der Selbstständigkeit oder der Fähigkeiten in fünf Pflegegrade eingeteilt.',
      },
      {
        nummer: 2,
        inhalt:
          'Die Einstufung erfolgt durch den Medizinischen Dienst der Krankenversicherung auf Antrag.',
      },
      {
        nummer: 3,
        inhalt:
          'Die Pflegegrade sind:\n- Pflegegrad 1: geringe Beeinträchtigung der Selbstständigkeit oder der Fähigkeiten\n- Pflegegrad 2: erhebliche Beeinträchtigung\n- Pflegegrad 3: schwere Beeinträchtigung\n- Pflegegrad 4: schwerste Beeinträchtigung\n- Pflegegrad 5: schwerste Beeinträchtigung mit besonderen Anforderungen an die pflegerische Versorgung',
      },
    ],
    verwandte: [{ sgb: 'XI', paragraph: '15', relation: 'verweist_auf' }],
    stand: '01.01.2024',
  },
  '15': {
    sgb: 'XI',
    paragraph: '15',
    titel: 'Pflegegeld',
    inhalt: 'Pflegebedürftige erhalten Pflegegeld für die von ihnen selbst organisierte Pflege.',
    absaetze: [
      {
        nummer: 1,
        inhalt:
          'Pflegebedürftige erhalten Pflegegeld für die von ihnen selbst organisierte Pflege.',
      },
      {
        nummer: 2,
        inhalt:
          'Die Höhe des Pflegegeldes richtet sich nach dem Pflegegrad und beträgt monatlich:\n- Pflegegrad 1: 0 Euro\n- Pflegegrad 2: 332 Euro\n- Pflegegrad 3: 573 Euro\n- Pflegegrad 4: 765 Euro\n- Pflegegrad 5: 947 Euro',
      },
      {
        nummer: 3,
        inhalt:
          'Das Pflegegeld ist für die im Haushalt des Pflegebedürftigen erbrachte Pflege und für sonstige pflegerische Aufwendungen zu verwenden.',
      },
    ],
    stand: '01.01.2024',
  },
};

// SGB V - Gesetzliche Krankenversicherung (Auszug)
const SGB_V_DATEN: Record<string, GesetzParagraph> = {
  '1': {
    sgb: 'V',
    paragraph: '1',
    titel: 'Mitglieder',
    inhalt: 'Mitglieder der Krankenkassen sind die in § 5 bezeichneten Personen.',
    absaetze: [
      {
        nummer: 1,
        inhalt: 'Mitglieder der Krankenkassen sind die in § 5 bezeichneten Personen.',
      },
      {
        nummer: 2,
        inhalt:
          'Die Mitgliedschaft beginnt mit der Entstehung der Versicherungspflicht oder des Versicherungsschutzes.',
      },
    ],
    stand: '01.01.2024',
  },
};

// SGB IX - Rehabilitation und Teilhabe (Auszug)
const SGB_IX_DATEN: Record<string, GesetzParagraph> = {
  '1': {
    sgb: 'IX',
    paragraph: '1',
    titel: 'Ziel der Rehabilitation',
    inhalt:
      "Ziel der Rehabilitation ist es, Menschen mit einer Beeinträchtigung ihre Teilhabe am Leben in der Gemeinschaft zu ermöglichen und zu ermöglichen, dass sie's selbst bestimmt gestalten können.",
    absaetze: [
      {
        nummer: 1,
        inhalt:
          "Ziel der Rehabilitation ist es, Menschen mit einer Beeinträchtigung ihre Teilhabe am Leben in der Gemeinschaft zu ermöglichen und zu ermöglichen, dass sie's selbst bestimmt gestalten können.",
      },
      {
        nummer: 2,
        inhalt:
          'Rehabilitation umfasst Maßnahmen zur medizinischen Rehabilitation, zur beruflichen Rehabilitation und zur sozialen Rehabilitation.',
      },
    ],
    stand: '01.01.2024',
  },
};

const GESETZES_DATENBANK: Record<string, Record<string, GesetzParagraph>> = {
  XI: SGB_XI_DATEN,
  V: SGB_V_DATEN,
  IX: SGB_IX_DATEN,
};

type Params = { sgb: string; paragraph: string };

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
): Promise<NextResponse> {
  try {
    const { sgb, paragraph } = await params;

    // Validierung
    if (!sgb || !paragraph) {
      return NextResponse.json(
        { error: 'SGB und Paragraph müssen angegeben werden' },
        { status: 400, headers: getCorsHeaders() }
      );
    }

    // Nur unterstützte SGBs
    const erlaubteSGBs = ['XI', 'V', 'IX'];
    const sgbUpper = sgb.toUpperCase();

    if (!erlaubteSGBs.includes(sgbUpper)) {
      return NextResponse.json(
        {
          error: 'SGB nicht unterstützt',
          unterstuetzt: erlaubteSGBs,
          angefragt: sgb,
        },
        { status: 400, headers: getCorsHeaders() }
      );
    }

    const sgbDaten = GESETZES_DATENBANK[sgbUpper];
    const paragraphData = sgbDaten?.[paragraph];

    if (!paragraphData) {
      return NextResponse.json(
        {
          error: 'Paragraph nicht gefunden',
          sgb: sgbUpper,
          paragraph,
          verfuegbar: Object.keys(sgbDaten || {}),
        },
        { status: 404, headers: getCorsHeaders() }
      );
    }

    return NextResponse.json(paragraphData, {
      status: 200,
      headers: getCorsHeaders(),
    });
  } catch (error) {
    console.error('Gesetz API error:', error);
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

function getCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };
}
