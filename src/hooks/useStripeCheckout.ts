// src/hook/useStripeCheckout.ts

'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

import { logger } from '@/src/lib/logger';

interface UseStripeCheckoutReturn {
  triggerCheckout: (caseCode: string | null, paketId: string) => Promise<void>;
  checkoutLoading: boolean;
}

/**
 * Universeller Hook zur Initiierung des Stripe-Bezahlprozesses via API-Session
 */
export function useStripeCheckout(): UseStripeCheckoutReturn {
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const triggerCheckout = useCallback(async (caseCode: string | null, paketId: string) => {
    if (!caseCode) {
      logger.warn({ paketId }, 'Checkout-Versuch ohne gültigen Fallcode abgebrochen');
      toast.error('Kein gültiger Fallcode für den Checkout vorhanden.');
      return;
    }

    setCheckoutLoading(true);
    const toastId = toast.loading('Sicheres Bezahlfenster von Stripe wird geladen...');

    try {
      logger.info({ caseCode, paketId }, 'Initialisiere Stripe Checkout Session');

      const res = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseCode: caseCode.toUpperCase(),
          paket: paketId,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server-Antwort fehlerhaft: ${res.status}`);
      }

      const data = await res.json();

      if (data.url) {
        logger.info({ checkoutUrl: data.url }, 'Checkout-URL erfolgreich erhalten, leite weiter');
        window.location.href = data.url;
      } else {
        throw new Error('Keine valide Checkout-URL empfangen.');
      }
    } catch (error) {
      logger.error({ error, caseCode }, 'Stripe-Checkout-Fehler');
      toast.error('Verbindungsfehler zu Stripe. Bitte versuchen Sie es erneut.', { id: toastId });
    } finally {
      setCheckoutLoading(false);
    }
  }, []);

  return { triggerCheckout, checkoutLoading };
}
