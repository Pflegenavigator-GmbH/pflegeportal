// src/app/actions/case-sessions.ts
'use server';

import { cookies } from 'next/headers';

import { logger } from '@/src/lib/logger';
import { createServerSupabaseClient } from '@/src/lib/supabase/server';

interface SessionStatus {
  success: boolean;
  isUnlocked: boolean;
  isExpired: boolean;
  billingStatus: string;
  caseCode: string | null;
  message?: string;
}

export async function validateAndStoreSession(caseCode: string): Promise<SessionStatus> {
  logger.info({ caseCode }, 'Validiere Fall-Session');

  try {
    const cookieStore = await cookies();
    const supabase = await createServerSupabaseClient();

    const { data: currentCase, error } = await supabase
      .from('cases')
      .select('case_code, billing_status, access_activated_at, product_tier')
      .eq('case_code', caseCode.toUpperCase())
      .single();

    if (error || !currentCase) {
      logger.warn({ caseCode }, 'Fall nicht gefunden oder Datenbankfehler');
      return {
        success: false,
        isUnlocked: false,
        isExpired: false,
        billingStatus: 'pending',
        caseCode: null,
      };
    }

    let isExpired = false;

    // Eiserne Regel aus Block 10: Beta-Tester haben exakt 12 Monate Zugriff
    if (currentCase.product_tier === 'beta' && currentCase.access_activated_at) {
      const activationDate = new Date(currentCase.access_activated_at);
      const expirationDate = new Date(activationDate);
      expirationDate.setFullYear(expirationDate.getFullYear() + 1);

      if (new Date() > expirationDate) {
        isExpired = true;
        logger.info({ caseCode, activationDate }, 'Beta-Zugriff abgelaufen');
      }
    }

    const isUnlocked =
      (currentCase.billing_status === 'paid' || currentCase.billing_status === 'free') &&
      !isExpired;

    // Wenn der Fall gültig und freigeschaltet ist, setzen wir das verschlüsselte HTTP-Only Cookie
    if (isUnlocked) {
      cookieStore.set('pf_case_code', currentCase.case_code, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 30, // 30 Tage gültig
        path: '/',
      });
      logger.debug({ caseCode }, 'Session-Cookie erfolgreich gesetzt');
    } else {
      logger.warn({ caseCode, isUnlocked, isExpired }, 'Zugriff verweigert');
    }

    return {
      success: true,
      isUnlocked,
      isExpired,
      billingStatus: currentCase.billing_status,
      caseCode: currentCase.case_code,
    };
  } catch (err) {
    logger.error({ err, caseCode }, 'Kritischer Fehler bei Session-Validierung');
    return {
      success: false,
      isUnlocked: false,
      isExpired: false,
      billingStatus: 'failed',
      caseCode: null,
    };
  }
}
