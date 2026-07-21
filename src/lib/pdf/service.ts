// src/lib/pdf/service.ts
// Zentraler PDF-Rendering-Service. Einzige Stelle, an der HTML zu einem PDF
// wird — bündelt die Sicherheitsmaßnahmen, die vorher in drei Routen verteilt
// (und teils gar nicht) vorhanden waren.
import { Browser, HTTPRequest } from 'puppeteer-core';

import { launchPDFBrowser } from '@/src/lib/pdf/puppeteer';
import { compilePageToA4Buffer, PdfMargin } from '@/src/lib/pdf/templates';

export interface RenderPdfOptions {
  footerText?: string;
  showFooter?: boolean;
  margin?: PdfMargin;
}

/**
 * Rendert HTML deterministisch zu einem A4-PDF.
 *
 * 🛡️ SSRF-Härtung (gilt für alle Aufrufer): JavaScript ist deaktiviert und
 * jede Netzwerk-Anfrage außer eingebetteten data:/about:-Ressourcen wird
 * blockiert. Damit kann selbst eingeschleustes HTML keine internen Dienste
 * oder Cloud-Metadaten-Endpunkte kontaktieren. Der Browser wird immer
 * geschlossen — auch im Fehlerfall.
 */
export async function renderHtmlToPdf(
  html: string,
  options: RenderPdfOptions = {}
): Promise<Uint8Array> {
  let browser: Browser | null = null;
  try {
    browser = await launchPDFBrowser();
    const page = await browser.newPage();

    await page.setJavaScriptEnabled(false);
    await page.setRequestInterception(true);
    page.on('request', (req: HTTPRequest) => {
      const url = req.url();
      if (url.startsWith('data:') || url.startsWith('about:')) {
        void req.continue();
      } else {
        void req.abort();
      }
    });

    await page.setContent(html, { waitUntil: ['domcontentloaded', 'load'] });

    return await compilePageToA4Buffer({
      page,
      footerText: options.footerText,
      showFooter: options.showFooter,
      margin: options.margin,
    });
  } finally {
    if (browser) await browser.close();
  }
}
