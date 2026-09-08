// src/app/api/pdf/generate/route.ts
import { createHash } from 'crypto';

import { NextRequest, NextResponse } from 'next/server';

import { requireCaseSession } from '@/src/lib/api/case-auth';
import { handleApiError } from '@/src/lib/api/error-handler';
import { ValidationError } from '@/src/lib/api/errors';
import { pdfRamCache } from '@/src/lib/pdf/cache';
import { sanitizeFilename } from '@/src/lib/pdf/puppeteer';
import { renderHtmlToPdf } from '@/src/lib/pdf/service';
import { buildStandardPdfHtml } from '@/src/lib/pdf/templates';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface PDFGenerateRequest {
  caseCode?: string;
  html?: string;
  title?: string;
  footerText?: string;
}

const MAX_HTML_BYTES = 1_000_000; // 1 MB Dokumenten-HTML ist mehr als genug

export async function POST(request: NextRequest): Promise<Response> {
  let upperCode: string | undefined;

  try {
    const body: PDFGenerateRequest = await request.json();
    const { caseCode, html, footerText } = body;

    if (!caseCode || !html) {
      return NextResponse.json({ error: 'Parameter fehlen.' }, { status: 400 });
    }
    if (Buffer.byteLength(html, 'utf-8') > MAX_HTML_BYTES) {
      throw new ValidationError('Dokumenteninhalt überschreitet das Größenlimit.');
    }

    upperCode = caseCode.toUpperCase();

    // ============================================================================
    // 🛡️ AUTORISIERUNG VOR ALLEM ANDEREN — auch vor dem Cache.
    // Session-Cookie ist Pflicht (kein "optionaler" Check mehr) und der
    // Billing-Status kommt direkt aus der Session-Prüfung.
    // ============================================================================
    const session = await requireCaseSession(upperCode);

    if (!session.isUnlocked) {
      return NextResponse.json({ error: 'Zahlung erforderlich.' }, { status: 402 });
    }

    // ============================================================================
    // ⚡ RAM-Cache: Schlüssel ist inhaltsspezifisch (Fallcode + Content-Hash).
    // Verhindert, dass z.B. ein anderes Dokument desselben Falls einen
    // veralteten oder falschen Treffer liefert.
    // ============================================================================
    const contentHash = createHash('sha256')
      .update(html)
      .update(footerText || '')
      .digest('hex')
      .slice(0, 16);
    const cacheKey = `${upperCode}:${contentHash}`;

    const cachedBuffer = pdfRamCache.get(cacheKey);
    if (cachedBuffer) {
      return pdfResponse(cachedBuffer, upperCode, 'HIT');
    }

    const fullHtml = buildStandardPdfHtml({
      caseCode: upperCode,
      productTier: session.productTier || 'beta',
      contentHtml: html,
    });

    // SSRF-Härtung + Browser-Lifecycle liegen zentral im PDF-Service
    const pdfBuffer = await renderHtmlToPdf(fullHtml, { footerText });

    pdfRamCache.set(cacheKey, pdfBuffer);

    return pdfResponse(pdfBuffer, upperCode, 'MISS');
  } catch (error: unknown) {
    return handleApiError(error, 'api.pdf.generate.secure_dossier', upperCode);
  }
}

function pdfResponse(buffer: Uint8Array, caseCode: string, cacheState: 'HIT' | 'MISS'): Response {
  return new Response(Buffer.from(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="PflegeGutachten_${sanitizeFilename(caseCode)}.pdf"`,
      'Content-Length': buffer.length.toString(),
      'X-Cache': cacheState,
    },
  });
}
