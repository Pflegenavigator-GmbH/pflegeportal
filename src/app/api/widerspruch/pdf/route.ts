// src/app/api/widerspruch/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface WiderspruchData {
  caseCode: string;
  antragsteller: {
    name: string;
    vorname: string;
    strasse: string;
    plz: string;
    ort: string;
    telefon?: string;
    email?: string;
  };
  pflegekasse: {
    name: string;
    strasse?: string;
    plz?: string;
    ort?: string;
  };
  versicherter?: {
    name?: string;
    vorname?: string;
    versicherungsnummer?: string;
    geburtsdatum?: string;
  };
  bescheidDaten: {
    datum: string;
    pflegegradAktuell: number | null;
    pflegegradBeantragt: number;
    begruendung?: string;
  };
  widerspruchsBegruendung: string;
  beilagen?: string[];
  datum?: string;
  ort?: string;
}

const WIDERSPRUCH_TEMPLATE = (data: WiderspruchData) => `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Widerspruch - Pflegegradbescheid</title>
  <style>
    @page { margin: 25mm 20mm 30mm 20mm; }
    body { 
      font-family: 'DejaVu Sans', Arial, sans-serif; 
      font-size: 11pt; 
      line-height: 1.6;
      color: #000;
    }
    .header { margin-bottom: 20pt; }
    .absender { font-size: 9pt; color: #666; margin-bottom: 20pt; }
    .empfaenger { margin-bottom: 30pt; }
    .datum-ort { text-align: right; margin-bottom: 20pt; }
    .betreff { font-weight: bold; margin-bottom: 15pt; }
    .anrede { margin-bottom: 10pt; }
    .text-block { margin-bottom: 12pt; text-align: justify; }
    .begruendung-box { 
      border: 1px solid #333; 
      padding: 12pt; 
      margin: 15pt 0;
      background-color: #f9f9f9;
    }
    .begruendung-label { font-weight: bold; margin-bottom: 8pt; }
    .beilagen { margin-top: 20pt; }
    .beilagen-list { margin-left: 20pt; }
    .schluss { margin-top: 30pt; }
    .unterschrift { margin-top: 40pt; }
    .hinweis { 
      font-size: 9pt; 
      border-top: 1px solid #ccc; 
      margin-top: 30pt; 
      padding-top: 10pt;
      color: #444;
    }
    .case-code { 
      font-size: 8pt; 
      color: #999; 
      text-align: right;
      margin-top: 5pt;
    }
  </style>
</head>
<body>
  <div class="case-code">Referenz: ${data.caseCode}</div>
  
  <div class="absender">
    ${data.antragsteller.name}, ${data.antragsteller.vorname}<br>
    ${data.antragsteller.strasse}<br>
    ${data.antragsteller.plz} ${data.antragsteller.ort}
    ${data.antragsteller.telefon ? `<br>Tel: ${data.antragsteller.telefon}` : ''}
    ${data.antragsteller.email ? `<br>E-Mail: ${data.antragsteller.email}` : ''}
  </div>

  <div class="empfaenger">
    ${data.pflegekasse.name}<br>
    ${data.pflegekasse.strasse ? `${data.pflegekasse.strasse}<br>` : ''}
    ${data.pflegekasse.plz && data.pflegekasse.ort ? `${data.pflegekasse.plz} ${data.pflegekasse.ort}<br>` : ''}
  </div>

  <div class="datum-ort">
    ${data.ort || data.antragsteller.ort}, den ${data.datum || new Date().toLocaleDateString('de-DE')}
  </div>

  <div class="betreff">
    Widerspruch gegen den Bescheid vom ${data.bescheidDaten.datum}<br>
    ${data.versicherter?.versicherungsnummer ? `Versicherten-Nr.: ${data.versicherter.versicherungsnummer}` : ''}
  </div>

  <div class="anrede">
    Sehr geehrte Damen und Herren,
  </div>

  <div class="text-block">
    hiermit lege ich Widerspruch gegen den Bescheid vom <strong>${data.bescheidDaten.datum}</strong> ein,
    ${data.versicherter?.name ? `betreffend ${data.versicherter.vorname} ${data.versicherter.name}` : 'betreffend meinen Pflegegrad'}.
  </div>

  <div class="text-block">
    ${
      data.bescheidDaten.pflegegradAktuell !== null
        ? `Mein aktueller Pflegegrad ${data.bescheidDaten.pflegegradAktuell} wurde nicht angehoben, obwohl ich beantragt habe, in Pflegegrad ${data.bescheidDaten.pflegegradBeantragt} eingestuft zu werden.`
        : `Ich wurde nicht in den beantragten Pflegegrad ${data.bescheidDaten.pflegegradBeantragt} eingestuft.`
    }
    Diese Entscheidung halte ich für nicht nachvollziehbar.
  </div>

  <div class="begruendung-box">
    <div class="begruendung-label">Begründung des Widerspruchs:</div>
    <div>${data.widerspruchsBegruendung.replace(/\n/g, '<br>')}</div>
  </div>

  ${
    data.bescheidDaten.begruendung
      ? `
  <div class="text-block">
    <strong>Zur Begründung des Bescheids:</strong><br>
    ${data.bescheidDaten.begruendung}
  </div>
  `
      : ''
  }

  <div class="text-block">
    Ich bitte um erneute Prüfung und eine schriftliche Mitteilung über das Ergebnis des Widerspruchsverfahrens.
    Sollten Sie meinem Widerspruch nicht abhelfen, bitte ich um Weiterleitung an die zuständige Widerspruchsstelle.
  </div>

  ${
    data.beilagen && data.beilagen.length > 0
      ? `
  <div class="beilagen">
    <strong>Anlagen:</strong>
    <ul class="beilagen-list">
      ${data.beilagen.map((beilage) => `<li>${beilage}</li>`).join('')}
    </ul>
  </div>
  `
      : ''
  }

  <div class="schluss">
    Mit freundlichen Grüßen
  </div>

  <div class="unterschrift">
    _________________________________<br>
    ${data.antragsteller.vorname} ${data.antragsteller.name}
  </div>

  <div class="hinweis">
    <strong>Hinweis:</strong> Der Widerspruch muss innerhalb eines Monats nach Zustellung des Bescheids 
    schriftlich oder zur Niederschrift bei der Pflegekasse eingelegt werden (§ 44 SGB X). 
    Die Einlegung des Widerspruchs hat keine aufschiebende Wirkung. Die Pflegekasse wird über 
    den Widerspruch entscheiden oder diesen mit Zustimmung des Versicherten der zuständigen 
    Widerspruchsstelle vorlegen (§ 88 SGB X).
  </div>
</body>
</html>
`;

