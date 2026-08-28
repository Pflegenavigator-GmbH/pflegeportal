export const CASE_COOKIE = 'pf_case_code';
export const BETA_ACCESS_MONTHS = 12;

// Die Codes werden von der DB erzeugt. Diese Prüfung ist bewusst mit älteren
// Codes kompatibel und verhindert zugleich ungefilterte Eingaben.
export const CASE_CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]{3,63}$/;

export interface CaseAccessRecord {
  billing_status: string;
  product_tier: string | null;
  access_activated_at: string | null;
}

export interface CaseAccessStatus {
  isExpired: boolean;
  isUnlocked: boolean;
}

export function normalizeCaseCode(caseCode: string): string {
  return caseCode.trim().toUpperCase();
}

export function isValidCaseCode(caseCode: string): boolean {
  return CASE_CODE_PATTERN.test(normalizeCaseCode(caseCode));
}

/** Zentrale Richtlinie für Freischaltung und den zwölfmonatigen Beta-Zugang. */
export function evaluateCaseAccess(
  currentCase: CaseAccessRecord,
  now: Date = new Date()
): CaseAccessStatus {
  let isExpired = false;

  if (currentCase.product_tier === 'beta' && currentCase.access_activated_at) {
    const expirationDate = new Date(currentCase.access_activated_at);
    if (!Number.isNaN(expirationDate.getTime())) {
      expirationDate.setMonth(expirationDate.getMonth() + BETA_ACCESS_MONTHS);
      isExpired = now > expirationDate;
    }
  }

  return {
    isExpired,
    isUnlocked:
      !isExpired &&
      (currentCase.billing_status === 'paid' || currentCase.billing_status === 'free'),
  };
}
