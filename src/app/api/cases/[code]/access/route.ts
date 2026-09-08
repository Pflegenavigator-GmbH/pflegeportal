// src/api/cases/[code]/access/route.ts
// Leichtgewichtige Lizenz-/Freischaltungsabfrage. Ersetzt den früheren
// Workaround, für einen Lizenzcheck ein Dummy-PDF über Puppeteer zu erzeugen
// (das zusätzlich den PDF-Cache vergiftet hat).
import { NextRequest, NextResponse } from 'next/server';

import { requireCaseSession } from '@/src/lib/api/case-auth';
import { handleApiError } from '@/src/lib/api/error-handler';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  try {
    const session = await requireCaseSession(code);

    return NextResponse.json({
      isUnlocked: session.isUnlocked,
      billingStatus: session.billingStatus,
      productTier: session.productTier,
    });
  } catch (err) {
    return handleApiError(err, 'api.cases.access.get', code);
  }
}
