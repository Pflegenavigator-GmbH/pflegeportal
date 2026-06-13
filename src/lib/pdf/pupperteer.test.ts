import puppeteer, { Browser } from 'puppeteer-core';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { launchPDFBrowser, sanitizeFilename } from './puppeteer';

vi.mock('puppeteer-core');

describe('PDF Puppeteer Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.PUPPETEER_EXECUTABLE_PATH;
  });

  describe('launchPDFBrowser', () => {
    it('sollte den Browser mit den korrekten Argumenten starten', async () => {
      // Wir casten nur das Mock-Objekt auf Partial<Browser>,
      // da ein echter Browser hunderte Methoden hat, die wir hier nicht alle brauchen.
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

    it('sollte bei Fehlern den Fehler weiterwerfen', async () => {
      vi.mocked(puppeteer.launch).mockRejectedValue(new Error('Browser failed'));

      await expect(launchPDFBrowser()).rejects.toThrow('Browser failed');
    });

    it('wählt chromium unter Linux aus', async () => {
      // 1. Wir definieren den Mock explizit
      const launchSpy = vi.mocked(puppeteer.launch);
      launchSpy.mockResolvedValue({} as Browser);

      Object.defineProperty(process, 'platform', { value: 'linux', writable: true });

      await launchPDFBrowser();

      // 2. Jetzt kannst du den Spy direkt prüfen
      expect(launchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          executablePath: '/usr/bin/chromium',
        })
      );

      Object.defineProperty(process, 'platform', { value: 'darwin', writable: true });
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
