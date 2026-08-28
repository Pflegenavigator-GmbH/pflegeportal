// src/lib/api/case-auth.ts
import { cookies } from 'next/headers';

import { NotFoundError, UnauthorizedError, ValidationError } from '@/src/lib/api/errors';
import {
  CASE_COOKIE,
  evaluateCaseAccess,
  isValidCaseCode,
  normalizeCaseCode,
} from '@/src/lib/cases/access-policy';
import { createAdminSupabaseClient } from '@/src/lib/supabase/admin';

export interface CaseSession {
  caseId: string;
  caseCode: string;
  billingStatus: string;
  productTier: string | null;
  isUnlocked: boolean;
}

/**
 * Zentrale Autorisierung für alle fallbezogenen Operationen.
 * Prüft: Format des Codes, Übereinstimmung mit dem HTTP-only-Session-Cookie
 * und Existenz des Falls. Wirft typisierte Fehler, die handleApiError()
 * in korrekte HTTP-Statuscodes (400/401/404) übersetzt.
 */
export async function requireCaseSession(expectedCode: string): Promise<CaseSession> {
  const cleanedCode = normalizeCaseCode(expectedCode);

  if (!isValidCaseCode(cleanedCode)) {
    throw new ValidationError('Ungültiges Fallcode-Format.');
  }

  const cookieStore = await cookies();
  const sessionCode = cookieStore.get(CASE_COOKIE)?.value?.trim().toUpperCase();

  if (!sessionCode || sessionCode !== cleanedCode) {
    throw new UnauthorizedError('Fall-Session fehlt oder passt nicht zum angeforderten Fall.', {
      expectedCode: cleanedCode,
      hasSessionCookie: Boolean(sessionCode),
    });
  }

  const supabase = createAdminSupabaseClient();
  const { data: currentCase, error } = await supabase
    .from('cases')
    .select('id, case_code, billing_status, product_tier, access_activated_at')
    .eq('case_code', cleanedCode)
    .single();

  if (error || !currentCase) {
    throw new NotFoundError('Fall', cleanedCode);
  }

  const access = evaluateCaseAccess(currentCase);
  if (access.isExpired) {
    throw new UnauthorizedError('Der zeitlich begrenzte Beta-Zugang ist abgelaufen.', {
      caseCode: cleanedCode,
      reason: 'beta_expired',
    });
  }

  return {
    caseId: currentCase.id,
    caseCode: currentCase.case_code,
    billingStatus: currentCase.billing_status,
    productTier: currentCase.product_tier,
    isUnlocked: access.isUnlocked,
  };
}