export async function POST(request: NextRequest): Promise<Response> {
  let browser;

  try {
    const body: WiderspruchData = await request.json();
    const { caseCode, antragsteller, pflegekasse, bescheidDaten, widerspruchsBegruendung } = body;

    // Validierung der Pflichtfelder
    if (!caseCode || !antragsteller || !pflegekasse || !bescheidDaten || !widerspruchsBegruendung) {
      return NextResponse.json(
        {
          error: 'Fehlende Pflichtfelder',
          required: [
            'caseCode',
            'antragsteller',
            'pflegekasse',
            'bescheidDaten',
            'widerspruchsBegruendung',
          ],
        },
        { status: 400, headers: getCorsHeaders() }
      );
    }

    if (!antragsteller.name || !antragsteller.strasse || !antragsteller.plz || !antragsteller.ort) {
      return NextResponse.json(
        { error: 'Antragsteller-Adresse unvollständig' },
        { status: 400, headers: getCorsHeaders() }
      );
    }

    // PDF generieren
    const html = WIDERSPRUCH_TEMPLATE(body);

    browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '25mm', right: '20mm', bottom: '30mm', left: '20mm' },
    });

    await browser.close();

    return new Response(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        ...getCorsHeaders(),
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Widerspruch_${sanitizeFilename(antragsteller.name)}_${caseCode}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
        'X-Case-Code': caseCode,
      },
    });
  } catch (error) {
    if (browser) await browser.close();

    console.error('Widerspruch PDF error:', error);
    return NextResponse.json(
      {
        error: 'PDF Generierung fehlgeschlagen',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler',
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

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9äöüß\-]/gi, '_').substring(0, 30);
}

function getCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}
