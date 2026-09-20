// src/lib/api/case-auth.ts
import { UnauthorizedError } from '@/src/lib/api/errors';
import { leseSitzung, uebernehmeAltesCookie, type Sitzung } from '@/src/lib/api/session';

export interface CaseSession {
  caseId: string;
  billingStatus: string;
  productTier: string | null;
  isUnlocked: boolean;
}

/**
 * Zentrale Autorisierung für alle fallbezogenen Operationen (#135).
 *
 * Bis zum 19.09.2026 nahm diese Funktion einen Fallcode entgegen und verglich
 * ihn mit dem Cookie `pf_case_code`, in dem derselbe Code stand. Das war keine
 * Prüfung, sondern ein Vergleich des Zugangsmittels mit sich selbst: Wer den
 * Code hatte, kam hinein — dauerhaft, unwiderruflich, ohne Ablauf.
 *
 * Jetzt entscheidet allein die Sitzung. Der Fall ergibt sich aus ihr; ein vom
 * Aufrufer mitgeschickter Code hat keine Berechtigungswirkung mehr und wird
 * deshalb gar nicht erst entgegengenommen.
 */
export async function requireCaseSession(): Promise<CaseSession> {
  const sitzung = (await leseSitzung()) ?? (await uebernehmeAltesCookie());

  if (!sitzung) {
    // Ohne Kennung im Kontext: Er landet in Laufzeit-Log und
    // `system_logs.metadata` (Issue #145).
    throw new UnauthorizedError('Keine gültige Fall-Sitzung.');
  }

  return zuCaseSession(sitzung);
}

/**
 * Wie {@link requireCaseSession}, wirft aber nicht. Für Stellen, die ohne
 * Sitzung einfach nichts anzeigen statt einen Fehler zu melden.
 */
export async function leseCaseSession(): Promise<CaseSession | null> {
  const sitzung = (await leseSitzung()) ?? (await uebernehmeAltesCookie());
  return sitzung ? zuCaseSession(sitzung) : null;
}

function zuCaseSession(sitzung: Sitzung): CaseSession {
  return {
    caseId: sitzung.caseId,
    billingStatus: sitzung.billingStatus,
    productTier: sitzung.productTier,
    isUnlocked: sitzung.isUnlocked,
  };
}
