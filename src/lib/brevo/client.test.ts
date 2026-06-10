// src/lib/brevo/__tests__/client.test.ts
import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';

import { BrevoClient } from '@/src/lib/brevo/client';
import { logger } from '@/src/lib/logger';

// 1. Logger mocken, damit die Konsole beim Testen sauber bleibt
vi.mock('@/src/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('BrevoClient', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    // Mock für global.fetch setzen
    global.fetch = vi.fn();

    // Environment Variable für die Tests mocken
    vi.stubEnv('BREVO_API_KEY', 'test_dummy_key_123');

    // Reset des Singletons vor jedem Test!
    // Da 'instance' private ist, müssen wir TS hier kurz ignorieren, um isolierte Tests zu garantieren.
    // @ts-expect-error - Resetting private static instance for isolated unit tests
    BrevoClient.instance = undefined;

    vi.clearAllMocks();
  });

  afterEach(() => {
    // Aufräumen
    global.fetch = originalFetch;
    vi.unstubAllEnvs();
  });

  describe('Initialisierung (Singleton)', () => {
    it('sollte einen Fehler werfen, wenn BREVO_API_KEY fehlt', () => {
      vi.stubEnv('BREVO_API_KEY', ''); // Key leeren

      expect(() => BrevoClient.getInstance()).toThrow(
        'BREVO_API_KEY fehlt in den Umgebungsvariablen.'
      );
      expect(logger.fatal).toHaveBeenCalledWith(
        { action: 'brevo_init_failed' },
        expect.any(String)
      );
    });

    it('sollte erfolgreich initialisieren und exakt dieselbe Instanz zurückgeben', () => {
      const instance1 = BrevoClient.getInstance();
      const instance2 = BrevoClient.getInstance();

      expect(instance1).toBeInstanceOf(BrevoClient);
      expect(instance1).toBe(instance2); // Prüft, ob es exakt dasselbe Objekt im Speicher ist
      expect(logger.debug).toHaveBeenCalledWith(
        { action: 'brevo_client_initialized' },
        expect.any(String)
      );
    });
  });

  describe('sendEmail', () => {
    const mockEmailOptions = {
      to: [{ email: 'tester@pflegenavigator.de' }],
      subject: 'Unit Test',
      htmlContent: '<p>Test</p>',
    };

    it('sollte eine E-Mail erfolgreich versenden', async () => {
      // Fetch so mocken, als käme ein 200 OK von Brevo
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messageId: '12345' }),
      });

      const client = BrevoClient.getInstance();
      await client.sendEmail(mockEmailOptions);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.brevo.com/v3/smtp/email',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'api-key': 'test_dummy_key_123',
          }),
          body: expect.stringContaining('tester@pflegenavigator.de'),
        })
      );

      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'brevo_email_success' }),
        expect.any(String)
      );
    });

    it('sollte einen Fehler werfen, wenn die Brevo API einen Fehler meldet', async () => {
      const apiErrorMock = { message: 'Missing parameters', code: 'bad_request' };

      // Fetch so mocken, als käme ein 400 Bad Request
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => apiErrorMock,
      });

      const client = BrevoClient.getInstance();

      // Prüfen, ob die Methode rejected
      await expect(client.sendEmail(mockEmailOptions)).rejects.toThrow(
        'Brevo Email API Fehler: {"message":"Missing parameters","code":"bad_request"}'
      );

      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'brevo_email_error', status: 400 }),
        expect.any(String)
      );
    });
  });

  describe('sendSms', () => {
    const mockSmsOptions = {
      recipient: '+4915112345678',
      content: 'Test SMS',
    };

    it('sollte eine SMS versenden und die Telefonnummer im Log maskieren', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messageId: 'sms_123' }),
      });

      const client = BrevoClient.getInstance();
      await client.sendSms(mockSmsOptions);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.brevo.com/v3/transactionalSMS/sms',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('+4915112345678'),
        })
      );

      // GANZ WICHTIG: Prüfen, ob der DSGVO-Schutz im Logger funktioniert!
      // Wir nutzen nthCalledWith(1, ...), da logger.info in diesem Test zweimal feuert (start & success)
      expect(logger.info).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          action: 'brevo_sms_start',
          recipient: '+49151***678', // <-- Hier ist der korrigierte Regex-Match
        }),
        expect.any(String)
      );
    });

    it('sollte Netzwerkfehler (fetch fails komplett) sauber fangen und loggen', async () => {
      // Simuliert einen DNS-Fehler oder Verbindungsabbruch (Fetch wirft Fehler)
      const networkError = new Error('fetch failed');
      (global.fetch as Mock).mockRejectedValueOnce(networkError);

      const client = BrevoClient.getInstance();

      await expect(client.sendSms(mockSmsOptions)).rejects.toThrow('fetch failed');

      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'brevo_sms_exception', err: networkError }),
        expect.any(String)
      );
    });
  });
});
