import { describe, it, expect, beforeEach, vi } from 'vitest';

import { POST } from './route';

// 1. Spies via hoisted deklarieren, um Typsicherheit zu garantieren
const {
  stripeSessionsCreateMock,
  supabaseFromMock,
  supabaseSelectMock,
  supabaseEqMock,
  supabaseInMock,
  supabaseUpdateMock,
  supabaseSingleMock,
  supabaseMaybeSingleMock,
  handleApiErrorMock,
} = vi.hoisted(() => ({
  stripeSessionsCreateMock: vi.fn(),
  supabaseFromMock: vi.fn(),
  supabaseSelectMock: vi.fn(),
  supabaseEqMock: vi.fn(),
  supabaseInMock: vi.fn(),
  supabaseUpdateMock: vi.fn(),
  supabaseSingleMock: vi.fn(),
  supabaseMaybeSingleMock: vi.fn(),
  handleApiErrorMock: vi.fn(),
}));

// 2. Stripe mocken
vi.mock('@/src/lib/stripe/server', () => ({
  stripe: {
    checkout: {
      sessions: {
        create: stripeSessionsCreateMock,
      },
    },
  },
}));

// 3. Supabase Admin-Client mocken (synchron, kein Promise)
vi.mock('@/src/lib/supabase/admin', () => ({
  createAdminSupabaseClient: vi.fn().mockReturnValue({
    from: supabaseFromMock,
  }),
}));

// 4. API Error Handler mocken
vi.mock('@/src/lib/api/error-handler', () => ({
  handleApiError: handleApiErrorMock,
}));

describe('Create Session API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_URL = 'http://localhost:3000';
    process.env.ENVIRONMENT = 'production';

    // Fluent API Chaining für Standard-Mocks vorbereiten
    supabaseFromMock.mockReturnThis();
    supabaseSelectMock.mockReturnThis();
    supabaseEqMock.mockReturnThis();
    supabaseInMock.mockReturnThis();
  });

  it('sollte 400/Validierungsfehler auswerfen, wenn Parameter fehlen', async () => {
    const mockRequest = new Request('http://localhost/api/checkout/create-session', {
      method: 'POST',
      body: JSON.stringify({ caseCode: '' }), // 'paket' fehlt komplett
    });

    await POST(mockRequest);

    expect(handleApiErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'ValidationError' }),
      'api.checkout.create-session'
    );
  });

  it('sollte abbrechen, wenn das Beta-Special-Limit von 1000 Plätzen voll ist', async () => {
    const mockRequest = new Request('http://localhost/api/checkout/create-session', {
      method: 'POST',
      body: JSON.stringify({ caseCode: 'BETA123', paket: 'beta_special' }),
    });

    // 1. Einen spezifischen Mock für das verkettete .eq() nach dem .update() erstellen
    const updateEqMock = vi.fn().mockResolvedValue({ error: null });
    supabaseUpdateMock.mockReturnValue({ eq: updateEqMock });

    supabaseFromMock.mockImplementation((table: string) => {
      if (table === 'cases') {
        return {
          select: supabaseSelectMock.mockReturnThis(),
          eq: supabaseEqMock.mockReturnThis(),
          in: vi.fn().mockResolvedValue({ count: 1000, error: null }),
        } as unknown as ReturnType<typeof supabaseFromMock>;
      }
      if (table === 'products') {
        return {
          update: supabaseUpdateMock, // Liefert jetzt { eq: updateEqMock }
        } as unknown as ReturnType<typeof supabaseFromMock>;
      }
      return {} as unknown as ReturnType<typeof supabaseFromMock>;
    });

    await POST(mockRequest);

    // 2. Jetzt prüfen wir, ob .update() mit den richtigen Parametern aufgerufen wurde
    expect(supabaseUpdateMock).toHaveBeenCalledWith({ is_active: false });

    // 3. Und ob das nachfolgende .eq() das richtige Produkt anvisiert hat
    expect(updateEqMock).toHaveBeenCalledWith('id', 'beta_special');

    // 4. Der API-Error-Handler fängt nun wieder den echten ValidationError ab
    expect(handleApiErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Das exklusive Kontingent für das Beta-Special ist erschöpft.',
      }),
      'api.checkout.create-session'
    );
  });

  it('sollte eine Subscription-Session für Standard-Pakete erstellen und URL zurückgeben', async () => {
    const mockRequest = new Request('http://localhost/api/checkout/create-session', {
      method: 'POST',
      body: JSON.stringify({ caseCode: 'CASE999', paket: 'standard_monthly' }),
    });

    // Mocks für erfolgreichen Durchlauf orchestrieren
    supabaseSingleMock.mockResolvedValue({ data: { id: 'case-uuid-123' }, error: null });
    supabaseMaybeSingleMock.mockResolvedValue({
      data: { id: 'price_abc123', name: 'Standard Tarife' },
      error: null,
    });
    stripeSessionsCreateMock.mockResolvedValue({
      id: 'cs_test_999',
      url: 'https://stripe.url/checkout',
    });

    // Mock-Weiche für Tabellen-Abfragen
    supabaseFromMock.mockImplementation((table: string) => {
      if (table === 'cases') {
        return {
          select: supabaseSelectMock.mockReturnThis(),
          eq: supabaseEqMock.mockReturnThis(),
          single: supabaseSingleMock,
          update: supabaseUpdateMock.mockReturnThis(),
        } as unknown as ReturnType<typeof supabaseFromMock>;
      }
      if (table === 'products') {
        return {
          select: supabaseSelectMock.mockReturnThis(),
          eq: supabaseEqMock.mockReturnThis(),
          ilike: vi.fn().mockReturnThis(),
          not: vi.fn().mockReturnThis(),
          maybeSingle: supabaseMaybeSingleMock,
        } as unknown as ReturnType<typeof supabaseFromMock>;
      }
      return {} as unknown as ReturnType<typeof supabaseFromMock>;
    });

    supabaseUpdateMock.mockImplementation(() => ({
      eq: vi.fn().mockResolvedValue({ error: null }),
    }));

    const response = await POST(mockRequest);
    const data = await response.json();

    // Verifizieren, dass der Client die Weiterleitungs-URL erhält
    expect(response.status).toBe(200);
    expect(data.url).toBe('https://stripe.url/checkout');

    // Verifizieren, ob der Stripe-Modus korrekt auf 'subscription' gemappt wurde
    expect(stripeSessionsCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'subscription',
        line_items: [{ price: 'price_abc123', quantity: 1 }],
      })
    );

    // Verifizieren, ob der Fall in der DB temporär auf 'pending' gesetzt wird
    expect(supabaseUpdateMock).toHaveBeenCalledWith({
      stripe_session_id: 'cs_test_999',
      billing_status: 'pending',
    });
  });
});
