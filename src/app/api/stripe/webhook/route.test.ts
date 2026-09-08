import { NextRequest } from 'next/server';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { POST } from './route';

// 1. Spies via hoisted deklarieren
const { constructEventMock, supabaseFromMock, supabaseInsertMock, supabaseUpdateMock } = vi.hoisted(
  () => ({
    constructEventMock: vi.fn(),
    supabaseFromMock: vi.fn(),
    supabaseInsertMock: vi.fn(),
    supabaseUpdateMock: vi.fn(),
  })
);

// 2. Stripe-Instanz mocken
vi.mock('@/src/lib/stripe/server', () => ({
  stripe: {
    webhooks: {
      constructEvent: constructEventMock,
    },
  },
}));

// 3. Supabase Admin-Client mocken (synchron, kein Promise)
vi.mock('@/src/lib/supabase/admin', () => ({
  createAdminSupabaseClient: vi.fn().mockReturnValue({
    from: supabaseFromMock,
  }),
}));

describe('Stripe Webhook API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';

    // Fluent API Chaining vorbereiten
    supabaseFromMock.mockReturnThis();
  });

  it('sollte 400 zurückgeben, wenn die Stripe-Signature im Header fehlt', async () => {
    const req = new NextRequest('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Signatur fehlt');
  });

  it('sollte 400 zurückgeben und in system_logs schreiben, wenn die Krypto-Signatur fehlschlägt', async () => {
    constructEventMock.mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const req = new NextRequest('http://localhost/api/stripe/webhook', {
      method: 'POST',
      headers: { 'stripe-signature': 'invalid_sig' },
      body: 'raw_body_string',
    });

    // Typsicherer Tabellen-Wechsler ohne 'any'
    supabaseFromMock.mockImplementation((table: string) => {
      if (table === 'system_logs') {
        return {
          insert: supabaseInsertMock.mockResolvedValue({ error: null }),
        } as unknown as ReturnType<typeof supabaseFromMock>;
      }
      return { select: vi.fn() } as unknown as ReturnType<typeof supabaseFromMock>;
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Ungültige Signatur');
    expect(supabaseInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'stripe.webhook.signature',
      })
    );
  });

  it('sollte den Fall auf paid setzen und Zahlung eintragen bei checkout.session.completed', async () => {
    const mockEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_123',
          payment_status: 'paid',
          amount_total: 4900,
          metadata: {
            case_code: 'PFLEGE456',
            paket: 'standard_monthly',
          },
        },
      },
    };
    constructEventMock.mockReturnValue(mockEvent);

    const selectMock = vi.fn().mockReturnThis();
    const eqMock = vi.fn().mockReturnThis();
    const maybeSingleMock = vi
      .fn()
      .mockResolvedValue({ data: { id: 'db-case-uuid' }, error: null });

    // Das 'any' wurde hier durch 'as unknown as ReturnType<typeof supabaseFromMock>' ersetzt.
    // Das zwingt TypeScript, das dynamische Mock-Objekt als gültige Supabase-Instanz zu akzeptieren.
    supabaseFromMock.mockImplementation((table: string) => {
      if (table === 'cases') {
        return {
          select: selectMock,
          eq: eqMock,
          maybeSingle: maybeSingleMock,
          update: supabaseUpdateMock.mockReturnThis(),
        } as unknown as ReturnType<typeof supabaseFromMock>;
      }
      if (table === 'payments') {
        // Idempotenz-Check (select → eq → maybeSingle: kein Treffer) + Insert
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          insert: supabaseInsertMock.mockResolvedValue({ error: null }),
        } as unknown as ReturnType<typeof supabaseFromMock>;
      }
      if (table === 'system_logs') {
        return {
          insert: supabaseInsertMock.mockResolvedValue({ error: null }),
        } as unknown as ReturnType<typeof supabaseFromMock>;
      }
      return {} as unknown as ReturnType<typeof supabaseFromMock>;
    });

    supabaseUpdateMock.mockImplementation(() => ({
      eq: vi.fn().mockResolvedValue({ error: null }),
    }));

    const req = new NextRequest('http://localhost/api/stripe/webhook', {
      method: 'POST',
      headers: { 'stripe-signature': 'valid_sig' },
      body: 'valid_raw_body',
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.received).toBe(true);

    expect(supabaseUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        billing_status: 'paid',
        product_tier: 'standard',
      })
    );

    expect(supabaseInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        betrag: 49.0,
        stripe_session_id: 'cs_123',
      })
    );
  });
});
