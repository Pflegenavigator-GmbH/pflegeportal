// src/hooks/useConsent.ts
'use client';

import { useSyncExternalStore } from 'react';

import { logger } from '@/src/lib/logger';

const subscribe = (listener: () => void) => {
  window.addEventListener('consentChange', listener);
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener('consentChange', listener);
    window.removeEventListener('storage', listener);
  };
};

const getSnapshot = () => localStorage.getItem('user_consent');
const getServerSnapshot = () => null;

export function parseConsentString(consentString: string | null) {
  if (!consentString) {
    logger.debug('Keine Consent-Daten im localStorage gefunden');
    return false;
  }

  try {
    const parsed = JSON.parse(consentString);
    return Boolean(parsed.analytics);
  } catch (error) {
    logger.error({ error, consentString }, 'Fehler beim Parsen der Consent-Daten aus localStorage');
    return false;
  }
}

export function useConsent() {
  const consentString = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { hasAnalyticsConsent: parseConsentString(consentString) };
}
