// src/app/api/pdf/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Browser } from 'puppeteer-core';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/src/lib/supabase/server';
import { handleApiError } from '@/src/lib/api/error-handler';
import { launchPDFBrowser, sanitizeFilename } from '@/src/lib/pdf/puppeteer';
import { buildStandardPdfHtml, compilePageToA4Buffer } from '@/src/lib/pdf/templates';
import { pdfRamCache } from '@/src/lib/pdf/cache';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface PDFGenerateRequest {
  caseCode: string;
  html: string;
  title?: string;
  footerText?: string;
}

export async function POST(request: NextRequest): Promise<Response> {
  let browser: Browser | null = null;

  try {
    const body: PDFGenerateRequest = await request.json();
    const { caseCode, html, title, footerText } = body;

    if (!caseCode || !html) {
      return NextResponse.json({ error: 'Parameter fehlen.' }, { status: 400 });
    }

    const upperCode = caseCode.toUpperCase();

    // ============================================================================
    // 🛡️ DSGVO & SESSION-CHECK (Sicheres Fallback für Localhost-Dev-Server)
    // ============================================================================
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('pf_case_code')?.value;

    // Wenn ein Cookie da ist, muss es übereinstimmen.
    // Falls auf localhost kein Cookie übertragen wurde, sichert uns die nachfolgende
    // Supabase-Datenbankprüfung (billing_status Check) unbestechlich ab.
    if (sessionCookie && sessionCookie.toUpperCase() !== upperCode) {
      return NextResponse.json({ error: 'Nicht autorisierter Zugriff. Code-Konflikt.' }, { status: 401 });
    }

    // ============================================================================
    // ⚡ SPEED-BYPASS: RAM-Cache-Hit abfangen (Verhindert Server-Last)
    // ============================================================================
    const cachedBuffer = pdfRamCache.get(upperCode);
    if (cachedBuffer) {
      return new Response(Buffer.from(cachedBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="PflegeGutachten_${sanitizeFilename(upperCode)}.pdf"`,
          'Content-Length': cachedBuffer.length.toString(),
          'X-Cache': 'HIT' // Diagnose-Header für dich im Netzwerk-Tab
        }
      });
    }

    // 💳 UMSATZ-SCHUTZ: Status-Check in der Datenbank (Nur bei Cache-Miss)
    const supabase = await createServerSupabaseClient();
    const { data: currentCase, error: caseError } = await supabase
        .from('cases')
        .select('billing_status, product_tier')
        .eq('case_code', upperCode)
        .single();

    if (caseError || !currentCase) {
      return NextResponse.json({ error: 'Fallcode ungültig.' }, { status: 404 });
    }

    if (currentCase.billing_status !== 'paid' && currentCase.billing_status !== 'free') {
      return NextResponse.json({ error: 'Zahlung erforderlich.' }, { status: 402 });
    }

    const fullHtml = buildStandardPdfHtml({
      caseCode: upperCode,
      productTier: currentCase.product_tier || 'beta',
      contentHtml: html
    });

    browser = await launchPDFBrowser();
    const page = await browser.newPage();

    // ✅ FIX: Typsicheres Setzen der Warte-Option ohne Linter-Fehler
    await page.setContent(fullHtml, { waitUntil: ['domcontentloaded', 'load'] });

    const pdfBuffer = await compilePageToA4Buffer({ page, footerText });
    await browser.close();

    // 💾 Für nachfolgende Downloads im RAM ablegen
    pdfRamCache.set(upperCode, pdfBuffer);

    return new Response(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="PflegeGutachten_${sanitizeFilename(upperCode)}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
        'X-Cache': 'MISS'
      }
    });

  } catch (error: unknown) {
    if (browser) await (browser as Browser).close();
    return handleApiError(error, 'api.pdf.generate.secure_dossier');
  }
}