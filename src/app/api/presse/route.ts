// src/app/api/presse/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { isValidLocale } from '@/src/i18n/config';
import { handleApiError } from '@/src/lib/api/error-handler';
import { normalisiereKategorie } from '@/src/lib/presse/kategorien';
import { ladeMeldungen } from '@/src/lib/presse/queries';

export const runtime = 'nodejs';

/** Länge kappen — schützt die Volltextsuche vor überlangen Eingaben. */
const MAX_SUCHE = 200;

/**
 * Öffentliche Suche/Filterung der Pressemeldungen — für die Live-Suche im
 * Client. Liefert ausschließlich veröffentlichte Beiträge (RLS + Query).
 * Das Rate-Limit greift automatisch über die Edge-Middleware.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const localeParam = searchParams.get('locale') ?? '';
    const locale = isValidLocale(localeParam) ? localeParam : 'de';
    const kategorie = normalisiereKategorie(searchParams.get('kategorie') ?? undefined);
    const suche = (searchParams.get('q') ?? '').slice(0, MAX_SUCHE);

    const meldungen = await ladeMeldungen({ locale, kategorie, suche });

    return NextResponse.json({ success: true, data: meldungen });
  } catch (err) {
    return handleApiError(err, 'api.presse.list');
  }
}
