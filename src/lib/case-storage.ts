// src/lib/case-storage.ts
const CASE_CODE_KEY = 'case_code';
export const CASE_CODE_EVENT = 'case-code-changed';

/**
 * Schreibt den Fallcode in den localStorage und benachrichtigt alle
 * Komponenten im selben Tab (Custom Event) sowie andere Tabs (storage-Event
 * feuert der Browser automatisch).
 */
export function storeCaseCode(code: string): void {
  localStorage.setItem(CASE_CODE_KEY, code.trim().toUpperCase());
  window.dispatchEvent(new Event(CASE_CODE_EVENT));
}

export function clearCaseCode(): void {
  localStorage.removeItem(CASE_CODE_KEY);
  window.dispatchEvent(new Event(CASE_CODE_EVENT));
}

export function getStoredCaseCode(): string | null {
  if (typeof window === 'undefined') return null; // SSR-sicher
  const code = localStorage.getItem(CASE_CODE_KEY);
  return code ? code.toUpperCase() : null;
}
