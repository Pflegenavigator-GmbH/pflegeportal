// src/lib/stripe/server.ts
import Stripe from 'stripe';

import { logger } from '@/src/lib/logger';

/**
 * Zugang zum Stripe-SDK.
 *
 * Bewusst eine Funktion und keine Konstante: Zuvor wurde der Schlüssel beim
 * Laden des Moduls gelesen — und ohne ihn warf die Datei sofort. Das traf
 * nicht nur die Laufzeit, sondern auch `next build`: Next wertet beim Bauen
 * jede Route aus, um ihre Konfiguration einzusammeln. Damit brauchte der
 * Build ein Produktionsgeheimnis, obwohl er es nie benutzt.
 *
 * Auf Vercel fiel das nie auf, weil dort dieselben Variablen im Build gesetzt
 * sind. Für das Container-Abbild (#177) ist es ein Hindernis: Geheimnisse
 * gehören an den Start, nicht in die Abbild-Historie (ADR-0003).
 *
 * Fehlt der Schlüssel, scheitert jetzt der erste Aufruf — laut und an der
 * Stelle, an der Stripe tatsächlich gebraucht wird.
 */

interface GlobalStripe {
  stripeInstance?: Stripe;
}

const globalForStripe = globalThis as typeof globalThis & GlobalStripe;

export function getStripe(): Stripe {
  if (globalForStripe.stripeInstance) {
    logger.debug('Verwende bestehende Stripe-Instanz aus dem globalen Kontext');
    return globalForStripe.stripeInstance;
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    logger.error('STRIPE_SECRET_KEY fehlt in den Umgebungsvariablen (.env)');
    throw new Error('STRIPE_SECRET_KEY fehlt in den Umgebungsvariablen (.env)');
  }

  logger.info('Initialisiere neue Stripe-Instanz');

  // Im globalen Kontext gehalten, damit ein Neuladen des Moduls in der
  // Entwicklung nicht bei jedem Aufruf eine neue Instanz erzeugt.
  globalForStripe.stripeInstance = new Stripe(stripeSecretKey, {
    // Überlassen wir dem SDK die Steuerung der passenden Version,
    // um Versions-Mismatches und TS-Fehler nativ zu verhindern.
  });

  return globalForStripe.stripeInstance;
}
