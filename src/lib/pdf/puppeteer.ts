// src/lib/pdf/puppeteer.ts
import puppeteer, { Browser } from 'puppeteer-core';

import { logger } from '@/src/lib/logger';

/**
 * Flags für ein Chromium, das als Systempaket vorliegt — lokale Entwicklung
 * ebenso wie der Container.
 *
 * `--disable-dev-shm-usage` ist im Container nicht optional: Docker gibt einem
 * Container standardmäßig 64 MB `/dev/shm`, und Chromium stürzt beim Rendern
 * größerer Seiten darin ab. Die Compose-Datei hebt das Limit zusätzlich an.
 */
const SYSTEM_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
];

interface StartOptionen {
  executablePath: string;
  args: string[];
  headless: boolean | 'shell';
}

/**
 * Läuft der Code in einer Serverless-Funktion (Vercel/AWS Lambda)?
 * Vercel setzt beide Signale; `AWS_LAMBDA_FUNCTION_NAME` ist das von
 * @sparticuz/chromium dokumentierte Kennzeichen.
 */
function istServerless(): boolean {
  return Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL);
}

/**
 * Ermittelt Chromium-Pfad, Flags und Headless-Modus je Umgebung.
 *
 * Reihenfolge (erste zutreffende gewinnt):
 *  1. PUPPETEER_EXECUTABLE_PATH — expliziter Override. Diesen Weg nimmt auch
 *     der Container: Dort liegt Chromium als Systempaket im Image, der Pfad
 *     steht im Dockerfile (#177).
 *  2. Serverless (Vercel/Lambda) — gebündeltes @sparticuz/chromium; das
 *     System-Chromium `/usr/bin/chromium` existiert dort NICHT, weshalb die
 *     PDF-Erzeugung ohne diesen Zweig in Produktion scheiterte.
 *  3. macOS-Entwicklung — installiertes Google Chrome.
 *  4. lokale Linux-Entwicklung — System-Chromium (Verhalten wie bisher).
 */
async function ermittleStartOptionen(): Promise<StartOptionen> {
  const override = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (override) {
    return { executablePath: override, args: SYSTEM_ARGS, headless: true };
  }

  if (istServerless()) {
    /*
     * Bewusst erst hier geladen und nicht am Dateikopf: @sparticuz/chromium
     * bringt einen eigenen, komprimierten Browser mit und existiert allein für
     * Lambda-artige Umgebungen. Im Container wird es nie erreicht — und wenn
     * das Paket mit dem Abschied von Vercel verschwindet, ist hier eine Zeile
     * zu löschen statt eine Abhängigkeit am Dateikopf aufzulösen.
     */
    const { default: chromium } = await import('@sparticuz/chromium');

    return {
      executablePath: await chromium.executablePath(),
      args: chromium.args,
      headless: 'shell',
    };
  }

  if (process.platform === 'darwin') {
    return {
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      args: SYSTEM_ARGS,
      headless: true,
    };
  }

  return { executablePath: '/usr/bin/chromium', args: SYSTEM_ARGS, headless: true };
}

/**
 * Startet eine headless Chromium-Instanz passend zur Laufzeitumgebung.
 * @returns {Promise<Browser>} Eine typsichere Puppeteer-Browser-Instanz
 */
export async function launchPDFBrowser(): Promise<Browser> {
  const { executablePath, args, headless } = await ermittleStartOptionen();

  logger.debug(
    { executablePath, headless, platform: process.platform, serverless: istServerless() },
    'Starte Puppeteer Browser'
  );

  try {
    const browser = await puppeteer.launch({ headless, executablePath, args });

    logger.info('Puppeteer Browser erfolgreich gestartet');
    return browser;
  } catch (error) {
    logger.error({ error }, 'Fehler beim Starten des Puppeteer Browsers');
    throw error;
  }
}

/**
 * Bereinigt Dateinamen von illegalen Zeichen
 */
export function sanitizeFilename(name: string): string {
  const sanitized = name.replace(/[^a-z0-9]/gi, '_').substring(0, 20);
  logger.debug({ original: name, sanitized }, 'Dateiname wurde bereinigt');
  return sanitized;
}
