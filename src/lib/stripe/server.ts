// src/lib/stripe/server.ts
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY fehlt in den Umgebungsvariablen (.env)');
}

interface GlobalStripe {
  stripeInstance?: Stripe;
}

const globalForStripe = globalThis as typeof globalThis & GlobalStripe;

export const stripe =
  globalForStripe.stripeInstance ??
  new Stripe(stripeSecretKey, {
    // Überlassen wir dem SDK die Steuerung der passenden Version,
    // um Versions-Mismatches und TS-Fehler nativ zu verhindern.
  });

if (process.env.NODE_ENV !== 'production') {
  globalForStripe.stripeInstance = stripe;
}
