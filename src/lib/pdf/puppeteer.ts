// src/lib/pdf/puppeteer.ts

import puppeteer, { Browser } from 'puppeteer-core';

/**
 * Startet eine headless Chromium-Instanz basierend auf der aktuellen Plattform
 * @returns {Promise<Browser>} Eine typsichere Puppeteer-Browser-Instanz
 */
export async function launchPDFBrowser(): Promise<Browser> {
  let executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;

  // Automatisches Betriebssystem-Mapping (Mac M1/M2/M3 vs. Linux VPS)
  if (!executablePath && process.platform === 'darwin') {
    executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  } else if (!executablePath) {
    executablePath = '/usr/bin/chromium';
  }

  return await puppeteer.launch({
    headless: true,
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });
}

/**
 * Bereinigt Dateinamen von illegalen Zeichen
 */
export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9]/gi, '_').substring(0, 20);
}
