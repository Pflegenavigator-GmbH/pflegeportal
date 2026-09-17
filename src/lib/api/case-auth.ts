// src/lib/api/case-auth.ts
import { cookies } from 'next/headers';

import { NotFoundError, UnauthorizedError, ValidationError } from '@/src/lib/api/errors';
import { normalizeCaseCode } from '@/src/lib/case-code';
import { berechneCaseCodeHash, gleicherFallcode } from '@/src/lib/case-code-server';
import { createAdminSupabaseClient } from '@/src/lib/supabase/admin';

const CASE_COOKIE = 'pf_case_code';

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

  if (!cleanedCode) {
    throw new ValidationError('Ungültiges Fallcode-Format.');
  }

  const cookieStore = await cookies();
  const sessionCode = normalizeCaseCode(cookieStore.get(CASE_COOKIE)?.value);

  // Vergleich in konstanter Zeit: Ein `===` bricht beim ersten abweichenden
  // Zeichen ab und verrät über die Laufzeit, wie weit ein Rateversuch stimmte.
  if (!sessionCode || !gleicherFallcode(sessionCode, cleanedCode)) {
    // Den angefragten Code NICHT in den Kontext legen: Der Kontext landet in
    // Laufzeit-Log und `system_logs.metadata` (Issue #145).
    throw new UnauthorizedError('Fall-Session fehlt oder passt nicht zum angeforderten Fall.', {
      hasSessionCookie: Boolean(sessionCode),
    });
  }

  const supabase = createAdminSupabaseClient();
  const { data: currentCase, error } = await supabase
    .from('cases')
    .select('id, billing_status, product_tier')
    .eq('case_code_hash', berechneCaseCodeHash(cleanedCode))
    .single();

  if (error || !currentCase) {
    // Ohne Kennung: Die Meldung landet in `system_logs.message` (Issue #145).
    throw new NotFoundError('Fall');
  }

  return {
    caseId: currentCase.id,
    // Aus der Eingabe, nicht aus der Datenbank: Der Klartext wird dort nicht
    // mehr gelesen (#153).
    caseCode: cleanedCode,
    billingStatus: currentCase.billing_status,
    productTier: currentCase.product_tier,
    isUnlocked: currentCase.billing_status === 'paid' || currentCase.billing_status === 'free',
  };
}
