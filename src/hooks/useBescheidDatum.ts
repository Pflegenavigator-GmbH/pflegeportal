// src/hooks/useBescheidDatum.ts
'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { logger } from '@/src/lib/logger';

/**
 * Lädt und speichert das Bescheiddatum eines Falls.
 *
 * Ohne Sitzung arbeitet der Hook rein lokal — die Fristen bleiben damit auch
 * ohne angelegten Fall berechenbar, nur eben nicht dauerhaft. Erkennbar ist
 * das an der Antwort der API (401), nicht mehr an einem Fallcode im Client
 * (#135).
 */
export function useBescheidDatum() {
  const [bescheidDatum, setBescheidDatum] = useState<string | null>(null);
  const [speichert, setSpeichert] = useState(false);

  useEffect(() => {
    let abgebrochen = false;

    fetch('/api/case/bescheid-datum', {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
      .then((antwort) => (antwort.ok ? antwort.json() : null))
      .then((nutzlast) => {
        if (abgebrochen) return;
        const gespeichert = nutzlast?.data?.bescheidDatum;
        if (typeof gespeichert === 'string') setBescheidDatum(gespeichert);
      })
      .catch((error) => {
        logger.warn({ error }, 'Bescheiddatum konnte nicht geladen werden');
      });

    return () => {
      abgebrochen = true;
    };
  }, []);

  const speichereBescheidDatum = useCallback(async (isoDatum: string) => {
    // Sofort anzeigen: Die Fristberechnung ist rein lokal und soll nicht auf
    // den Roundtrip warten.
    setBescheidDatum(isoDatum);

    setSpeichert(true);
    try {
      const antwort = await fetch('/api/case/bescheid-datum', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ bescheidDatum: isoDatum }),
      });

      if (!antwort.ok) throw new Error(`Status ${antwort.status}`);
    } catch (error) {
      logger.error({ error }, 'Bescheiddatum konnte nicht gespeichert werden');
      toast.error('Das Datum konnte nicht dauerhaft gespeichert werden.');
    } finally {
      setSpeichert(false);
    }
  }, []);

  return { bescheidDatum, speichereBescheidDatum, speichert };
}
