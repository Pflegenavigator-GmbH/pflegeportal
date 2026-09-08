// src/app/api/revalidate/route.ts
import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

import { locales } from '@/src/i18n/config';
import { logger } from '@/src/lib/logger';

export const runtime = 'nodejs';

/**
 * On-Demand-ISR: erneuert die Presse-Seiten sofort, sobald eine Meldung
 * veröffentlicht/geändert wird.
 *
 * Aufruf durch einen Supabase-Database-Webhook auf der Tabelle `posts`
 * (INSERT/UPDATE/DELETE) → POST hierher. Ohne den Webhook greift weiterhin die
 * stündliche ISR-Baseline der Seite.
 *
 * Absicherung über ein geteiltes Secret (`REVALIDATE_SECRET`) im Header
 * `x-revalidate-secret` oder als Query `?secret=` — sonst könnte jeder ein
 * Neu-Rendern auslösen. Ohne gesetztes Secret ist der Endpunkt deaktiviert
 * (fail-closed).
 */
export async function POST(request: NextRequest) {
  const erwartet = process.env.REVALIDATE_SECRET;
  if (!erwartet) {
    logger.warn('Revalidate-Aufruf ohne konfiguriertes REVALIDATE_SECRET — deaktiviert');
    return NextResponse.json({ error: 'Revalidierung nicht konfiguriert.' }, { status: 503 });
  }

  const uebergeben =
    request.headers.get('x-revalidate-secret') ?? new URL(request.url).searchParams.get('secret');

  if (uebergeben !== erwartet) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });
  }

  // Presse-Seite in jeder Sprache neu erzeugen.
  for (const locale of locales) {
    revalidatePath(`/${locale}/presse`);
  }

  logger.info({ pfade: locales.length }, 'Presse-Seiten revalidiert');
  return NextResponse.json({ success: true, revalidated: true });
}
