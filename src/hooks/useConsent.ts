// src/hooks/useConsent.ts
'use client';

import { useSyncExternalStore } from 'react';

import {
  abonniereEinwilligung,
  hatAnalyticsEinwilligung,
  leseRohwert,
  parseEinwilligung,
  type Einwilligung,
} from '@/src/lib/consent';

interface ConsentErgebnis {
  /** Darf Analyse & Statistik laufen? Die einzige Frage fürs Tracking. */
  hasAnalyticsConsent: boolean;
  /** Vollständige Auswahl, oder `null`, wenn noch nicht entschieden wurde. */
  einwilligung: Einwilligung | null;
  /** Wurde überhaupt schon entschieden? Steuert die Anzeige des Banners. */
  hatEntschieden: boolean;
}

/**
 * Liest die Einwilligung reaktiv.
 *
 * `useSyncExternalStore` statt useState+useEffect: der Wert steht schon beim
 * ersten Rendern fest, und eine Änderung — auch aus einem anderen Tab —
 * kommt sofort an. Genau das ist die Zusage von Art. 7 Abs. 3 DSGVO: ein
 * Widerruf wirkt unmittelbar, nicht erst beim nächsten Seitenaufruf.
 *
 * Der Snapshot ist der Rohstring; das Parsen passiert danach (siehe
 * `leseRohwert`).
 */
export function useConsent(): ConsentErgebnis {
  const roh = useSyncExternalStore(
    abonniereEinwilligung,
    leseRohwert,
    // Serverseitig gibt es keinen Speicher — konservativ „nicht entschieden",
    // damit ohne Einwilligung nichts geladen wird.
    () => null
  );

  return {
    hasAnalyticsConsent: hatAnalyticsEinwilligung(roh),
    einwilligung: parseEinwilligung(roh),
    hatEntschieden: parseEinwilligung(roh) !== null,
  };
}
