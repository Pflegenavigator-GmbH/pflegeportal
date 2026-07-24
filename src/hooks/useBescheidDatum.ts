// src/hooks/useBescheidDatum.ts
'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { istGueltigerFallcode } from '@/src/lib/billing/entitlement';
import { logger } from '@/src/lib/logger';

/**
 * Lädt und speichert das Bescheiddatum eines Falls.
 *
 * Ohne gültigen Fallcode arbeitet der Hook rein lokal — die Fristen bleiben
 * damit auch ohne angelegten Fall berechenbar, nur eben nicht dauerhaft.
 */
export function useBescheidDatum(caseCode: string | null) {
  const [bescheidDatum, setBescheidDatum] = useState<string | null>(null);
  const [speichert, setSpeichert] = useState(false);

  useEffect(() => {
    if (!istGueltigerFallcode(caseCode)) return;

    let abgebrochen = false;

    fetch(`/api/cases/${encodeURIComponent(caseCode)}/bescheid-datum`, {
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
  }, [caseCode]);

  const speichereBescheidDatum = useCallback(
    async (isoDatum: string) => {
      // Sofort anzeigen: Die Fristberechnung ist rein lokal und soll nicht auf
      // den Roundtrip warten.
      setBescheidDatum(isoDatum);

      if (!istGueltigerFallcode(caseCode)) return;

      setSpeichert(true);
      try {
        const antwort = await fetch(`/api/cases/${encodeURIComponent(caseCode)}/bescheid-datum`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ bescheidDatum: isoDatum }),
        });

        if (!antwort.ok) throw new Error(`Status ${antwort.status}`);
      } catch (error) {
        logger.error({ error, caseCode }, 'Bescheiddatum konnte nicht gespeichert werden');
        toast.error('Das Datum konnte nicht dauerhaft gespeichert werden.');
      } finally {
        setSpeichert(false);
      }
    },
    [caseCode]
  );

  return { bescheidDatum, speichereBescheidDatum, speichert };
}
