import puppeteer, { Browser } from 'puppeteer-core';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { launchPDFBrowser, sanitizeFilename } from './puppeteer';

vi.mock('puppeteer-core');

// @sparticuz/chromium liefert im Serverless-Zweig Pfad und Flags.
vi.mock('@sparticuz/chromium', () => ({
  default: {
    args: ['--single-process', '--no-sandbox'],
    executablePath: vi.fn().mockResolvedValue('/var/task/chromium'),
  },
}));

describe('PDF Puppeteer Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.PUPPETEER_EXECUTABLE_PATH;
    // Serverless-Signale zurücksetzen, damit lokale Pfade deterministisch greifen.
    delete process.env.AWS_LAMBDA_FUNCTION_NAME;
    delete process.env.VERCEL;
    Object.defineProperty(process, 'platform', { value: 'darwin', writable: true });
  });

  describe('launchPDFBrowser', () => {
    it('startet lokal headless mit den erwarteten Flags', async () => {
      const mockBrowser = { close: vi.fn() } as unknown as Browser;
      vi.mocked(puppeteer.launch).mockResolvedValue(mockBrowser);

      await launchPDFBrowser();

      expect(puppeteer.launch).toHaveBeenCalledWith(
        expect.objectContaining({
          headless: true,
          args: expect.arrayContaining(['--no-sandbox']),
        })
      );
    });

    it('reicht Fehler weiter', async () => {
      vi.mocked(puppeteer.launch).mockRejectedValue(new Error('Browser failed'));

      await expect(launchPDFBrowser()).rejects.toThrow('Browser failed');
    });

    it('wählt lokal unter Linux das System-Chromium', async () => {
      const launchSpy = vi.mocked(puppeteer.launch);
      launchSpy.mockResolvedValue({} as Browser);
      Object.defineProperty(process, 'platform', { value: 'linux', writable: true });

      await launchPDFBrowser();

      expect(launchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ executablePath: '/usr/bin/chromium', headless: true })
      );
    });

    it('nutzt in der Serverless-Umgebung @sparticuz/chromium', async () => {
      const launchSpy = vi.mocked(puppeteer.launch);
      launchSpy.mockResolvedValue({} as Browser);
      // Vercel/Lambda-Signal — der /usr/bin/chromium-Pfad existiert dort nicht.
      process.env.AWS_LAMBDA_FUNCTION_NAME = 'pdf-generate';
      Object.defineProperty(process, 'platform', { value: 'linux', writable: true });

      await launchPDFBrowser();

      expect(launchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          executablePath: '/var/task/chromium',
          headless: 'shell',
          args: expect.arrayContaining(['--single-process']),
        })
      );
    });

    it('lässt PUPPETEER_EXECUTABLE_PATH Vorrang haben — auch serverless', async () => {
      const launchSpy = vi.mocked(puppeteer.launch);
      launchSpy.mockResolvedValue({} as Browser);
      process.env.PUPPETEER_EXECUTABLE_PATH = '/opt/custom/chrome';
      process.env.AWS_LAMBDA_FUNCTION_NAME = 'pdf-generate';

      await launchPDFBrowser();

      expect(launchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ executablePath: '/opt/custom/chrome', headless: true })
      );
    });
  });

  describe('sanitizeFilename', () => {
    it('sollte Sonderzeichen durch Unterstriche ersetzen', () => {
      expect(sanitizeFilename('Mein Bericht & Co!')).toBe('Mein_Bericht___Co_');
    });

    it('sollte den Dateinamen auf 20 Zeichen kürzen', () => {
      const longName = 'DiesIstEinSehrLangerDateiname';
      expect(sanitizeFilename(longName).length).toBe(20);
    });
  });
});
