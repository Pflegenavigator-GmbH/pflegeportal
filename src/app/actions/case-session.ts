// src/app/actions/case-session.ts
'use server';

import { cookies } from 'next/headers';

import { logger } from '@/src/lib/logger';
import { createAdminSupabaseClient } from '@/src/lib/supabase/admin';

const CASE_COOKIE = 'pf_case_code';
const BETA_ACCESS_MONTHS = 12;
const CASE_CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]{3,63}$/;

interface SessionStatus {
  /** Fall existiert in der DB und ist nicht abgelaufen → Session gültig */
  success: boolean;
  /** Premium-Features freigeschaltet (paid/free) — NICHT Voraussetzung für eine gültige Session */
  isUnlocked: boolean;
  isExpired: boolean;
  billingStatus: string;
  caseCode: string | null;
  message?: string;
}

export async function validateAndStoreSession(caseCode: string): Promise<SessionStatus> {
  const cleanedCode = caseCode.trim().toUpperCase();
  logger.info({ caseCode: cleanedCode }, 'Validiere Fall-Session');

  const denied = (billingStatus: string, isExpired = false): SessionStatus => ({
    success: false,
    isUnlocked: false,
    isExpired,
    billingStatus,
    caseCode: null,
  });

  if (!CASE_CODE_PATTERN.test(cleanedCode)) {
    logger.warn({ caseCode: cleanedCode }, 'Fallcode mit ungültigem Format abgelehnt');
    return denied('invalid_format');
  }

  try {
    const cookieStore = await cookies();
    const supabase = createAdminSupabaseClient();

    const { data: currentCase, error } = await supabase
      .from('cases')
      .select('case_code, billing_status, access_activated_at, product_tier')
      .eq('case_code', cleanedCode)
      .single();

    if (error || !currentCase) {
      logger.warn({ caseCode: cleanedCode }, 'Fall nicht gefunden oder Datenbankfehler');
      cookieStore.delete(CASE_COOKIE); // kein verwaistes Cookie zurücklassen
      return denied('not_found');
    }

    // Beta-Tester haben exakt 12 Monate Zugriff
    let isExpired = false;
    if (currentCase.product_tier === 'beta' && currentCase.access_activated_at) {
      const expirationDate = new Date(currentCase.access_activated_at);
      expirationDate.setMonth(expirationDate.getMonth() + BETA_ACCESS_MONTHS);

      if (new Date() > expirationDate) {
        isExpired = true;
        logger.info(
          { caseCode: cleanedCode, activatedAt: currentCase.access_activated_at },
          'Beta-Zugriff abgelaufen'
        );
      }
    }

    if (isExpired) {
      cookieStore.delete(CASE_COOKIE);
      return {
        success: true, // Fall existiert — die UI soll den Ablauf erklären, nicht "ungültig" melden
        isUnlocked: false,
        isExpired: true,
        billingStatus: currentCase.billing_status,
        caseCode: currentCase.case_code,
      };
    }

    // ✅ Session-Gültigkeit ≠ Bezahlstatus:
    // Das Cookie wird für JEDEN existierenden, nicht abgelaufenen Fall gesetzt —
    // auch bei billing_status 'pending'. Premium-Gates regeln die Seiten selbst
    // über isUnlocked (Paywall).
    cookieStore.set(CASE_COOKIE, currentCase.case_code, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30, // 30 Tage
      path: '/',
    });

    const isUnlocked =
      currentCase.billing_status === 'paid' || currentCase.billing_status === 'free';

    logger.debug({ caseCode: cleanedCode, isUnlocked }, 'Session-Cookie gesetzt');

    return {
      success: true,
      isUnlocked,
      isExpired: false,
      billingStatus: currentCase.billing_status,
      caseCode: currentCase.case_code,
    };
  } catch (err) {
    logger.error({ err, caseCode: cleanedCode }, 'Kritischer Fehler bei Session-Validierung');
    return denied('failed');
  }
}

/**
 * Session serverseitig beenden — Gegenstück zu handleSessionReset im Client.
 * Ohne diesen Aufruf bleibt das HTTP-only-Cookie 30 Tage gültig,
 * obwohl der Client "abgemeldet" ist.
 */
export async function clearCaseSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(CASE_COOKIE);
  logger.info('Fall-Session-Cookie entfernt');
}
