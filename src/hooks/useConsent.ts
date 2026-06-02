// src/hooks/useConsent.ts
import { useState, useEffect } from 'react';

export function useConsent() {
    const [hasAnalyticsConsent, setHasAnalyticsConsent] = useState(false);

    useEffect(() => {
        // Initialer Check beim Laden
        const stored = localStorage.getItem('user_consent');
        if (stored) {
            const parsed = JSON.parse(stored);
            setHasAnalyticsConsent(parsed.analytics);
        }

        // Listener: 'Event' Typ verwenden und als CustomEvent mit unseren Daten casten
        const handleConsent = (e: Event) => {
            const customEvent = e as CustomEvent<{ analytics: boolean }>;
            setHasAnalyticsConsent(customEvent.detail.analytics);
        };

        window.addEventListener('consentChange', handleConsent);
        return () => window.removeEventListener('consentChange', handleConsent);
    }, []);

    return { hasAnalyticsConsent };
}