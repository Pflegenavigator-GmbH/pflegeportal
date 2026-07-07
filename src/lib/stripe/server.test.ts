import Stripe from 'stripe';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('stripe');

describe('Stripe Instance', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('sollte Stripe initialisieren, wenn der Key gesetzt ist', async () => {
    // 1. Env-Stub setzen
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_123');

    // 2. Erst JETZT importieren
    const { stripe } = await import('./server');

    expect(Stripe).toHaveBeenCalledTimes(1);
    expect(Stripe).toHaveBeenCalledWith('sk_test_123', expect.any(Object));
    expect(stripe).toBeDefined();
  });

  it('sollte Fehler werfen, wenn der Key fehlt', async () => {
    // Env entfernen
    vi.stubEnv('STRIPE_SECRET_KEY', '');

    await expect(import('./server')).rejects.toThrow('STRIPE_SECRET_KEY fehlt');
  });
});
