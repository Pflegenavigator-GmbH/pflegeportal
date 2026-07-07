// src/app/api/briefe/pdf/routes.ts
import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

import { BriefGeneratorFactory } from '@/src/lib/briefe/generator-factory';
import { BriefPayloadSchema } from '@/src/types/briefe-schema';

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
      white-space: pre-wrap; /* WICHTIG: Übersetzt \n in echte Zeilenumbrüche! */
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
    const body = await request.json();
    const data = BriefPayloadSchema.parse(body);

    const generator = BriefGeneratorFactory.getGenerator(data.type);
    const rawText = generator.generateBrief(data);
    const sanitizedText = rawText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const title = `Schreiben_${data.type}`;
    const fullHtml = getUniversalHtml(sanitizedText, title);

    // ============================================================================
    // 🧠 DYNAMISCHER BROWSER-LAUNCH (Dev vs. Prod)
    // ============================================================================
    const isDev = process.env.NODE_ENV === 'development';

    // Im Dev-Modus nutzen wir die lokale Installation von Puppeteer,
    // in Prod greifen wir auf den Server-Pfad (z.B. /usr/bin/chromium) zurück.
    const launchOptions = isDev
      ? {
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        }
      : {
          headless: true,
          executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        };

    browser = await puppeteer.launch(launchOptions);
    // ============================================================================

    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'load' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '25mm', right: '20mm', bottom: '30mm', left: '25mm' },
    });

    await browser.close();

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
      { error: 'PDF Generierung serverseitig abgebrochen' },
      { status: 500 }
    );
  }
}
