// src/app/api/briefe/pdf/route.ts
import { NextRequest } from 'next/server';

import { handleApiError } from '@/src/lib/api/error-handler';
import { RateLimitError, ValidationError } from '@/src/lib/api/errors';
import { checkRateLimit, getClientIp } from '@/src/lib/api/rate-limit';
import { BriefGeneratorFactory } from '@/src/lib/briefe/generator-factory';
import { renderHtmlToPdf } from '@/src/lib/pdf/service';
import { BriefPayloadSchema } from '@/src/types/briefe-schema';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Rechen-intensiver Endpunkt (Puppeteer) — pro IP drosseln
const PDF_LIMIT = 20;
const PDF_WINDOW_MS = 60 * 60 * 1000;

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
  try {
    const ip = getClientIp(request);
    if (!checkRateLimit(`briefe-pdf:${ip}`, PDF_LIMIT, PDF_WINDOW_MS)) {
      throw new RateLimitError(`PDF-Generierung gedrosselt für IP ${ip}`);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ValidationError('Request-Body ist kein gültiges JSON.');
    }

    const parsed = BriefPayloadSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError('Brief-Daten sind unvollständig oder ungültig.');
    }
    const data = parsed.data;

    const generator = BriefGeneratorFactory.getGenerator(data.type);
    const rawText = generator.generateBrief(data);
    // Der generierte Text wird als reiner Text (pre-wrap) gerendert — HTML-
    // Sonderzeichen escapen, damit keine Markup-Injektion möglich ist
    const sanitizedText = rawText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const title = `Schreiben_${data.type}`;
    const fullHtml = getUniversalHtml(sanitizedText, title);

    // Zentraler, gehärteter Renderer (JS aus, Request-Blocking, always-close).
    // Formeller Brief: kein Footer mit Seitenzahlen, DIN-5008-Ränder.
    const pdfBuffer = await renderHtmlToPdf(fullHtml, {
      showFooter: false,
      margin: { top: '25mm', right: '20mm', bottom: '30mm', left: '25mm' },
    });

    return new Response(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${title}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    return handleApiError(error, 'api.briefe.pdf');
  }
}
