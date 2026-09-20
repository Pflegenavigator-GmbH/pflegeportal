// src/app/actions/case-session.ts
'use server';

import { beendeSitzung, erzeugeSitzung } from '@/src/lib/api/session';
import { normalizeCaseCode } from '@/src/lib/case-code';
import { berechneCaseCodeHash } from '@/src/lib/case-code-server';
import { logger } from '@/src/lib/logger';
import { createAdminSupabaseClient } from '@/src/lib/supabase/admin';

const BETA_ACCESS_MONTHS = 12;

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
  const cleanedCode = normalizeCaseCode(caseCode);
  // Den Fallcode an keiner Stelle protokollieren — er ist das Zugangsmittel
  // (Issue #145). Fallbezug im Log ist die case_id, sobald der Fall gefunden ist.
  logger.info('Validiere Fall-Session');

  const denied = (billingStatus: string, isExpired = false): SessionStatus => ({
    success: false,
    isUnlocked: false,
    isExpired,
    billingStatus,
    caseCode: null,
  });

  if (!cleanedCode) {
    logger.warn('Fallcode mit ungültigem Format abgelehnt');
    return denied('invalid_format');
  }

  try {
    const supabase = createAdminSupabaseClient();

    const { data: currentCase, error } = await supabase
      .from('cases')
      .select('id, billing_status, access_activated_at, product_tier')
      .eq('case_code_hash', berechneCaseCodeHash(cleanedCode))
      .single();

    if (error || !currentCase) {
      logger.warn('Fall nicht gefunden oder Datenbankfehler');
      await beendeSitzung(); // keine verwaiste Sitzung zurücklassen
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
          { caseId: currentCase.id, activatedAt: currentCase.access_activated_at },
          'Beta-Zugriff abgelaufen'
        );
      }
    }

    if (isExpired) {
      await beendeSitzung();
      return {
        success: true, // Fall existiert — die UI soll den Ablauf erklären, nicht "ungültig" melden
        isUnlocked: false,
        isExpired: true,
        billingStatus: currentCase.billing_status,
        caseCode: cleanedCode,
      };
    }

    // ✅ Sitzungsgültigkeit ≠ Bezahlstatus:
    // Die Sitzung entsteht für JEDEN existierenden, nicht abgelaufenen Fall —
    // auch bei billing_status 'pending'. Premium-Gates regeln die Seiten selbst
    // über isUnlocked (Paywall).
    //
    // Seit #135 steht im Cookie ein undurchsichtiger Sitzungsnachweis, nicht
    // mehr der Fallcode. Eine bestehende Sitzung desselben Geräts wird dabei
    // ersetzt, nicht ergänzt — beim Fallwechsel darf die alte nicht offen
    // bleiben.
    await beendeSitzung();
    await erzeugeSitzung(currentCase.id);

    const isUnlocked =
      currentCase.billing_status === 'paid' || currentCase.billing_status === 'free';

    logger.debug({ caseId: currentCase.id, isUnlocked }, 'Sitzung angelegt');

    return {
      success: true,
      isUnlocked,
      isExpired: false,
      billingStatus: currentCase.billing_status,
      caseCode: cleanedCode,
    };
  } catch (err) {
    logger.error({ err }, 'Kritischer Fehler bei Session-Validierung');
    return denied('failed');
  }
}

/**
 * Session serverseitig beenden — Gegenstück zu handleSessionReset im Client.
 * Ohne diesen Aufruf bleibt das HTTP-only-Cookie 30 Tage gültig,
 * obwohl der Client "abgemeldet" ist.
 */
export async function clearCaseSession(): Promise<void> {
  await beendeSitzung();
  logger.info('Fall-Sitzung beendet');
}
