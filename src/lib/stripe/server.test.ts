import Stripe from 'stripe';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('stripe');

describe('Stripe-Instanz', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    // Die Instanz hängt am globalen Kontext und überlebt `resetModules`.
    delete (globalThis as { stripeInstance?: unknown }).stripeInstance;
  });

  it('initialisiert Stripe beim ersten Aufruf, wenn der Schlüssel gesetzt ist', async () => {
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_123');

    const { getStripe } = await import('./server');

    expect(Stripe).not.toHaveBeenCalled();

    const client = getStripe();

    expect(Stripe).toHaveBeenCalledTimes(1);
    expect(Stripe).toHaveBeenCalledWith('sk_test_123', expect.any(Object));
    expect(client).toBeDefined();
  });

  it('erzeugt die Instanz nur einmal', async () => {
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_123');

    const { getStripe } = await import('./server');
    getStripe();
    getStripe();

    expect(Stripe).toHaveBeenCalledTimes(1);
  });

  /**
   * Das Laden der Datei darf NICHT mehr werfen: `next build` wertet jede Route
   * aus, um ihre Konfiguration einzusammeln, und lud damit auch dieses Modul.
   * Der Build brauchte dadurch ein Produktionsgeheimnis, das er nie benutzt —
   * im Container-Abbild ist das keine Option (#177).
   */
  it('lässt sich ohne Schlüssel laden und scheitert erst beim Aufruf', async () => {
    vi.stubEnv('STRIPE_SECRET_KEY', '');

    const { getStripe } = await import('./server');

    expect(() => getStripe()).toThrow('STRIPE_SECRET_KEY fehlt');
  });
});
