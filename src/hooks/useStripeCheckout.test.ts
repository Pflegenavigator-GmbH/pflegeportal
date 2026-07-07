import { renderHook, act } from '@testing-library/react';
import { toast } from 'sonner';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useStripeCheckout } from './useStripeCheckout';

// Mocke die Sonner-Toasts
vi.mock('sonner', () => ({
  toast: {
    loading: vi.fn(() => 'toast-1'),
    error: vi.fn(),
    dismiss: vi.fn(),
  },
}));

describe('useStripeCheckout Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // window.location mocken
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });
  });

  it('sollte checkoutLoading auf true setzen und fetch aufrufen', async () => {
    const mockResponse = { url: 'https://checkout.stripe.com/pay/123' };

    // 1. Spy separat erstellen
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    // 2. Den erstellten Spy global als 'fetch' registrieren
    vi.stubGlobal('fetch', fetchSpy);

    const { result } = renderHook(() => useStripeCheckout());

    await act(async () => {
      await result.current.triggerCheckout('FALL123', 'paket_basic');
    });

    // 3. Jetzt klappt die Assertion, da fetchSpy eine echte vi.fn() ist!
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/checkout/create-session',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ caseCode: 'FALL123', paket: 'paket_basic' }),
      })
    );

    expect(window.location.href).toBe(mockResponse.url);
  });

  it('sollte Fehlerbehandlung bei fehlendem caseCode zeigen', async () => {
    const { result } = renderHook(() => useStripeCheckout());

    await act(async () => {
      await result.current.triggerCheckout(null, 'paket_basic');
    });

    expect(toast.error).toHaveBeenCalled();
  });
});
