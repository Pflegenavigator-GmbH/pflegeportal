// src/hooks/useFallcode.ts
'use client';

import { useSyncExternalStore } from 'react';

import { CASE_CODE_EVENT, getStoredCaseCode } from '@/src/lib/case-storage';

function abonniere(beiAenderung: () => void): () => void {
  window.addEventListener(CASE_CODE_EVENT, beiAenderung);
  return () => window.removeEventListener(CASE_CODE_EVENT, beiAenderung);
}

/**
 * Der Fallcode zur **Anzeige** — nur für diese Browsersitzung (#135).
 *
 * Liefert `null`, sobald die Seite neu geladen wurde: Der Code steht seit #135
 * nur im Arbeitsspeicher, und serverseitig existiert seit #153 nur sein Hash.
 *
 * Wichtig für Aufrufer: `null` bedeutet **nicht** „kein Fall geöffnet". Ob eine
 * Sitzung besteht, beantwortet ausschließlich der Server — jede fallbezogene
 * API antwortet ohne Sitzung mit 401. Wer aus `null` auf „kein Fall" schließt,
 * schickt Menschen mit gültiger Sitzung zurück auf die Startseite.
 */
export function useFallcode(): string | null {
  return useSyncExternalStore(
    abonniere,
    getStoredCaseCode,
    // Serverseitig gibt es keinen Arbeitsspeicher des Browsers.
    () => null
  );
}
