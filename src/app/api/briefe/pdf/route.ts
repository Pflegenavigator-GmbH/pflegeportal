// src/app/api/briefe/pdf/routes.ts
import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';

import {
  allgemeinerBriefGenerator,
  antragPflegegradGenerator,
  schwerbehindertenausweisGenerator,
} from '@/src/lib/briefe';
import { BriefPayload } from '@/src/types/briefe';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Universelles DIN 5008 Styling
const PDF_STYLES = `
  <style>
    @page { margin: 25mm 20mm 30mm 25mm; } /* DIN Brief Normränder */
    body { 
      font-family: 'Helvetica', 'Arial', sans-serif; 
      font-size: 11pt; 
      line-height: 1.5;
      color: #000;
    }
    .din-text-body {
      white-space: pre-wrap; /* WICHTIG: Übersetzt \\n in echte Zeilenumbrüche! */
      text-align: justify;
    }
  </style>
`;

const getUniversalHtml = (briefText: string, title: string) => `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  ${PDF_STYLES}
</head>
<body>
  <div class="din-text-body">${briefText}</div>
</body>
</html>
`;

export async function POST(request: NextRequest): Promise<Response> {
  let browser;

  try {
    const body: BriefPayload = await request.json();

    // 1. Text über die zentrale Library generieren
    let rawText = '';
    switch (body.type) {
      case 'antrag-pflegegrad':
        rawText = antragPflegegradGenerator.generateBrief(body);
        break;
      case 'schwerbehindertenausweis':
        rawText = schwerbehindertenausweisGenerator.generateBrief(body);
        break;
      default:
        rawText = allgemeinerBriefGenerator.generateBrief(body);
        break;
    }

    // Um XSS oder Fehler durch spitze Klammern zu vermeiden
    const sanitizedText = rawText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const title = `Schreiben_${body.type}`;

    // 2. HTML zusammensetzen
    const fullHtml = getUniversalHtml(sanitizedText, title);

    // 3. Puppeteer Engine starten
    browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'load' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '25mm', right: '20mm', bottom: '30mm', left: '25mm' },
    });

    await browser.close();

    // 4. PDF als Stream an den Client senden
    return new Response(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${title}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    if (browser) await browser.close();

    console.error('PDF Engine Fatal Error:', error);
    return NextResponse.json(
      {
        error: 'PDF Generierung serverseitig abgebrochen',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler',
      },
      { status: 500 }
    );
  }
}
