// src/hooks/useBewertungen.ts
'use client';

import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { BEWERTUNGS_WERTE } from '@/src/lib/pflegegrad/fragen';
import type { BewertungOption } from '@/src/types/pflegegrad';

/**
 * Die Antwortskala der Module 1–5 mit übersetzten Beschriftungen.
 *
 * Eigener Hook statt fünf Mal derselben Zeile in jeder Modulseite: Der
 * Namensraum ist hier fest, die Modulnamen sind es nicht — deshalb bleibt das
 * Auflösen der FRAGEN in den Seiten, die Skala aber wandert hierher.
 */
export function useBewertungen(): BewertungOption[] {
  const t = useTranslations('pflegegrad.bewertungen');

  return useMemo(
    () =>
      BEWERTUNGS_WERTE.map(({ value, punkte }) => ({
        value,
        punkte,
        label: t(value),
      })),
    [t]
  );
}
