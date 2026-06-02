// src/lib/pdf/templates.ts

import { Page } from 'puppeteer-core';

interface BuildHtmlOptions {
    caseCode: string;
    productTier: string;
    contentHtml: string;
}

/**
 * Erzeugt das standardisierte Corporate-Identity HTML-Skelett für Gutachten
 */
export function buildStandardPdfHtml({ caseCode, productTier, contentHtml }: BuildHtmlOptions): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @page { margin: 25mm 20mm 25mm 20mm; }
        body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #1e293b; }
        h1 { font-size: 22pt; color: #0f2744; margin-bottom: 16pt; font-weight: bold; border-bottom: 2px solid #20b2aa; padding-bottom: 6px; }
        h2 { font-size: 15pt; color: #0f2744; margin-top: 20pt; margin-bottom: 10pt; font-weight: bold; }
        p { margin-bottom: 10pt; text-align: justify; }
        table { width: 100%; border-collapse: collapse; margin: 16pt 0; }
        th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
        th { background-color: #0f2744; color: #ffffff; font-weight: bold; }
        td { background-color: #f8fafc; }
        .footer { font-size: 9pt; color: #64748b; text-align: center; }
      </style>
    </head>
    <body>
      <div style="font-size: 10px; color: #64748b; text-align: right; font-family: monospace; margin-bottom: 20px;">
        AKTE: ${caseCode.toUpperCase()} • TARIF: ${productTier.toUpperCase()}
      </div>
      ${contentHtml}
    </body>
    </html>
  `;
}

interface CompilePdfOptions {
    page: Page;
    footerText?: string;
}

/**
 * Übernimmt das physische Rendering des PDF-Dokuments mit festen DIN-A4 Metriken
 */
export async function compilePageToA4Buffer({ page, footerText }: CompilePdfOptions): Promise<Uint8Array> {
    const footerTemplate = `
    <div style="font-size: 9px; width: 100%; text-align: center; color: #64748b; font-family: Arial, sans-serif; padding-top: 5px; border-top: 1px solid #e2e8f0; margin: 0 15mm;">
      ${footerText || 'PflegeNavigator EU gUG — Orientierungshilfe nach § 14 SGB XI'} 
      <div style="float: right;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>
    </div>
  `;

    return await page.pdf({
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: true,
        footerTemplate,
        headerTemplate: '<div></div>',
        margin: {
            top: '25mm',
            right: '20mm',
            bottom: '25mm',
            left: '20mm'
        }
    });
}