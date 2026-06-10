// src/hooks/useConsent.ts
'use client';

import { useSyncExternalStore } from 'react';

const subscribe = (listener: () => void) => {
  window.addEventListener('consentChange', listener);
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener('consentChange', listener);
    window.removeEventListener('storage', listener);
  };
};

const getSnapshot = () => {
  return localStorage.getItem('user_consent');
};

const getServerSnapshot = () => {
  return null;
};

export function useConsent() {
  const consentString = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  let hasAnalyticsConsent = false;

  if (consentString) {
    try {
      const parsed = JSON.parse(consentString);
      hasAnalyticsConsent = Boolean(parsed.analytics);
    } catch (error) {
      console.error('Fehler beim Parsen der Consent-Daten:', error);
    }
  }

  return { hasAnalyticsConsent };
}
