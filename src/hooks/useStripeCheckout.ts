// src/hook/useStripeCheckout.ts

'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

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
            toast.error('Kein gültiger Fallcode für den Checkout vorhanden.');
            return;
        }

        setCheckoutLoading(true);
        const toastId = toast.loading('Sicheres Bezahlfenster von Stripe wird geladen...');

        try {
            const res = await fetch('/api/checkout/create-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    caseCode: caseCode.toUpperCase(),
                    paket: paketId
                })
            });

            if (!res.ok) {
                throw new Error('Server-Antwort im Checkout-Prozess fehlerhaft.');
            }

            const data = await res.json();

            if (data.url) {
                // 🚀 Weiterleitung direkt auf die verschlüsselte Stripe-Plattform
                window.location.href = data.url;
            } else {
                throw new Error('Keine valide Checkout-URL empfangen.');
            }
        } catch (error) {
            console.error('Stripe-Verbindungsfehler:', error);
            toast.error('Verbindungsfehler zu Stripe. Bitte versuchen Sie es erneut.', { id: toastId });
        } finally {
            setCheckoutLoading(false);
        }
    }, []);

    return { triggerCheckout, checkoutLoading };
}