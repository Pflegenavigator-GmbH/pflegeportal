// src/lib/stripe/server.ts
import Stripe from 'stripe';

import { logger } from '@/src/lib/logger';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  logger.error('STRIPE_SECRET_KEY fehlt in den Umgebungsvariablen (.env)');
  throw new Error('STRIPE_SECRET_KEY fehlt in den Umgebungsvariablen (.env)');
}

interface GlobalStripe {
  stripeInstance?: Stripe;
}

const globalForStripe = globalThis as typeof globalThis & GlobalStripe;

if (!globalForStripe.stripeInstance) {
  logger.info('Initialisiere neue Stripe-Instanz');
  globalForStripe.stripeInstance = new Stripe(stripeSecretKey, {
    // Überlassen wir dem SDK die Steuerung der passenden Version,
    // um Versions-Mismatches und TS-Fehler nativ zu verhindern.
  });
} else {
  logger.debug('Verwende bestehende Stripe-Instanz aus dem globalen Kontext');
}

export const stripe = globalForStripe.stripeInstance;

if (process.env.NODE_ENV !== 'production') {
  globalForStripe.stripeInstance = stripe;
}
